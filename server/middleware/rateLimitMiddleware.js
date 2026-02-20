import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/redis.js';

/**
 * Rate Limiting Middleware for High-Traffic QR Scanning
 * Protects against abuse and ensures fair resource allocation
 */

/**
 * Redis-backed rate limit store for distributed systems
 */
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'ratelimit:';
    this.client = null;
    this.errorLogged = false;
  }

  async init() {
    this.client = getRedisClient();
  }

  async increment(key) {
    if (!this.client) {
      // Fallback to memory-based if Redis unavailable
      return { totalHits: 1, resetTime: new Date(Date.now() + 60000) };
    }

    try {
      const prefixedKey = `${this.prefix}${key}`;
      const current = await this.client.incr(prefixedKey);
      
      if (current === 1) {
        await this.client.expire(prefixedKey, 60); // 1 minute window
      }
      
      const ttl = await this.client.ttl(prefixedKey);
      const resetTime = new Date(Date.now() + ttl * 1000);
      
      return { totalHits: current, resetTime };
    } catch (error) {
      if (!this.errorLogged) {
        console.error('[RATE_LIMIT] Redis error - Using in-memory fallback');
        this.errorLogged = true;
      }
      return { totalHits: 1, resetTime: new Date(Date.now() + 60000) };
    }
  }

  async decrement(key) {
    if (!this.client) return;
    
    try {
      const prefixedKey = `${this.prefix}${key}`;
      await this.client.decr(prefixedKey);
    } catch (error) {
      // Silent fail - fallback to in-memory
    }
  }

  async resetKey(key) {
    if (!this.client) return;
    
    try {
      const prefixedKey = `${this.prefix}${key}`;
      await this.client.del(prefixedKey);
    } catch (error) {
      // Silent fail - fallback to in-memory
    }
  }
}

// Initialize Redis store
const redisStore = new RedisStore();
redisStore.init();

/**
 * Standard rate limiter for general scanner API endpoints
 * Allows 100 requests per minute per device
 */
export const scannerRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per device
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  },
  keyGenerator: (req) => {
    // Use device ID + IP for unique identification
    const deviceId = req.headers['x-device-id'] || 'unknown';
    const ip = req.ip || req.connection.remoteAddress;
    return `${deviceId}:${ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for super admins (emergency access)
    return req.user && req.user.role === 'super_admin';
  },
  handler: (req, res) => {
    console.warn('[RATE_LIMIT] Limit exceeded:', {
      deviceId: req.headers['x-device-id'],
      ip: req.ip,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many scan requests. Please wait before trying again.',
      retryAfter: 60
    });
  }
});

/**
 * Aggressive rate limiter for QR validation endpoint
 * Allows 60 scans per minute per device (1 per second average)
 */
export const qrValidationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 scans per minute (1 per second)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const deviceId = req.headers['x-device-id'] || 'unknown';
    const staffId = req.user?.id || 'anonymous';
    return `qr:${deviceId}:${staffId}`;
  },
  skip: (req) => {
    return req.user && req.user.role === 'super_admin';
  },
  handler: (req, res) => {
    console.warn('[RATE_LIMIT] QR validation limit exceeded:', {
      deviceId: req.headers['x-device-id'],
      staffId: req.user?.id,
      ip: req.ip
    });
    
    res.status(429).json({
      success: false,
      error: 'Scan rate limit exceeded',
      message: 'You are scanning too fast. Please slow down to maintain system stability.',
      retryAfter: 60
    });
  }
});

/**
 * Offline sync rate limiter
 * Allows 10 batch syncs per 5 minutes per device
 */
export const offlineSyncRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 batch syncs per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const deviceId = req.headers['x-device-id'] || 'unknown';
    return `sync:${deviceId}`;
  },
  handler: (req, res) => {
    console.warn('[RATE_LIMIT] Offline sync limit exceeded:', {
      deviceId: req.headers['x-device-id'],
      ip: req.ip
    });
    
    res.status(429).json({
      success: false,
      error: 'Sync rate limit exceeded',
      message: 'Too many offline sync requests. Please wait before syncing again.',
      retryAfter: 300
    });
  }
});

/**
 * Analytics/dashboard rate limiter
 * Allows 100 requests per minute for dashboard endpoints
 * Increased from 20 to support:
 * - 4 concurrent analytics requests × 6 refreshes/minute = 24 baseline requests
 * - Multiple concurrent admin users (up to 4 users)
 * - Natural burst traffic from dashboard interactions
 */
export const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (per user)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id || req.ip;
    return `analytics:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Analytics rate limit exceeded',
      message: 'Too many analytics requests. Please refresh less frequently.',
      retryAfter: 60
    });
  }
});

/**
 * Custom abuse detection middleware
 * Detects suspicious patterns (e.g., rapid duplicate scan attempts)
 */
export const abuseDetectionMiddleware = async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'];
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID required',
        message: 'Please provide a valid device identifier'
      });
    }
    
    const client = getRedisClient();
    if (!client) {
      // If Redis unavailable, allow request but log warning
      console.warn('[ABUSE] Redis unavailable, skipping abuse detection');
      return next();
    }
    
    // Track failed validation attempts
    if (req.body?.failed || req.query?.failed) {
      const failKey = `abuse:fail:${deviceId}`;
      const failCount = await client.incr(failKey);
      await client.expire(failKey, 300); // 5 minutes
      
      if (failCount > 20) {
        // More than 20 failed validations in 5 minutes
        console.error('[ABUSE] Suspicious activity detected:', {
          deviceId,
          ip,
          failCount
        });
        
        return res.status(403).json({
          success: false,
          error: 'Suspicious activity detected',
          message: 'Your device has been temporarily blocked due to unusual activity. Please contact support.'
        });
      }
    }
    
    // Track duplicate scan attempts
    const qrCodeId = req.body?.qrCodeId || req.params?.qrCodeId;
    if (qrCodeId) {
      const dupKey = `abuse:dup:${deviceId}:${qrCodeId}`;
      const dupCount = await client.incr(dupKey);
      await client.expire(dupKey, 60); // 1 minute
      
      if (dupCount > 5) {
        // Same QR scanned more than 5 times in 1 minute by same device
        console.warn('[ABUSE] Excessive duplicate attempts:', {
          deviceId,
          qrCodeId,
          dupCount
        });
        
        // Don't block, but log for investigation
        req.suspiciousActivity = true;
      }
    }
    
    next();
  } catch (error) {
    console.error('[ABUSE] Detection error:', error);
    // Don't block on errors, just log and continue
    next();
  }
};

/**
 * Device authentication middleware
 * Verifies scanner device token
 */
export const deviceAuthMiddleware = (req, res, next) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    
    if (!deviceToken) {
      return res.status(401).json({
        success: false,
        error: 'Device token required',
        message: 'Scanner devices must provide a valid authentication token'
      });
    }
    
    // Import verification function here to avoid circular dependencies
    import('../utils/qrSecurity.js').then(({ verifyDeviceToken }) => {
      const tokenData = verifyDeviceToken(deviceToken, 24);
      
      if (!tokenData) {
        return res.status(401).json({
          success: false,
          error: 'Invalid device token',
          message: 'Device token is invalid or expired. Please re-authenticate.'
        });
      }
      
      // Attach device info to request
      req.device = {
        deviceId: tokenData.deviceId,
        staffId: tokenData.staffId,
        eventId: tokenData.eventId,
        issuedAt: tokenData.issuedAt
      };
      
      next();
    }).catch(error => {
      console.error('[DEVICE_AUTH] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Failed to verify device token'
      });
    });
  } catch (error) {
    console.error('[DEVICE_AUTH] Middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * IP whitelist middleware (optional, for additional security)
 * Only allow scanning from specific IP ranges (e.g., venue WiFi)
 */
export const ipWhitelistMiddleware = (allowedRanges = []) => {
  return (req, res, next) => {
    if (allowedRanges.length === 0) {
      // No whitelist configured, allow all
      return next();
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Check if IP is in allowed ranges
    const isAllowed = allowedRanges.some(range => {
      // Simple CIDR check (can be enhanced with ip-range library)
      return clientIp.startsWith(range);
    });
    
    if (!isAllowed) {
      console.warn('[IP_WHITELIST] Blocked IP:', clientIp);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Scanning is only allowed from authorized networks'
      });
    }
    
    next();
  };
};

export default {
  scannerRateLimiter,
  qrValidationRateLimiter,
  offlineSyncRateLimiter,
  analyticsRateLimiter,
  abuseDetectionMiddleware,
  deviceAuthMiddleware,
  ipWhitelistMiddleware
};

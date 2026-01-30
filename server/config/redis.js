import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Configuration for High-Performance QR Caching
 * Handles 10,000-20,000 concurrent scans with sub-millisecond lookups
 */

let redisClient = null;
let isConnected = false;

const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[REDIS] Max reconnection attempts reached');
        return new Error('Redis connection failed');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`[REDIS] Reconnecting in ${delay}ms...`);
      return delay;
    }
  }
};

/**
 * Initialize Redis connection
 */
export const connectRedis = async () => {
  if (isConnected && redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient(REDIS_CONFIG);

    redisClient.on('error', (err) => {
      console.error('[REDIS] Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[REDIS] Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('[REDIS] Connected and ready');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('[REDIS] Reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[REDIS] Connection failed:', error);
    isConnected = false;
    throw error;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  if (!isConnected || !redisClient) {
    console.warn('[REDIS] Client not connected. Some features may be degraded.');
    return null;
  }
  return redisClient;
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = () => {
  return isConnected && redisClient !== null;
};

/**
 * Gracefully disconnect Redis
 */
export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[REDIS] Disconnected gracefully');
      isConnected = false;
      redisClient = null;
    } catch (error) {
      console.error('[REDIS] Error during disconnect:', error);
      await redisClient.disconnect();
    }
  }
};

/**
 * QR Cache Operations - Optimized for High-Traffic Events
 */

// Cache key prefixes
const QR_SCANNED_PREFIX = 'qr:scanned:';
const QR_DATA_PREFIX = 'qr:data:';
const ENTRY_COUNT_PREFIX = 'entry:count:';
const GATE_COUNT_PREFIX = 'gate:count:';
const STAFF_COUNT_PREFIX = 'staff:count:';

// TTL (Time To Live) in seconds
const QR_SCANNED_TTL = 86400 * 7; // 7 days
const QR_DATA_TTL = 3600; // 1 hour
const COUNT_TTL = 86400; // 24 hours

/**
 * Check if QR code has been scanned
 * @param {string} qrCodeId - QR code identifier
 * @returns {Promise<boolean>}
 */
export const isQRScanned = async (qrCodeId) => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const key = `${QR_SCANNED_PREFIX}${qrCodeId}`;
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('[REDIS] Error checking QR scan:', error);
    return false;
  }
};

/**
 * Mark QR code as scanned (with atomic operation)
 * @param {string} qrCodeId - QR code identifier
 * @param {Object} scanData - Scan metadata
 * @returns {Promise<boolean>} - true if successfully marked, false if already scanned
 */
export const markQRAsScanned = async (qrCodeId, scanData) => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const key = `${QR_SCANNED_PREFIX}${qrCodeId}`;
    
    // Use SET with NX (only set if not exists) for atomic operation
    // This prevents race conditions when multiple scanners scan the same QR
    const result = await client.set(key, JSON.stringify({
      ...scanData,
      scannedAt: new Date().toISOString()
    }), {
      NX: true, // Only set if key doesn't exist
      EX: QR_SCANNED_TTL
    });

    return result === 'OK';
  } catch (error) {
    console.error('[REDIS] Error marking QR as scanned:', error);
    return false;
  }
};

/**
 * Get QR scan data
 * @param {string} qrCodeId - QR code identifier
 * @returns {Promise<Object|null>}
 */
export const getQRScanData = async (qrCodeId) => {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const key = `${QR_SCANNED_PREFIX}${qrCodeId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[REDIS] Error getting QR scan data:', error);
    return null;
  }
};

/**
 * Cache booking/ticket data for fast lookup
 * @param {string} qrCodeId - QR code identifier
 * @param {Object} ticketData - Ticket/booking data
 */
export const cacheTicketData = async (qrCodeId, ticketData) => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const key = `${QR_DATA_PREFIX}${qrCodeId}`;
    await client.setEx(key, QR_DATA_TTL, JSON.stringify(ticketData));
    return true;
  } catch (error) {
    console.error('[REDIS] Error caching ticket data:', error);
    return false;
  }
};

/**
 * Get cached ticket data
 * @param {string} qrCodeId - QR code identifier
 * @returns {Promise<Object|null>}
 */
export const getCachedTicketData = async (qrCodeId) => {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const key = `${QR_DATA_PREFIX}${qrCodeId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[REDIS] Error getting cached ticket data:', error);
    return null;
  }
};

/**
 * Increment entry count for an event (atomic operation)
 * @param {string} eventId - Event ID
 * @returns {Promise<number>} - New count
 */
export const incrementEntryCount = async (eventId) => {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const key = `${ENTRY_COUNT_PREFIX}${eventId}`;
    const count = await client.incr(key);
    await client.expire(key, COUNT_TTL);
    return count;
  } catch (error) {
    console.error('[REDIS] Error incrementing entry count:', error);
    return 0;
  }
};

/**
 * Get entry count for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<number>}
 */
export const getEntryCount = async (eventId) => {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const key = `${ENTRY_COUNT_PREFIX}${eventId}`;
    const count = await client.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('[REDIS] Error getting entry count:', error);
    return 0;
  }
};

/**
 * Increment gate count (atomic operation)
 * @param {string} eventId - Event ID
 * @param {string} gateId - Gate ID
 * @returns {Promise<number>}
 */
export const incrementGateCount = async (eventId, gateId) => {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const key = `${GATE_COUNT_PREFIX}${eventId}:${gateId}`;
    const count = await client.incr(key);
    await client.expire(key, COUNT_TTL);
    return count;
  } catch (error) {
    console.error('[REDIS] Error incrementing gate count:', error);
    return 0;
  }
};

/**
 * Get all gate counts for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>}
 */
export const getGateCounts = async (eventId) => {
  const client = getRedisClient();
  if (!client) return {};

  try {
    const pattern = `${GATE_COUNT_PREFIX}${eventId}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) return {};

    const counts = {};
    for (const key of keys) {
      const gateId = key.split(':').pop();
      const count = await client.get(key);
      counts[gateId] = parseInt(count, 10) || 0;
    }
    
    return counts;
  } catch (error) {
    console.error('[REDIS] Error getting gate counts:', error);
    return {};
  }
};

/**
 * Increment staff scan count (atomic operation)
 * @param {string} eventId - Event ID
 * @param {string} staffId - Staff ID
 * @returns {Promise<number>}
 */
export const incrementStaffCount = async (eventId, staffId) => {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const key = `${STAFF_COUNT_PREFIX}${eventId}:${staffId}`;
    const count = await client.incr(key);
    await client.expire(key, COUNT_TTL);
    return count;
  } catch (error) {
    console.error('[REDIS] Error incrementing staff count:', error);
    return 0;
  }
};

/**
 * Get all staff counts for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>}
 */
export const getStaffCounts = async (eventId) => {
  const client = getRedisClient();
  if (!client) return {};

  try {
    const pattern = `${STAFF_COUNT_PREFIX}${eventId}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) return {};

    const counts = {};
    for (const key of keys) {
      const staffId = key.split(':').pop();
      const count = await client.get(key);
      counts[staffId] = parseInt(count, 10) || 0;
    }
    
    return counts;
  } catch (error) {
    console.error('[REDIS] Error getting staff counts:', error);
    return {};
  }
};

/**
 * Flush all QR-related caches (use with caution)
 * @param {string} eventId - Optional: flush only for specific event
 */
export const flushQRCache = async (eventId = null) => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (eventId) {
      // Flush only event-specific caches
      const patterns = [
        `${ENTRY_COUNT_PREFIX}${eventId}`,
        `${GATE_COUNT_PREFIX}${eventId}:*`,
        `${STAFF_COUNT_PREFIX}${eventId}:*`
      ];
      
      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
        }
      }
    } else {
      // Flush all (use with extreme caution)
      await client.flushDb();
    }
    
    console.log(`[REDIS] Cache flushed${eventId ? ` for event ${eventId}` : ' (all)'}`);
    return true;
  } catch (error) {
    console.error('[REDIS] Error flushing cache:', error);
    return false;
  }
};

export default {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  disconnectRedis,
  isQRScanned,
  markQRAsScanned,
  getQRScanData,
  cacheTicketData,
  getCachedTicketData,
  incrementEntryCount,
  getEntryCount,
  incrementGateCount,
  getGateCounts,
  incrementStaffCount,
  getStaffCounts,
  flushQRCache
};

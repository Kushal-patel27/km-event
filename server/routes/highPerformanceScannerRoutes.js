import express from 'express';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import {
  qrValidationRateLimiter,
  offlineSyncRateLimiter,
  analyticsRateLimiter,
  abuseDetectionMiddleware
} from '../middleware/rateLimitMiddleware.js';
import * as scannerController from '../controllers/highPerformanceScannerController.js';

const router = express.Router();

/**
 * High-Performance QR Scanner Routes
 * Optimized for large-scale events (10,000-20,000 attendees)
 * 
 * Security: All routes require authentication + staff/admin role
 * Rate Limiting: Applied per endpoint based on expected usage
 * Abuse Protection: Suspicious pattern detection
 */

// Authentication required for all scanner routes
router.use(protect);
router.use(requireRoles('staff', 'staff_admin', 'admin', 'super_admin'));

/**
 * PRIMARY SCANNING ENDPOINT
 * POST /api/scanner/validate-qr
 * Rate Limit: 60 scans/minute per device
 * 
 * High-concurrency safe with Redis + database transactions
 */
router.post(
  '/validate-qr',
  qrValidationRateLimiter,
  abuseDetectionMiddleware,
  scannerController.validateAndScanQR
);

/**
 * OFFLINE SYNC ENDPOINT
 * POST /api/scanner/offline-sync
 * Rate Limit: 10 batches per 5 minutes
 * 
 * For syncing scans collected offline (weak network areas)
 */
router.post(
  '/offline-sync',
  offlineSyncRateLimiter,
  scannerController.syncOfflineScans
);

/**
 * REAL-TIME ANALYTICS
 * GET /api/scanner/analytics/:eventId
 * Rate Limit: 20 requests/minute
 * 
 * Live entry counts, gate-wise traffic, staff statistics
 */
router.get(
  '/analytics/:eventId',
  analyticsRateLimiter,
  scannerController.getRealtimeAnalytics
);

/**
 * DUPLICATE ATTEMPTS LOG
 * GET /api/scanner/duplicate-attempts/:eventId
 * Rate Limit: 20 requests/minute
 * 
 * Security monitoring - track suspicious duplicate scan attempts
 */
router.get(
  '/duplicate-attempts/:eventId',
  analyticsRateLimiter,
  requireRoles('staff_admin', 'admin', 'super_admin'), // More restricted
  scannerController.getDuplicateAttempts
);

/**
 * STAFF PERFORMANCE REPORT
 * GET /api/scanner/staff-report/:eventId
 * Rate Limit: 20 requests/minute
 * 
 * Staff-wise scan statistics for management
 */
router.get(
  '/staff-report/:eventId',
  analyticsRateLimiter,
  requireRoles('staff_admin', 'admin', 'super_admin'),
  scannerController.getStaffReport
);

/**
 * GATE TRAFFIC REPORT
 * GET /api/hp-scanner/gate-report/:eventId
 * Rate Limit: 20 requests/minute
 * 
 * Gate-wise traffic patterns (15min, 1hour, or daily intervals)
 */
router.get(
  '/gate-report/:eventId',
  analyticsRateLimiter,
  requireRoles('staff_admin', 'admin', 'super_admin'),
  scannerController.getGateReport
);

/**
 * ENTRY LOGS FOR ADMINS
 * GET /api/hp-scanner/entry-logs/:eventId
 * Rate Limit: 20 requests/minute
 * 
 * Fetch all successful entry scans with attendee details
 * Accessible to staff_admin and above
 */
router.get(
  '/entry-logs/:eventId',
  analyticsRateLimiter,
  requireRoles('staff_admin', 'admin', 'super_admin'),
  scannerController.getEntryLogs
);

/**
 * BACKWARD COMPATIBILITY
 * Keep existing scanner routes for gradual migration
 */

// Legacy scan endpoint (redirects to new endpoint)
router.post('/scan', qrValidationRateLimiter, (req, res) => {
  // Transform legacy request to new format
  const transformedReq = {
    ...req,
    body: {
      qrPayload: req.body.qrCode || req.body.qrPayload,
      gateId: req.body.gate || req.body.gateId || 'GATE-DEFAULT',
      gateName: req.body.gateName,
      deviceId: req.headers['x-device-id'] || 'LEGACY-DEVICE',
      deviceName: req.body.deviceName || 'Legacy Scanner',
      deviceType: 'mobile'
    }
  };
  
  return scannerController.validateAndScanQR(transformedReq, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    scanner: 'high-performance',
    version: '2.0'
  });
});

// Development endpoint: Clear Redis cache
router.post('/dev/clear-cache', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Not available in production'
    });
  }
  
  // This would require importing Redis client
  // For now, just acknowledge the request
  res.json({
    success: true,
    message: 'Cache clear requested (restart Redis or server to fully clear)',
    timestamp: new Date().toISOString()
  });
});

export default router;

import Booking from '../models/Booking.js';
import EntryLog from '../models/EntryLog.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import {
  isQRScanned,
  markQRAsScanned,
  getCachedTicketData,
  cacheTicketData,
  incrementEntryCount,
  incrementGateCount,
  incrementStaffCount,
  getEntryCount,
  getGateCounts,
  getStaffCounts
} from '../config/redis.js';
import {
  decryptQRPayload,
  validateQRDataStructure,
  hashData
} from '../utils/qrSecurity.js';

/**
 * High-Performance QR Scanner Controller
 * Optimized for 10,000-20,000 attendees with concurrent scanning
 * 
 * Features:
 * - Redis caching for sub-millisecond lookups
 * - Database transactions for race condition prevention
 * - Duplicate scan detection
 * - Offline sync support
 * - Real-time analytics
 */

/**
 * Validate and scan QR code (Primary endpoint)
 * POST /api/scanner/validate-qr
 * 
 * Body: {
 *   qrPayload: "encrypted_qr_string",
 *   gateId: "GATE-A",
 *   deviceId: "SCANNER-001",
 *   deviceName: "Main Entrance Scanner",
 *   deviceType: "mobile|tablet|scanner_device",
 *   localTimestamp: "2026-01-28T10:30:00Z" (optional, for offline sync)
 * }
 */
export const validateAndScanQR = async (req, res) => {
  const startTime = Date.now();
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      qrPayload,
      gateId,
      gateName,
      deviceId,
      deviceName,
      deviceType = 'mobile',
      localTimestamp
    } = req.body;
    
    const staffId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Validation
    if (!qrPayload || !gateId || !deviceId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'QR payload, gate ID, and device ID are required'
      });
    }
    
    // Step 1: Decrypt QR payload (or parse raw JSON if not encrypted)
    let qrData = decryptQRPayload(qrPayload);
    
    // If decryption fails, try parsing as raw JSON
    if (!qrData) {
      try {
        qrData = JSON.parse(qrPayload);
      } catch (e) {
        // Neither encrypted nor valid JSON
        qrData = null;
      }
    }
    
    if (!qrData || !validateQRDataStructure(qrData)) {
      await session.abortTransaction();
      
      // Log failed attempt for security monitoring
      console.warn('[QR_SCAN] Invalid QR payload:', {
        deviceId,
        staffId,
        gateId,
        ip: ipAddress,
        payload: qrPayload?.substring(0, 50) // Log first 50 chars for debugging
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code',
        message: 'The QR code is invalid or has expired',
        validationTime: Date.now() - startTime
      });
    }
    
    const { bookingId, bid, ticketId, idx, eventId, evt, qrCodeId } = qrData;
    
    // Normalize field names (support both encrypted and raw QR formats)
    const normalizedBookingId = bookingId || bid;
    const normalizedEventId = eventId || evt;
    const normalizedQRCodeId = qrCodeId || ticketId; // Fallback to ticketId if no qrCodeId
    
    if (!normalizedBookingId || !normalizedEventId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code structure',
        message: 'QR code missing booking or event information',
        validationTime: Date.now() - startTime
      });
    }
    
    // Step 2: Check Redis cache for duplicate scan (FAST - sub-millisecond)
    let cacheHit = false;
    const alreadyScanned = await isQRScanned(normalizedQRCodeId);
    
    if (alreadyScanned) {
      console.log('[QR_SCAN] Cache indicates duplicate:', {
        qrCodeId: normalizedQRCodeId,
        bookingId: normalizedBookingId,
        eventId: normalizedEventId
      });
      
      // Verify duplicate in database before rejecting (Redis might have stale data)
      const dbEntry = await EntryLog.findOne({
        qrCodeId: normalizedQRCodeId,
        event: normalizedEventId,
        isDuplicate: false
      }).session(session);
      
      if (dbEntry) {
        // Duplicate verified in database - reject the scan
        const originalScanData = await getCachedTicketData(normalizedQRCodeId);
      
        // Log duplicate attempt
        const duplicateLog = await EntryLog.logDuplicateAttempt(
          originalScanData?.entryLogId,
          {
            event: normalizedEventId,
            booking: normalizedBookingId,
            qrCodeId: normalizedQRCodeId,
            staff: staffId,
            gateId,
            gateName,
            deviceId,
            deviceName,
            deviceType,
            ipAddress,
            localTimestamp: localTimestamp || new Date(),
            scannedAt: new Date()
          }
        );
        
        await session.commitTransaction();
        
        return res.status(409).json({
          success: false,
          error: 'Duplicate scan',
          message: 'This ticket has already been used for entry',
          data: {
            originalScan: originalScanData,
            duplicateAttemptNumber: duplicateLog?.duplicateAttemptNumber || 1
          },
          validationTime: Date.now() - startTime,
          cacheHit: true
        });
      } else {
        // Cache is stale - log warning and continue
        console.warn('[QR_SCAN] Redis cache is stale, continuing with scan:', {
          qrCodeId: normalizedQRCodeId
        });
      }
    }
    
    // Step 3: Check cached ticket data (to avoid DB query if possible)
    let booking = await getCachedTicketData(normalizedQRCodeId);
    cacheHit = !!booking;
    
    // Step 4: If not in cache, query database with locking
    if (!booking) {
      booking = await Booking.findOne({
        _id: normalizedBookingId,
        ticketIds: normalizedQRCodeId
      })
        .populate('event', 'title date location')
        .populate('user', 'name email')
        .session(session)
        .lean();
      
      if (!booking) {
        await session.abortTransaction();
        
        // Log not found attempt for security monitoring
        console.warn('[QR_SCAN] Booking not found:', {
          bookingId: normalizedBookingId,
          ticketId: normalizedQRCodeId,
          eventId: normalizedEventId,
          deviceId,
          staffId,
          ip: ipAddress
        });
        
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          message: 'This QR code does not match any valid booking. The ticket may be invalid or for a different event.',
          validationTime: Date.now() - startTime
        });
      }
      
      // Cache the booking data for future scans
      await cacheTicketData(normalizedQRCodeId, booking);
    }
    
    // Step 5: Check if booking is for the current event
    const bookingEventId = booking.event?._id?.toString() || booking.event?.toString() || booking.eventId?.toString();
    const scannerEventId = normalizedEventId.toString();
    
    if (bookingEventId !== scannerEventId) {
      await session.abortTransaction();
      
      console.warn('[QR_SCAN] Event mismatch:', {
        bookingEventId,
        scannerEventId,
        bookingId: normalizedBookingId,
        ticketId: normalizedQRCodeId
      });
      
      return res.status(400).json({
        success: false,
        error: 'Wrong event',
        message: `This ticket is for a different event. Scanned ticket is for "${booking.event?.title || 'Unknown Event'}"`,
        validationTime: Date.now() - startTime,
        cacheHit
      });
    }
    
    // Step 6: Validate booking status
    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Booking cancelled',
        message: 'This booking has been cancelled',
        validationTime: Date.now() - startTime,
        cacheHit
      });
    }
    
    if (booking.status !== 'confirmed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid booking status',
        message: `Booking status is ${booking.status}. Only confirmed bookings are allowed entry.`,
        validationTime: Date.now() - startTime,
        cacheHit
      });
    }
    
    // Step 8: Check database for existing entry log (double-check for race conditions)
    const existingEntry = await EntryLog.findOne({
      qrCodeId: normalizedQRCodeId,
      event: normalizedEventId,
      isDuplicate: false
    }).session(session);
    
    if (existingEntry) {
      // Race condition detected - another scanner already processed this
      await markQRAsScanned(normalizedQRCodeId, {
        entryLogId: existingEntry._id,
        bookingId: normalizedBookingId,
        ticketId,
        eventId: normalizedEventId,
        scannedAt: existingEntry.scannedAt,
        gateId: existingEntry.gateId,
        staffId: existingEntry.staff
      });
      
      // Log as duplicate
      await EntryLog.logDuplicateAttempt(existingEntry._id, {
        event: normalizedEventId,
        booking: normalizedBookingId,
        qrCodeId: normalizedQRCodeId,
        staff: staffId,
        gateId,
        gateName,
        deviceId,
        deviceName,
        deviceType,
        ipAddress,
        localTimestamp: localTimestamp || new Date(),
        scannedAt: new Date()
      });
      
      await session.commitTransaction();
      
      return res.status(409).json({
        success: false,
        error: 'Already scanned',
        message: 'This ticket was just scanned by another device',
        data: {
          originalScan: existingEntry,
          detectedVia: 'database_check'
        },
        validationTime: Date.now() - startTime
      });
    }
    
    // Step 9: Create entry log
    const entryLog = new EntryLog({
      event: normalizedEventId,
      booking: normalizedBookingId,
      qrCodeId: normalizedQRCodeId,
      staff: staffId,
      gateId,
      gateName,
      scanMethod: 'qr_code',
      ticketStatus: 'valid',
      scannedAt: new Date(),
      ipAddress,
      deviceId,
      deviceName,
      deviceType,
      localTimestamp: localTimestamp || new Date(),
      isOfflineSync: !!localTimestamp,
      syncedAt: localTimestamp ? new Date() : null,
      validationTime: Date.now() - startTime,
      cacheHit
    });
    
    await entryLog.save({ session });
    
    // Step 10: Mark as scanned in Redis AFTER database save (to avoid orphaned cache entries)
    const redisMarked = await markQRAsScanned(normalizedQRCodeId, {
      entryLogId: entryLog._id,
      bookingId: normalizedBookingId,
      ticketId,
      eventId: normalizedEventId,
      gateId,
      staffId,
      scannedAt: entryLog.scannedAt.toISOString()
    });
    
    if (!redisMarked) {
      // Another process just marked it (extremely rare race condition)
      // But the database entry already exists, so next attempt will find it
      console.warn('[QR_SCAN] Redis mark failed but database entry exists:', normalizedQRCodeId);
    }
    
    // Step 11: Update cached data with entry log ID
    await cacheTicketData(normalizedQRCodeId, {
      ...booking,
      entryLogId: entryLog._id,
      scannedAt: entryLog.scannedAt,
      gateId,
      staffId
    });
    
    // Step 10: Increment counters (async, don't wait)
    incrementEntryCount(normalizedEventId).catch(err => 
      console.error('[QR_SCAN] Counter increment failed:', err)
    );
    incrementGateCount(eventId, gateId).catch(err => 
      console.error('[QR_SCAN] Gate counter failed:', err)
    );
    incrementStaffCount(eventId, staffId).catch(err => 
      console.error('[QR_SCAN] Staff counter failed:', err)
    );
    
    await session.commitTransaction();
    
    const validationTime = Date.now() - startTime;
    
    console.log('[QR_SCAN] Success:', {
      qrCodeId: qrCodeId.substring(0, 8) + '...',
      eventId,
      gateId,
      staffId,
      validationTime,
      cacheHit
    });
    
    return res.status(200).json({
      success: true,
      message: 'Entry granted',
      data: {
        entryLogId: entryLog._id,
        booking: {
          id: booking._id,
          eventName: booking.event?.title,
          userName: booking.user?.name,
          ticketType: booking.ticketType?.name || 'Standard',
          quantity: booking.quantity
        },
        scan: {
          gateId,
          gateName,
          staffId,
          scannedAt: entryLog.scannedAt,
          ticketStatus: 'valid'
        }
      },
      validationTime,
      cacheHit
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('[QR_SCAN] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Scan failed',
      message: 'An error occurred while processing the scan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      validationTime: Date.now() - startTime
    });
  } finally {
    session.endSession();
  }
};

/**
 * Batch offline sync endpoint
 * POST /api/scanner/offline-sync
 * 
 * Body: {
 *   scans: [{qrPayload, gateId, deviceId, localTimestamp}, ...],
 *   deviceId: "SCANNER-001",
 *   syncedAt: "2026-01-28T10:45:00Z"
 * }
 */
export const syncOfflineScans = async (req, res) => {
  try {
    const { scans, deviceId, syncedAt } = req.body;
    const staffId = req.user.id;
    
    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Scans array is required and must not be empty'
      });
    }
    
    if (scans.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch too large',
        message: 'Maximum 100 scans per batch. Please split into smaller batches.'
      });
    }
    
    const results = {
      total: scans.length,
      successful: 0,
      failed: 0,
      duplicate: 0,
      errors: []
    };
    
    // Process scans sequentially to maintain order and prevent race conditions
    for (let i = 0; i < scans.length; i++) {
      const scan = scans[i];
      
      try {
        // Create a mock request object for validateAndScanQR
        const mockReq = {
          body: {
            ...scan,
            deviceId,
            localTimestamp: scan.localTimestamp || syncedAt,
            isOfflineSync: true
          },
          user: req.user,
          ip: req.ip
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => ({ statusCode: code, data })
          })
        };
        
        const result = await validateAndScanQR(mockReq, mockRes);
        
        if (result.statusCode === 200) {
          results.successful++;
        } else if (result.statusCode === 409) {
          results.duplicate++;
        } else {
          results.failed++;
          results.errors.push({
            index: i,
            qrPayload: scan.qrPayload.substring(0, 20) + '...',
            error: result.data.message || 'Unknown error'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }
    
    console.log('[OFFLINE_SYNC] Batch processed:', {
      deviceId,
      staffId,
      ...results
    });
    
    return res.status(200).json({
      success: true,
      message: 'Offline scans synced',
      results
    });
    
  } catch (error) {
    console.error('[OFFLINE_SYNC] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message
    });
  }
};

/**
 * Get real-time analytics for event
 * GET /api/scanner/analytics/:eventId
 */
export const getRealtimeAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get live counts from Redis (instant)
    const [totalEntries, gateCounts, staffCounts] = await Promise.all([
      getEntryCount(eventId),
      getGateCounts(eventId),
      getStaffCounts(eventId)
    ]);
    
    // Get database stats (for accuracy)
    const [dbTotalEntries, dbDuplicateAttempts] = await Promise.all([
      EntryLog.countDocuments({ event: eventId, isDuplicate: false }),
      EntryLog.countDocuments({ event: eventId, isDuplicate: true })
    ]);
    
    // Get event details
    const event = await Event.findById(eventId).select('title date location capacity');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Calculate occupancy
    const occupancy = event.capacity 
      ? ((dbTotalEntries / event.capacity) * 100).toFixed(2)
      : null;
    
    return res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          location: event.location,
          capacity: event.capacity
        },
        liveStats: {
          totalEntries: dbTotalEntries, // Use DB count for accuracy
          cacheCount: totalEntries, // Redis count for comparison
          occupancyPercentage: occupancy,
          duplicateAttempts: dbDuplicateAttempts,
          gateCounts: gateCounts || {},
          staffCounts: staffCounts || {}
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ANALYTICS] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
};

/**
 * Get duplicate scan attempts log
 * GET /api/scanner/duplicate-attempts/:eventId
 */
export const getDuplicateAttempts = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 50, page = 1, gateId, staffId } = req.query;
    
    const query = {
      event: eventId,
      isDuplicate: true
    };
    
    if (gateId) query.gateId = gateId;
    if (staffId) query.staff = staffId;
    
    const duplicates = await EntryLog.find(query)
      .populate({
        path: 'booking',
        select: 'bookingId user event',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('staff', 'name email')
      .populate('originalScanId', 'scannedAt gateId staff')
      .sort({ scannedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await EntryLog.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        duplicates,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('[DUPLICATE_LOG] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch duplicate attempts'
    });
  }
};

/**
 * Get staff scan report
 * GET /api/scanner/staff-report/:eventId
 */
export const getStaffReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;
    
    const matchStage = {
      event: new mongoose.Types.ObjectId(eventId),
      isDuplicate: false
    };
    
    if (startDate || endDate) {
      matchStage.scannedAt = {};
      if (startDate) matchStage.scannedAt.$gte = new Date(startDate);
      if (endDate) matchStage.scannedAt.$lte = new Date(endDate);
    }
    
    const staffReport = await EntryLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$staff',
          totalScans: { $sum: 1 },
          firstScan: { $min: '$scannedAt' },
          lastScan: { $max: '$scannedAt' },
          gates: { $addToSet: '$gateId' },
          avgValidationTime: { $avg: '$validationTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      {
        $unwind: '$staffInfo'
      },
      {
        $project: {
          staffId: '$_id',
          staffName: '$staffInfo.name',
          staffEmail: '$staffInfo.email',
          totalScans: 1,
          firstScan: 1,
          lastScan: 1,
          gatesWorked: { $size: '$gates' },
          avgValidationTime: { $round: ['$avgValidationTime', 2] }
        }
      },
      { $sort: { totalScans: -1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: staffReport
    });
    
  } catch (error) {
    console.error('[STAFF_REPORT] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate staff report'
    });
  }
};

/**
 * Get gate traffic report
 * GET /api/scanner/gate-report/:eventId
 */
export const getGateReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { interval = '1hour' } = req.query; // '15min', '1hour', 'day'
    
    let groupBy;
    switch (interval) {
      case '15min':
        groupBy = {
          year: { $year: '$scannedAt' },
          month: { $month: '$scannedAt' },
          day: { $dayOfMonth: '$scannedAt' },
          hour: { $hour: '$scannedAt' },
          minute: { $subtract: [{ $minute: '$scannedAt' }, { $mod: [{ $minute: '$scannedAt' }, 15] }] }
        };
        break;
      case 'day':
        groupBy = {
          year: { $year: '$scannedAt' },
          month: { $month: '$scannedAt' },
          day: { $dayOfMonth: '$scannedAt' }
        };
        break;
      default: // 1hour
        groupBy = {
          year: { $year: '$scannedAt' },
          month: { $month: '$scannedAt' },
          day: { $dayOfMonth: '$scannedAt' },
          hour: { $hour: '$scannedAt' }
        };
    }
    
    const gateTraffic = await EntryLog.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          isDuplicate: false
        }
      },
      {
        $group: {
          _id: {
            gateId: '$gateId',
            time: groupBy
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.gateId',
          traffic: {
            $push: {
              time: '$_id.time',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        interval,
        gates: gateTraffic
      }
    });
    
  } catch (error) {
    console.error('[GATE_REPORT] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate gate report'
    });
  }
};

/**
 * Get entry logs for admin/staff admin
 * GET /api/hp-scanner/entry-logs/:eventId
 * 
 * Returns all successful scans with booking and staff details
 * Accessible to staff_admin, admin, super_admin roles
 */
export const getEntryLogs = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, gateId, staffId, startDate, endDate } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    // Build query
    const query = {
      event: eventId,
      isDuplicate: false  // Only successful entries
    };
    
    if (gateId) query.gateId = gateId;
    if (staffId) query.staff = staffId;
    
    if (startDate || endDate) {
      query.scannedAt = {};
      if (startDate) query.scannedAt.$gte = new Date(startDate);
      if (endDate) query.scannedAt.$lte = new Date(endDate);
    }
    
    // Fetch entry logs with populated data
    const entryLogs = await EntryLog.find(query)
      .populate({
        path: 'booking',
        select: 'bookingId user quantity ticketType event',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('staff', 'name email')
      .sort({ scannedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    const total = await EntryLog.countDocuments(query);
    
    // Transform response
    const logs = entryLogs.map(log => ({
      id: log._id.toString(),
      bookingId: log.booking?.bookingId || 'N/A',
      attendeeName: log.booking?.user?.name || 'Unknown',
      attendeeEmail: log.booking?.user?.email,
      attendeePhone: log.booking?.user?.phone,
      numberOfTickets: log.booking?.quantity || 1,
      ticketType: log.booking?.ticketType?.name || 'Standard',
      gateId: log.gateId,
      gateName: log.gateName,
      scannedAt: log.scannedAt,
      scannedBy: log.staff?.name || 'Unknown',
      staffEmail: log.staff?.email,
      deviceId: log.deviceId,
      deviceName: log.deviceName,
      validationTime: log.validationTime,
      isOfflineSync: log.isOfflineSync,
      scanMethod: log.scanMethod,
      ticketStatus: log.ticketStatus
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary: {
          totalEntries: total,
          eventId,
          filters: {
            gateId: gateId || null,
            staffId: staffId || null,
            startDate: startDate || null,
            endDate: endDate || null
          }
        }
      }
    });
    
  } catch (error) {
    console.error('[ENTRY_LOGS] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch entry logs',
      message: error.message
    });
  }
};

export default {
  validateAndScanQR,
  syncOfflineScans,
  getRealtimeAnalytics,
  getDuplicateAttempts,
  getStaffReport,
  getGateReport,
  getEntryLogs
};


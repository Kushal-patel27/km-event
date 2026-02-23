import User from "../models/User.js";
import Booking from "../models/Booking.js";
import EntryLog from "../models/EntryLog.js";
import Event from "../models/Event.js";
import FeatureToggle from "../models/FeatureToggle.js";

// Scan ticket by QR code or Booking ID
export const scanTicket = async (req, res) => {
  try {
    const { bookingId, ticketId, gate, ipAddress } = req.body;
    const staffId = req.user._id;

    // Find booking
    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({ bookingId });
    } else if (ticketId) {
      booking = await Booking.findById(ticketId);
    }

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if scanner app feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: booking.event });
      if (featureToggle && featureToggle.features?.scannerApp?.enabled === false) {
        return res.status(403).json({ 
          message: "Scanner app is disabled for this event",
          feature: "scannerApp"
        });
      }
    } catch (featureError) {
      console.error('[SCANNER] Error checking feature toggle:', featureError.message);
      // Continue if feature check fails to avoid blocking legitimate scans
    }

    // Check if cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Booking is cancelled",
        ticketStatus: "cancelled",
      });
    }

    // Check if this booking has already been scanned (prevent duplicate scans)
    if (booking.scans && booking.scans.length > 0) {
      // If booking ID is used (not individual ticket), prevent re-scanning entire booking
      if (bookingId && !ticketId) {
        return res.status(400).json({
          message: "Booking already scanned",
          ticketStatus: "used",
          scanTime: booking.lastScannedAt,
        });
      }
      
      // If specific ticket ID, check if this ticket was already scanned
      if (ticketId) {
        const alreadyScanned = booking.scans.some(s => s.ticketId === ticketId);
        if (alreadyScanned) {
          return res.status(400).json({
            message: "This ticket already scanned",
            ticketStatus: "used",
            scanTime: booking.scans.find(s => s.ticketId === ticketId)?.scannedAt,
          });
        }
      }
    }

    // For bookings with multiple tickets, check if all tickets have been scanned
    const scannedCount = booking.scans?.length || 0;
    const totalTickets = booking.quantity || 1;
    
    if (scannedCount >= totalTickets) {
      return res.status(400).json({
        message: "All tickets for this booking have been scanned",
        ticketStatus: "used",
        scanTime: booking.lastScannedAt,
      });
    }

    // Create entry log
    const scanMethod = bookingId ? "booking_id" : "qr_code";
    const entryLog = new EntryLog({
      event: booking.event,
      booking: booking._id,
      staff: staffId,
      gate: gate || "Unknown",
      scanMethod,
      ticketStatus: "valid",
      ipAddress: ipAddress || "",
    });

    await entryLog.save();

    // Update booking with scan info (for compatibility with event admin)
    booking.scans = booking.scans || [];
    booking.scans.push({
      scannedAt: entryLog.scannedAt,
      scannedBy: staffId,
      ticketId: ticketId || null,
      ticketIndex: (booking.scans.length + 1),
      deviceInfo: req.headers['user-agent'] || 'Unknown'
    });
    booking.lastScannedAt = entryLog.scannedAt;
    
    // Update status to "used" only if all tickets have been scanned
    if (booking.scans.length >= totalTickets) {
      booking.status = "used";
    }
    
    await booking.save();

    res.json({
      success: true,
      message: "Ticket scanned successfully",
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        userName: booking.userName,
        userEmail: booking.userEmail,
        ticketType: booking.ticketType,
        status: booking.status,
      },
      entryLog: {
        _id: entryLog._id,
        scannedAt: entryLog.scannedAt,
        gate: entryLog.gate,
      },
    });
  } catch (err) {
    console.error("Scan ticket error:", err);
    res.status(500).json({ message: err.message || "Failed to scan ticket" });
  }
};

// Get ticket status
export const getTicketStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId }).populate(
      "event",
      "title date"
    );

    if (!booking) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if scanner app feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: booking.event });
      if (featureToggle && featureToggle.features?.scannerApp?.enabled === false) {
        return res.status(403).json({ 
          message: "Scanner app is disabled for this event",
          feature: "scannerApp"
        });
      }
    } catch (featureError) {
      console.error('[TICKET STATUS] Error checking feature toggle:', featureError.message);
      // Continue if feature check fails
    }

    const entryLog = await EntryLog.findOne({ booking: booking._id });

    res.json({
      booking: {
        bookingId: booking.bookingId,
        userName: booking.userName,
        userEmail: booking.userEmail,
        ticketType: booking.ticketType,
        event: booking.event,
        status: booking.status,
        createdAt: booking.createdAt,
      },
      entry: entryLog
        ? {
            status: entryLog.ticketStatus,
            scannedAt: entryLog.scannedAt,
            gate: entryLog.gate,
            scanMethod: entryLog.scanMethod,
          }
        : null,
    });
  } catch (err) {
    console.error("Get ticket status error:", err);
    res.status(500).json({ message: err.message || "Failed to get status" });
  }
};

// Get real-time entry stats for staff's gates
export const getGateStats = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { eventId } = req.params;

    // Check if scanner app feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId });
      if (featureToggle && featureToggle.features?.scannerApp?.enabled === false) {
        return res.status(403).json({ 
          message: "Scanner app is disabled for this event",
          feature: "scannerApp"
        });
      }
    } catch (featureError) {
      console.error('[SCANNER STATS] Error checking feature toggle:', featureError.message);
      // Continue if feature check fails to avoid blocking legitimate requests
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Get entry logs for this staff at their gates
    const logs = await EntryLog.find({
      event: eventId,
      staff: staffId,
      gate: { $in: staff.assignedGates },
    });

    const stats = {
      totalScanned: logs.length,
      valid: logs.filter((l) => l.ticketStatus === "valid").length,
      used: logs.filter((l) => l.ticketStatus === "used").length,
      invalid: logs.filter((l) => l.ticketStatus === "invalid").length,
      cancelled: logs.filter((l) => l.ticketStatus === "cancelled").length,
      byGate: {},
    };

    // Count by gate
    logs.forEach((log) => {
      const gate = log.gate || "Unknown";
      stats.byGate[gate] = (stats.byGate[gate] || 0) + 1;
    });

    // Get recent scans
    const recentScans = logs
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
      .slice(0, 20)
      .map((log) => ({
        _id: log._id,
        scannedAt: log.scannedAt,
        gate: log.gate,
        status: log.ticketStatus,
      }));

    res.json({ stats, recentScans });
  } catch (err) {
    console.error("Get gate stats error:", err);
    res.status(500).json({ message: err.message || "Failed to get stats" });
  }
};

// Get assigned events and gates for scanner
export const getAssignedInfo = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const staffId = req.user._id;

    const staff = await User.findById(staffId)
      .populate("assignedEvents", "title date location totalTickets availableTickets")
      .select("name email assignedEvents assignedGates");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Ensure assignedGates and assignedEvents are arrays
    const assignedGates = staff.assignedGates || [];
    const assignedEvents = staff.assignedEvents || [];

    res.json({
      staff: {
        name: staff.name || "",
        email: staff.email || "",
        assignedGates: assignedGates,
        assignedEvents: assignedEvents,
      },
    });
  } catch (err) {
    console.error("Get assigned info error:", err);
    res.status(500).json({ 
      message: "Failed to get info",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Manual entry with admin approval
export const requestManualEntry = async (req, res) => {
  try {
    const { bookingId, reason, gate } = req.body;
    const staffId = req.user._id;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if scanner app feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: booking.event });
      if (featureToggle && featureToggle.features?.scannerApp?.enabled === false) {
        return res.status(403).json({ 
          message: "Scanner app is disabled for this event",
          feature: "scannerApp"
        });
      }
    } catch (featureError) {
      console.error('[MANUAL ENTRY] Error checking feature toggle:', featureError.message);
      // Continue if feature check fails
    }

    // Create entry log with manual status - requires approval
    const entryLog = new EntryLog({
      event: booking.event,
      booking: booking._id,
      staff: staffId,
      gate: gate || "Unknown",
      scanMethod: "manual",
      ticketStatus: "valid", // Will be approved by staff admin
      notes: reason || "Manual entry requested",
    });

    await entryLog.save();

    res.json({
      success: true,
      message: "Manual entry request submitted for approval",
      entryLog: {
        _id: entryLog._id,
        status: entryLog.ticketStatus,
        notes: entryLog.notes,
      },
    });
  } catch (err) {
    console.error("Manual entry error:", err);
    res.status(500).json({ message: err.message || "Failed to request entry" });
  }
};

// Legacy QR validation (kept for compatibility)
export const validateAndScanQR = async (req, res) => {
  const { eventId, qrData, deviceInfo } = req.body;

  if (!req.user || !["staff", "staff_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Staff role required" });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let bookingId, ticketIndex, ticketId, eventIdFromQR;
    
    // Try to parse as JSON (QR code format)
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.ticketId) {
        // New format with ticket ID
        ticketId = parsed.ticketId;
        bookingId = parsed.bid;
        ticketIndex = parsed.idx || 0;
        eventIdFromQR = parsed.evt;
      } else {
        // Legacy format
        bookingId = parsed.bid;
        ticketIndex = parsed.idx || 0;
        eventIdFromQR = parsed.evt;
      }
    } catch (e) {
      // Try to use as ticket ID directly
      ticketId = qrData.trim();
    }

    // Defer event match validation until booking is resolved

    // Find booking by ticket ID
    let booking;
    if (ticketId) {
      booking = await Booking.findOne({ ticketIds: ticketId })
        .populate("user", "name email")
        .populate("event", "title location date");
      
      if (!booking) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Find the index of this ticket
      ticketIndex = booking.ticketIds.indexOf(ticketId) + 1;
    } else if (bookingId) {
      // Legacy: find by booking ID
      booking = await Booking.findById(bookingId)
        .populate("user", "name email")
        .populate("event", "title location date");

      if (!booking) {
        return res.status(404).json({ message: "Ticket not found" });
      }
    } else {
      return res.status(400).json({ message: "Invalid QR format or ticket ID" });
    }

    // Validate selected event against booking.event
    const bookingEventId = booking?.event?._id?.toString() || booking?.event?.toString();
    if (eventId && bookingEventId && bookingEventId !== eventId.toString()) {
      return res.status(400).json({ message: "QR is for a different event" });
    }

    // Block cancelled or refunded bookings
    if (["cancelled", "refunded"].includes(booking.status)) {
      return res.status(400).json({
        message: "Booking is cancelled/refunded — entry not allowed",
        valid: false,
        cancelled: true,
        status: booking.status,
      });
    }

    // Check if already scanned (prevent duplicates)
    const alreadyScanned = booking.scans?.some(
      (s) => s.ticketId === ticketId || (ticketIndex && s.ticketIndex === ticketIndex)
    );

    if (alreadyScanned) {
      const lastScan = booking.scans
        .filter((s) => s.ticketId === ticketId || s.ticketIndex === ticketIndex)
        .pop();
      return res.status(400).json({
        message: "Duplicate scan - ticket already validated",
        valid: false,
        duplicate: true,
        lastScannedAt: lastScan?.scannedAt,
        booking: {
          _id: booking._id,
          user: booking.user,
          event: booking.event,
          ticketIndex,
          ticketId,
        },
      });
    }

    // Record scan
    booking.scans.push({
      scannedAt: new Date(),
      scannedBy: req.user._id,
      ticketIndex,
      ticketId,
      deviceInfo,
    });
    booking.lastScannedAt = new Date();
    await booking.save();

    return res.json({
      message: "Ticket validated successfully",
      valid: true,
      duplicate: false,
      booking: {
        _id: booking._id,
        user: booking.user,
        event: booking.event,
        ticketIndex,
        ticketId,
        quantity: booking.quantity,
        scans: booking.scans.filter((s) => s.ticketId === ticketId || s.ticketIndex === ticketIndex),
      },
    });
  } catch (error) {
    console.error("Scan validation error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getStaffEvents = async (req, res) => {
  if (!req.user || !["staff_admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ message: "Staff role required" });
  }

  try {
    const assignedIds = Array.isArray(req.user.assignedEvents) ? req.user.assignedEvents : []
    const filter = assignedIds.length > 0 ? { _id: { $in: assignedIds } } : { _id: null } // return none if no assignment

    const events = await Event.find(filter)
      .select("_id title location date totalTickets availableTickets")
      .sort({ date: -1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getEventScanStats = async (req, res) => {
  const { eventId } = req.params;

  if (!req.user || !["staff_admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ message: "Staff role required" });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Get bookings with scans for this event
    const bookings = await Booking.find({ event: eventId })
      .select("_id quantity scans")
      .lean();

    let totalTickets = 0;
    let scannedTickets = 0;
    const uniqueBookingsScanned = new Set();

    bookings.forEach((b) => {
      totalTickets += b.quantity || 1;
      if (b.scans && b.scans.length > 0) {
        uniqueBookingsScanned.add(b._id.toString());
        scannedTickets += b.scans.length;
      }
    });

    return res.json({
      eventId,
      eventTitle: event.title,
      totalBookings: bookings.length,
      totalTickets: totalTickets,
      scannedCount: scannedTickets,
      remainingTickets: Math.max(0, totalTickets - scannedTickets),
      uniqueBookingsWithScans: uniqueBookingsScanned.size,
      scanRate: totalTickets > 0 ? Math.round((scannedTickets / totalTickets) * 100) : 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

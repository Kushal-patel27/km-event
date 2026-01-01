import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

export const validateAndScanQR = async (req, res) => {
  const { eventId, qrData, deviceInfo } = req.body;

  if (!req.user || req.user.role !== "staff_admin") {
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

    // Validate event match if we have eventIdFromQR
    if (eventIdFromQR && eventIdFromQR !== eventId && eventIdFromQR !== event._id.toString()) {
      return res.status(400).json({ message: "QR is for a different event" });
    }

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
  if (!req.user || req.user.role !== "staff_admin") {
    return res.status(403).json({ message: "Staff role required" });
  }

  try {
    // Staff can access all events (assuming organization-wide staff)
    // If you want event-specific staff, add an organizer/staff field to Event model
    const events = await Event.find()
      .select("_id title location date totalTickets availableTickets")
      .sort({ date: -1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getEventScanStats = async (req, res) => {
  const { eventId } = req.params;

  if (!req.user || req.user.role !== "staff_admin") {
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

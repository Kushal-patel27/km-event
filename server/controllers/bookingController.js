import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import generateQR from "../utils/generateQR.js";
import { ADMIN_ROLE_SET } from "../models/User.js";
import SystemConfig from "../models/SystemConfig.js";
import FeatureToggle from "../models/FeatureToggle.js";
import crypto from "crypto";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";
import { generateTicketPDF } from "../utils/generateTicketPDF.js";

function generateUniqueTicketId() {
  // Generate a short ticket ID like A1B2C3D4 (8 characters)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 8; i++) {
    result += chars[randomBytes[i % 4] % chars.length];
  }
  return result;
}

export const createBooking = async (req, res) => {
  const { eventId, quantity, ticketTypeId, seats } = req.body;

  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Check if ticketing feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: eventId });
      if (featureToggle && featureToggle.features?.ticketing?.enabled === false) {
        return res.status(403).json({ 
          message: "Ticketing is disabled for this event",
          feature: "ticketing"
        });
      }
    } catch (featureError) {
      console.error('[BOOKING] Error checking ticketing feature:', featureError.message);
      // Continue if feature check fails
    }

    const hasTicketTypes = Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0;
    const totalAvailableFromTypes = hasTicketTypes
      ? event.ticketTypes.reduce((sum, t) => sum + (t?.available ?? 0), 0)
      : null;

    // Handle ticket type selection
    let ticketTypeData = null;
    let price = event.price;

    if (hasTicketTypes) {
      if (!ticketTypeId) {
        return res.status(400).json({ message: "Ticket type is required" });
      }

      if (totalAvailableFromTypes < quantity) {
        return res.status(400).json({ message: `Only ${totalAvailableFromTypes} tickets available` });
      }

      const selectedType = event.ticketTypes.id(ticketTypeId);
      if (!selectedType) {
        return res.status(400).json({ message: "Invalid ticket type" });
      }
      if (selectedType.available < quantity) {
        return res.status(400).json({ message: `Only ${selectedType.available} tickets available for ${selectedType.name}` });
      }

      price = selectedType.price;
      ticketTypeData = {
        name: selectedType.name,
        price: selectedType.price,
        description: selectedType.description || ''
      };
      // Reduce ticket type availability for the selected bucket now
      selectedType.available = Math.max(0, selectedType.available - quantity);
    } else {
      if (event.availableTickets < quantity)
        return res.status(400).json({ message: "Not enough tickets" });
    }

    // If seats are provided, validate them
    if (seats && Array.isArray(seats)) {
      // Check if number of seats matches quantity
      if (seats.length !== quantity) {
        return res.status(400).json({ 
          message: `Number of seats (${seats.length}) must match quantity (${quantity})` 
        });
      }

      // Check for duplicate seats in this booking
      const uniqueSeats = new Set(seats);
      if (uniqueSeats.size !== seats.length) {
        return res.status(400).json({ message: "Duplicate seats selected" });
      }

      // Check if event has capacity and seats are within range
      if (event.capacity && isFinite(event.capacity)) {
        const invalidSeats = seats.filter(s => s < 1 || s > event.capacity);
        if (invalidSeats.length > 0) {
          return res.status(400).json({ 
            message: `Invalid seat numbers: ${invalidSeats.join(', ')}` 
          });
        }

        // Check if any seats are already booked
        const existingBookings = await Booking.find({ 
          event: eventId,
          seats: { $exists: true, $ne: [] }
        });

        const bookedSeats = new Set();
        existingBookings.forEach(booking => {
          if (Array.isArray(booking.seats)) {
            booking.seats.forEach(seat => bookedSeats.add(seat));
          }
        });

        const conflictingSeats = seats.filter(s => bookedSeats.has(s));
        if (conflictingSeats.length > 0) {
          return res.status(400).json({ 
            message: `Seats already booked: ${conflictingSeats.join(', ')}` 
          });
        }
      }
    }

    const totalAmount = quantity * price;

    // Check if payments feature is enabled for this event
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: eventId });
      if (featureToggle && featureToggle.features?.payments?.enabled === false) {
        return res.status(403).json({ 
          message: "Payment processing is disabled for this event",
          feature: "payments"
        });
      }
    } catch (featureError) {
      console.error('[BOOKING] Error checking payments feature:', featureError.message);
      // Continue if feature check fails
    }

    // Generate unique ticket IDs
    const ticketIds = [];
    for (let i = 0; i < quantity; i++) {
      ticketIds.push(generateUniqueTicketId());
    }

    const bookingData = {
      user: req.user._id,
      event: eventId,
      quantity,
      totalAmount,
      ticketIds,
      ...(ticketTypeData && { ticketType: ticketTypeData })
    };

    // Add seats if provided
    if (seats && Array.isArray(seats) && seats.length > 0) {
      bookingData.seats = seats.map(s => Number(s));
    }

    const booking = await Booking.create(bookingData);

    // Reduce tickets and keep aggregate fields in sync
    if (hasTicketTypes) {
      const aggregatedAvailable = event.ticketTypes.reduce((sum, t) => sum + (t?.available ?? 0), 0);
      const aggregatedTotal = event.ticketTypes.reduce((sum, t) => sum + (t?.quantity ?? 0), 0);
      event.availableTickets = Math.max(0, aggregatedAvailable);
      event.totalTickets = Math.max(0, aggregatedTotal);
    } else {
      event.availableTickets = Math.max(0, event.availableTickets - quantity);
    }
    await event.save();

    // Check system config for QR code generation
    let qrEnabled = true; // default: enabled
    try {
      // First check event-specific feature toggle
      const featureToggle = await FeatureToggle.findOne({ eventId: eventId });
      if (featureToggle && featureToggle.features?.qrCheckIn?.enabled === false) {
        qrEnabled = false;
        console.log(`[QR BOOKING] QR Code generation DISABLED for event ${eventId} via feature toggle`);
      } else {
        // Fall back to system config if feature toggle doesn't disable it
        const systemConfig = await SystemConfig.findById("system_config");
        
        if (systemConfig) {
          // Explicitly check the boolean value
          const isQrEnabled = systemConfig.qrCodeRules?.enabled;
          if (isQrEnabled === false) {
            qrEnabled = false;
            console.log(`[QR BOOKING] QR Code generation DISABLED via system config`);
          } else if (isQrEnabled === true) {
            qrEnabled = true;
            console.log(`[QR BOOKING] QR Code generation ENABLED`);
          } else {
            console.log(`[QR BOOKING] qrCodeRules.enabled not explicitly set, defaulting to: true`);
          }
        } else {
          console.log(`[QR BOOKING] No SystemConfig found, defaulting to: true`);
        }
      }
    } catch (configError) {
      console.error('[QR BOOKING ERROR]', configError.message);
      // Continue with default (enabled) if config fetch fails
    }

    // Generate unique QR codes only if enabled (one per ticket with ticket ID)
    const qrCodes = [];
    if (qrEnabled) {
      for (let i = 0; i < quantity; i++) {
        const ticketId = ticketIds[i];
        const qrData = JSON.stringify({
          ticketId: ticketId,
          bid: booking._id.toString(),
          idx: i + 1,
          evt: eventId.toString(),
          seat: seats && seats[i] ? seats[i] : null,
      });
        const image = await generateQR(qrData);
        qrCodes.push({ id: ticketId, image });
      }
    }

    booking.qrCodes = qrCodes;
    booking.qrCode = qrCodes.length > 0 ? qrCodes[0].image : undefined; // legacy: first QR as string
    await booking.save();

    console.log(`[BOOKING] QR Code generation: ${qrEnabled ? 'ENABLED' : 'DISABLED'} - Generated ${qrCodes.length} QR codes`);

    // Populate event and user data for email
    const populatedBooking = await Booking.findById(booking._id)
      .populate('event', 'title location date image')
      .populate('user', 'name email');

    // Check if email/SMS feature is enabled for this event
    let emailEnabled = true;
    try {
      const featureToggle = await FeatureToggle.findOne({ eventId: eventId });
      console.log(`[BOOKING] Checking email feature for event ${eventId}`);
      console.log(`[BOOKING] Feature toggle found:`, featureToggle ? 'Yes' : 'No');
      if (featureToggle) {
        console.log(`[BOOKING] emailSms feature:`, JSON.stringify(featureToggle.features?.emailSms));
      }
      
      if (featureToggle && featureToggle.features?.emailSms?.enabled === false) {
        emailEnabled = false;
        console.log(`[BOOKING] Email/SMS DISABLED for event ${eventId}`);
      } else {
        console.log(`[BOOKING] Email/SMS ENABLED for event ${eventId}`);
      }
    } catch (featureError) {
      console.error('[BOOKING] Error checking feature toggle:', featureError.message);
      // Continue with default (enabled) if feature check fails
    }

    console.log(`[BOOKING] Final emailEnabled value: ${emailEnabled}`);

    // Send booking confirmation email only if feature is enabled
    if (emailEnabled) {
      const eventDateObj = new Date(populatedBooking.event.date);
      const eventTime = eventDateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      sendBookingConfirmationEmail({
        recipientEmail: populatedBooking.user.email,
        recipientName: populatedBooking.user.name,
        eventName: populatedBooking.event.title,
        eventDate: populatedBooking.event.date,
        eventTime: eventTime,
        venue: populatedBooking.event.location,
        ticketIds: populatedBooking.ticketIds,
        ticketType: populatedBooking.ticketType?.name || 'Standard',
        seats: populatedBooking.seats,
        quantity: populatedBooking.quantity,
        totalAmount: populatedBooking.totalAmount,
        bookingDate: populatedBooking.createdAt,
        bookingId: populatedBooking._id.toString(),
        qrCodes: populatedBooking.qrCodes
      }).then(() => {
        console.log('[BOOKING] Confirmation email sent successfully');
      }).catch(emailError => {
        console.error('[BOOKING] Failed to send email:', emailError.message);
      });
    } else {
      console.log('[BOOKING] Skipping email - Email/SMS feature disabled for this event');
    }

    // Return booking with qrCheckIn status for frontend
    const bookingResponse = booking.toObject();
    bookingResponse.qrCheckInEnabled = qrEnabled;
    res.status(201).json(bookingResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title location date image category price totalTickets availableTickets ticketTypes");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventBookingsForOrganizer = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookings = await Booking.find({ event: eventId })
      .populate("user", "name email")
      .populate("event", "title");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    if (!req.user || !ADMIN_ROLE_SET.has(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const role = req.user.role;

    // Super admin sees all
    if (role === 'super_admin') {
      const bookings = await Booking.find()
        .populate('user', 'name email role')
        .populate('event', 'title location date price organizer');
      return res.json(bookings);
    }

    // Event admin: only bookings for their assigned events
    if (role === 'event_admin') {
      if (!req.user.assignedEvents || req.user.assignedEvents.length === 0) {
        return res.json([]);
      }
      const bookings = await Booking.find({ event: { $in: req.user.assignedEvents } })
        .populate('user', 'name email role')
        .populate('event', 'title location date price organizer');
      return res.json(bookings);
    }

    // Staff admin: only bookings for their assigned events
    if (role === 'staff_admin') {
      if (!req.user.assignedEvents || req.user.assignedEvents.length === 0) {
        return res.json([]);
      }
      const bookings = await Booking.find({ event: { $in: req.user.assignedEvents } })
        .populate('user', 'name email role')
        .populate('event', 'title location date price organizer');
      return res.json(bookings);
    }

    // Legacy admin: see all events they own
    const ownedEvents = await Event.find({ organizer: req.user._id }).select('_id');
    const ownedIds = ownedEvents.map(e => e._id);
    if (ownedIds.length === 0) return res.json([]);

    const bookings = await Booking.find({ event: { $in: ownedIds } })
      .populate('user', 'name email role')
      .populate('event', 'title location date price organizer');
    return res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteBooking = async (req, res) => {
  try {
    if (!req.user || !ADMIN_ROLE_SET.has(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const { id } = req.params
    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    // Restore tickets to the event if it still exists
    if (booking.event) {
      const event = await Event.findById(booking.event)
      if (event && typeof event.availableTickets === 'number') {
        event.availableTickets = Math.max(0, event.availableTickets + (Number(booking.quantity) || 0))
        await event.save()
      }
    }

    await Booking.deleteOne({ _id: id })
    res.json({ message: 'Booking deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get booked seats for a specific event
export const getBookedSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find all bookings for this event that have seats
    const bookings = await Booking.find({ 
      event: eventId,
      seats: { $exists: true, $ne: [] }
    }).select('seats');

    // Collect all booked seat numbers
    const bookedSeats = [];
    bookings.forEach(booking => {
      if (Array.isArray(booking.seats)) {
        bookedSeats.push(...booking.seats);
      }
    });

    res.json({ 
      eventId, 
      bookedSeats,
      totalBooked: bookedSeats.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download ticket PDF
export const downloadTicketPDF = async (req, res) => {
  try {
    const { bookingId, ticketIndex } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('event', 'title location date')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const index = parseInt(ticketIndex);
    if (index < 0 || index >= booking.quantity) {
      return res.status(400).json({ message: "Invalid ticket index" });
    }

    const eventDateObj = new Date(booking.event.date);
    const eventTime = eventDateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const ticketData = {
      recipientName: booking.user.name,
      eventName: booking.event.title,
      eventDate: booking.event.date,
      eventTime: eventTime,
      venue: booking.event.location,
      ticketId: booking.ticketIds[index] || 'N/A',
      ticketType: booking.ticketType?.name || 'Standard',
      seat: booking.seats && booking.seats[index] ? booking.seats[index] : null,
      bookingId: booking._id.toString(),
      bookingDate: booking.createdAt,
      qrCode: booking.qrCodes && booking.qrCodes[index] ? booking.qrCodes[index].image : null
    };

    const pdfBuffer = await generateTicketPDF(ticketData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ticket_${ticketData.ticketId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[DOWNLOAD PDF ERROR]', error);
    res.status(500).json({ message: error.message });
  }
};

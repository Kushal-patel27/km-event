import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import generateQR from "../utils/generateQR.js";
import { ADMIN_ROLE_SET } from "../models/User.js";
import crypto from "crypto";

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
  const { eventId, quantity, seats } = req.body;

  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.availableTickets < quantity)
      return res.status(400).json({ message: "Not enough tickets" });

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

    const totalAmount = quantity * event.price;

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
    };

    // Add seats if provided
    if (seats && Array.isArray(seats) && seats.length > 0) {
      bookingData.seats = seats.map(s => Number(s));
    }

    const booking = await Booking.create(bookingData);

    // Reduce tickets
    event.availableTickets -= quantity;
    await event.save();

    // Generate unique QR codes (one per ticket with ticket ID)
    const qrCodes = [];
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

    booking.qrCodes = qrCodes;
    booking.qrCode = qrCodes.length > 0 ? qrCodes[0].image : undefined; // legacy: first QR as string
    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title location date image category price totalTickets availableTickets");

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

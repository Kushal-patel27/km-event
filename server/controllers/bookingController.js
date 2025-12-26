import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import generateQR from "../utils/generateQR.js";

export const createBooking = async (req, res) => {
  const { eventId, quantity } = req.body;

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

    const totalAmount = quantity * event.price;

    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      quantity,
      totalAmount,
    });

    // Reduce tickets
    event.availableTickets -= quantity;
    await event.save();

    // Generate unique QR codes (one per ticket)
    const qrCodes = [];
    for (let i = 0; i < quantity; i++) {
      const qrId = `${booking._id}-${i + 1}`;
      const qrData = JSON.stringify({
        bid: booking._id.toString(),
        idx: i + 1,
        evt: eventId.toString(),
      });
      const image = await generateQR(qrData);
      qrCodes.push({ id: qrId, image });
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
    // only allow admin
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const bookings = await Booking.find().populate('user', 'name email role').populate('event', 'title location date price')
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteBooking = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
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


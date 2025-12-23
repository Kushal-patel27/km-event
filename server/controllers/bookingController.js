import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import generateQR from "../utils/generateQR.js";

export const createBooking = async (req, res) => {
  const { eventId, quantity } = req.body;

  try {
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

    // Generate QR
    const qrData = `BOOKING:${booking._id}`;
    const qrCode = await generateQR(qrData);

    booking.qrCode = qrCode;
    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title location date");

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


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ADMIN_ROLE_SET } from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Contact from "../models/Contact.js";
import { sendReplyEmail } from "../utils/emailService.js";

// ============ DASHBOARD ANALYTICS ============

/**
 * Get admin dashboard overview (organization-level stats)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get admin's events (or all if super_admin)
    const eventFilter = req.user.role === "super_admin" ? {} : { organizer: userId };
    const events = await Event.find(eventFilter).lean();

    // Get bookings for those events
    const eventIds = events.map((e) => e._id);
    const bookingFilter = eventIds.length > 0 ? { event: { $in: eventIds } } : {};
    const bookings = await Booking.find(bookingFilter).lean();

    // Calculate stats
    const totalEvents = events.length;
    // Count active events: either status === "active" or events that haven't ended yet
    const now = new Date();
    const activeEvents = events.filter((e) => {
      if (e.status === "active") return true;
      if (e.date && new Date(e.date) > now) return true;
      return false;
    }).length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;

    res.json({
      totalEvents,
      activeEvents,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      revenuePerEvent: events.length > 0 ? totalRevenue / events.length : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ STAFF & EVENT ADMIN MANAGEMENT ============

/**
 * Get all staff admins and event admins
 */
export const getTeamMembers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, active } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const allowedRoles = ["event_admin", "staff_admin", "staff"];
    const filter = { role: { $in: allowedRoles } };

    if (role && allowedRoles.includes(role)) {
      filter.role = role;
    }

    if (active !== undefined && active !== '') {
      filter.active = active === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -sessions")
        .populate("assignedEvents", "title date location totalTickets category price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new event admin or staff admin
 */
export const createTeamMember = async (req, res) => {
  try {
    const { name, email, password, role, assignedEvents } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    const allowedRoles = ["event_admin", "staff_admin", "staff"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be event_admin, staff_admin, or staff" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      active: true,
      assignedEvents: assignedEvents && Array.isArray(assignedEvents) ? assignedEvents : [],
    });

    res.status(201).json({
      message: "Team member created successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update team member (name, assigned events, active status)
 */
export const updateTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, assignedEvents, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedRoles = ["event_admin", "staff_admin", "staff"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(400).json({ message: "Can only update event_admin, staff_admin, or staff" });
    }

    if (name) user.name = name;

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (role && allowedRoles.includes(role)) {
      user.role = role;
    }

    if (assignedEvents && Array.isArray(assignedEvents)) {
      user.assignedEvents = assignedEvents;
    }

    if (typeof active === "boolean") user.active = active;

    await user.save();

    res.json({
      message: "Team member updated successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete team member
 */
export const deleteTeamMember = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["event_admin", "staff_admin"].includes(user.role)) {
      return res.status(400).json({ message: "Can only delete event_admin or staff_admin" });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: "Team member deleted successfully",
      deletedUser: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ EVENT MANAGEMENT ============

/**
 * Get all events (for this admin's organization)
 */
export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = req.user.role === "super_admin" ? {} : { organizer: req.user._id };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get event details with analytics
 */
export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId).populate("organizer", "name email").lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization
    if (req.user.role !== "super_admin" && event.organizer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this event" });
    }

    // Get booking analytics
    const bookings = await Booking.find({ event: eventId }).lean();
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.json({
      event,
      bookingStats: {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
        refunded: bookings.filter((b) => b.status === "refunded").length,
        totalRevenue,
        averageTicketPrice: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new event (admin creation)
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, location, locationDetails, image, category, price, date, totalTickets, status, ticketTypes } = req.body;

    // Validate required fields
    if (!title || !date || !totalTickets) {
      return res.status(400).json({ message: "Title, date, and total tickets are required" });
    }

    // Require at least one ticket type
    if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return res.status(400).json({ message: "At least one ticket type is required" });
    }

    const newEvent = new Event({
      title,
      description: description || "",
      location: location || "",
      locationDetails: locationDetails || "",
      image: image || "",
      category: category || "General",
      price: Number(price) || 0,
      date: new Date(date),
      totalTickets: Number(totalTickets),
      availableTickets: Number(totalTickets),
      organizer: req.user._id,
      status: status || "active",
      ticketTypes: ticketTypes
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update event (title, date, price, status, etc.)
 */
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization
    if (req.user.role !== "super_admin" && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    // Validate and apply date if provided
    if ("date" in updates) {
      const parsedDate = new Date(updates.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      event.date = parsedDate;
    }

    // Handle capacity change and keep availability in sync with existing bookings
    if ("totalTickets" in updates) {
      const newTotal = Number(updates.totalTickets);
      if (!Number.isFinite(newTotal) || newTotal <= 0) {
        return res.status(400).json({ message: "totalTickets must be a positive number" });
      }
      const booked = Math.max(0, (event.totalTickets || 0) - (event.availableTickets || 0));
      const recalculatedAvailable = Math.max(0, newTotal - booked);
      event.totalTickets = newTotal;
      event.availableTickets = recalculatedAvailable;
    }

    // Handle ticket types if provided
    if ("ticketTypes" in updates && Array.isArray(updates.ticketTypes)) {
      event.ticketTypes = updates.ticketTypes;
    }

    // Apply other simple fields
    const allowedFields = [
      "title",
      "location",
      "locationDetails",
      "price",
      "category",
      "image",
      "status",
      "description",
    ];

    allowedFields.forEach((field) => {
      if (field in updates) {
        event[field] = updates[field];
      }
    });

    await event.save();

    res.json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ BOOKING MANAGEMENT ============

/**
 * Get all bookings for admin's events
 */
export const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get admin's event IDs
    const eventFilter = req.user.role === "super_admin" ? {} : { organizer: req.user._id };
    const adminEvents = await Event.find(eventFilter).select("_id").lean();
    const adminEventIds = adminEvents.map((e) => e._id);

    const filter = adminEventIds.length > 0 ? { event: { $in: adminEventIds } } : {};
    if (status) filter.status = status;
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.event = eventId;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "name email")
        .populate("event", "title date")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "refunded"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(bookingId).populate("event");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization check
    if (req.user.role !== "super_admin" && booking.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    await booking.save();

    res.json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ CONTACTS / INQUIRIES ============

/**
 * Get all contacts
 */
export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [contactsRaw, total] = await Promise.all([
      Contact.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contact.countDocuments(),
    ]);

    const contacts = contactsRaw.map((c) => ({
      ...c,
      replied: c.replied ?? c.status === "replied",
      replyMessage: c.replyMessage ?? c.reply ?? null,
      repliedAt: c.repliedAt ?? c.replyDate ?? null,
    }));

    res.json({
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reply to a contact inquiry
 */
export const replyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: "Reply message required" });
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      {
        replied: true, // legacy UI flag
        replyMessage: reply, // legacy field
        repliedAt: new Date(), // legacy field
        status: "replied",
        reply: reply,
        replyDate: new Date(),
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Notify the customer via email with the admin's reply
    const emailSent = await sendReplyEmail(
      contact.email,
      contact.name || "Customer",
      contact.subject || "Your inquiry",
      reply
    );

    res.json({
      message: emailSent
        ? "Reply sent and customer emailed"
        : "Reply saved, but email notification failed",
      contact,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

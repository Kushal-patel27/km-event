import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ADMIN_ROLE_SET } from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Contact from "../models/Contact.js";
import { sendReplyEmail } from "../utils/emailService.js";
import { notifyNextInLine } from "./waitlistController.js";
import { generateCSV, generateExcel, generatePDF, formatDate, formatCurrency, formatStatus } from "../utils/exportUtils.js";

const CANCELLATION_STATUSES = new Set(["cancelled", "refunded"]);

async function restoreTicketsAndNotifyWaitlist(booking) {
  if (!booking?.event) return;

  const eventId = booking.event?._id || booking.event;
  const event = await Event.findById(eventId);
  if (!event) return;

  const quantity = Number(booking.quantity) || 0;
  if (quantity <= 0) return;

  if (Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 && booking.ticketType?.name) {
    const ticketType = event.ticketTypes.find(t => t.name === booking.ticketType.name);
    if (ticketType) {
      ticketType.available = (ticketType.available ?? 0) + quantity;
    }

    const aggregatedAvailable = event.ticketTypes.reduce((sum, t) => sum + (t?.available ?? 0), 0);
    const aggregatedTotal = event.ticketTypes.reduce((sum, t) => sum + (t?.quantity ?? 0), 0);
    event.availableTickets = Math.max(0, aggregatedAvailable);
    event.totalTickets = Math.max(0, aggregatedTotal);
  } else if (typeof event.availableTickets === "number") {
    event.availableTickets = Math.max(0, event.availableTickets + quantity);
  }

  await event.save();

  try {
    const ticketTypeName = booking.ticketType?.name || "General";
    await notifyNextInLine(event._id, ticketTypeName, quantity);
  } catch (waitlistError) {
    console.error("Error notifying waitlist:", waitlistError);
  }
}

// ============ DASHBOARD ANALYTICS ============

/**
 * Get admin dashboard overview (organization-level stats)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get events for admin dashboard (all events for admin/super_admin)
    const eventFilter = ["super_admin", "admin"].includes(req.user.role) ? {} : { organizer: userId };
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
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount ?? b.totalPrice ?? 0), 0);
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
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount ?? b.totalPrice ?? 0), 0);

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
    const { title, description, location, locationDetails, mapLink, image, category, price, date, totalTickets, status, ticketTypes } = req.body;

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
      mapLink: mapLink || "",
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
      "mapLink",
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

/**
 * Delete an event (admin/super_admin only, must own the event or be super_admin)
 */
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization - only super_admin or the event organizer can delete
    if (req.user.role !== "super_admin" && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    // Optional: Check if there are active bookings
    const activeBookingsCount = await Booking.countDocuments({ 
      event: eventId, 
      status: { $nin: ['cancelled', 'refunded'] }
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete event with ${activeBookingsCount} active bookings. Please cancel all bookings first.` 
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({
      message: "Event deleted successfully",
      eventId
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

    const previousStatus = booking.status;
    booking.status = status;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("event");

    if (CANCELLATION_STATUSES.has(status) && !CANCELLATION_STATUSES.has(previousStatus)) {
      await restoreTicketsAndNotifyWaitlist(booking);
    }

    res.json({
      message: "Booking status updated",
      booking: updatedBooking,
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

// ============ EXPORT DATA FUNCTIONS ============

/**
 * Export events data with filters
 */
export const exportEventsData = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, category, location, status } = req.query;

    // Build filter query
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (status) filter.status = status;

    // Fetch events
    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .sort({ date: -1 })
      .lean();

    // Define columns for export
    const columns = [
      { key: 'title', header: 'Event Title', width: 30 },
      { key: 'date', header: 'Event Date', width: 20, format: formatDate },
      { key: 'location', header: 'Location', width: 25 },
      { key: 'category', header: 'Category', width: 15 },
      { key: 'price', header: 'Price (INR)', width: 15, format: formatCurrency },
      { key: 'totalTickets', header: 'Total Tickets', width: 15 },
      { key: 'availableTickets', header: 'Available Tickets', width: 18 },
      { key: 'organizerName', header: 'Organizer', width: 20 },
      { key: 'status', header: 'Status', width: 15, format: formatStatus },
      { key: 'createdAt', header: 'Created At', width: 20, format: formatDate }
    ];

    // Format data for export
    const exportData = events.map(event => ({
      ...event,
      organizerName: event.organizer?.name || 'N/A',
      totalTickets: event.totalTickets || event.capacity || 0,
      availableTickets: event.availableTickets || 0
    }));

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=events-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const buffer = await generateExcel(exportData, columns, 'Events');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=events-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(exportData, columns, {
        title: 'Events Report',
        subtitle: `Generated on ${formatDate(new Date())}`
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=events-export-${Date.now()}.pdf`);
      return res.send(buffer);
    }

    return res.status(400).json({ message: 'Invalid format. Use csv, xlsx, or pdf' });
  } catch (error) {
    console.error('Export events error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export bookings data with filters
 */
export const exportBookingsData = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, status, eventId, paymentStatus } = req.query;

    // Build filter query
    const filter = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (status) filter.status = status;
    if (eventId) filter.event = eventId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Fetch bookings
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('event', 'title date location')
      .sort({ createdAt: -1 })
      .lean();

    // Define columns for export
    const columns = [
      { key: 'bookingId', header: 'Booking ID', width: 25 },
      { key: 'customerName', header: 'Customer Name', width: 25 },
      { key: 'customerEmail', header: 'Customer Email', width: 30 },
      { key: 'customerPhone', header: 'Phone', width: 18 },
      { key: 'eventTitle', header: 'Event', width: 30 },
      { key: 'eventDate', header: 'Event Date', width: 20, format: formatDate },
      { key: 'ticketType', header: 'Ticket Type', width: 20 },
      { key: 'quantity', header: 'Quantity', width: 12 },
      { key: 'totalAmount', header: 'Amount (INR)', width: 15, format: formatCurrency },
      { key: 'status', header: 'Booking Status', width: 15, format: formatStatus },
      { key: 'paymentStatus', header: 'Payment Status', width: 15, format: formatStatus },
      { key: 'bookingDate', header: 'Booking Date', width: 20, format: formatDate },
      { key: 'scanned', header: 'Scanned', width: 12 }
    ];

    // Format data for export
    const exportData = bookings.map(booking => ({
      bookingId: booking._id.toString(),
      customerName: booking.user?.name || 'N/A',
      customerEmail: booking.user?.email || 'N/A',
      customerPhone: booking.user?.phone || 'N/A',
      eventTitle: booking.event?.title || 'N/A',
      eventDate: booking.event?.date,
      ticketType: booking.ticketType?.name || 'General',
      quantity: booking.quantity || 1,
      totalAmount: booking.totalAmount || booking.totalPrice || 0,
      status: booking.status || 'pending',
      paymentStatus: booking.paymentStatus || 'completed',
      bookingDate: booking.createdAt,
      scanned: booking.lastScannedAt ? 'Yes' : 'No'
    }));

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const buffer = await generateExcel(exportData, columns, 'Bookings');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(exportData, columns, {
        title: 'Bookings Report',
        subtitle: `Generated on ${formatDate(new Date())}`
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.pdf`);
      return res.send(buffer);
    }

    return res.status(400).json({ message: 'Invalid format. Use csv, xlsx, or pdf' });
  } catch (error) {
    console.error('Export bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};


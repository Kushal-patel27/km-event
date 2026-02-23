import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ADMIN_ROLE_SET } from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Contact from "../models/Contact.js";
import SystemConfig from "../models/SystemConfig.js";

// ============ USER MANAGEMENT ============

/**
 * Get all users with pagination, search, and filters
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, active } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role) filter.role = role;
    if (typeof active === "string") filter.active = active === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -sessions")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
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
 * Get single user details
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-password -sessions").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's bookings and contact submissions
    const [bookings, contacts] = await Promise.all([
      Booking.find({ user: userId }).lean(),
      Contact.find({ userId }).lean(),
    ]);

    res.json({
      user,
      bookings: bookings.length,
      contacts: contacts.length,
      lastLogin: user.lastLoginAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update user details (name, email, active status)
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent disabling super admin
    if (user.role === "super_admin" && active === false) {
      return res.status(403).json({ message: "Cannot disable super admin accounts" });
    }

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    if (typeof active === "boolean") user.active = active;

    await user.save();

    res.json({
      message: "User updated successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user's password (super admin only)
export const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const incomingPassword = req.body?.password || req.body?.newPassword;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!incomingPassword || incomingPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow super admins to reset any account, but keep basic guard for their own account
    if (user.role === "super_admin" && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot change password for another super admin" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(incomingPassword, salt);
    // Invalidate all active sessions/tokens so old password cannot be used
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.sessions = [];
    await user.save();

    const sanitized = user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } });
    return res.json({ message: "Password updated successfully", user: sanitized });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Disable/ban a user
 */
export const disableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent disabling super admin
    if (user.role === "super_admin") {
      return res.status(403).json({ message: "Cannot disable super admin accounts" });
    }

    user.active = false;
    // Invalidate existing sessions/tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.sessions = [];
    // Store ban reason in preferences
    user.preferences = user.preferences || {};
    user.preferences.bannedReason = reason || "No reason provided";
    user.preferences.bannedAt = new Date();
    await user.save();

    res.json({
      message: "User disabled successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reactivate a disabled user
 */
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.active = true;
    if (user.preferences) {
      user.preferences.bannedReason = undefined;
      user.preferences.bannedAt = undefined;
    }
    await user.save();

    res.json({
      message: "User reactivated successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new user (super admin only)
 */
const ALLOWED_ROLES = ["user", "staff", ...Array.from(ADMIN_ROLE_SET)];

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
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
    });

    res.status(201).json({
      message: "User created successfully",
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Assign/change user role
 */
export const assignUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, assignedEvents } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing super admin role
    if (user.role === "super_admin" && role !== "super_admin") {
      return res.status(403).json({ message: "Cannot change super admin role" });
    }

    user.role = role;
    if (assignedEvents && Array.isArray(assignedEvents)) {
      user.assignedEvents = assignedEvents;
    }
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user: user.toObject({ versionKey: false, transform: (_, obj) => { delete obj.password; return obj; } }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete user account
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({ message: "Cannot delete super admin accounts" });
    }

    // Delete associated bookings and contacts
    await Promise.all([
      Booking.deleteMany({ user: userId }),
      Contact.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and associated data deleted successfully",
      deletedUser: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ STAFF MANAGEMENT (Global/System-wide) ============

/**
 * Create global staff member (Super Admin only)
 * Can create both staff (scanner) and staff_admin (gate/team manager)
 */
export const createGlobalStaff = async (req, res) => {
  try {
    const { name, email, role = "staff", eventIds = [], gates = [], sendInvite = false, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Validate role
    if (!["staff", "staff_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'staff' or 'staff_admin'" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user && (user.role === "staff" || user.role === "staff_admin")) {
      return res.status(400).json({ message: "Staff member with this email already exists" });
    }

    if (!user) {
      // Create new staff user
      const hashed = password ? await bcrypt.hash(password, 10) : undefined;
      user = new User({
        name,
        email,
        role,
        password: hashed,
        assignedEvents: eventIds || [],
        assignedGates: role === "staff" ? (gates || []) : [], // Only scanner staff has gates
        assignedBy: req.user._id,
        active: true,
      });
    } else {
      // Convert existing user to staff/staff_admin
      user.role = role;
      user.assignedEvents = eventIds || [];
      user.assignedGates = role === "staff" ? (gates || []) : [];
      user.assignedBy = req.user._id;
      user.active = true;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: `${role === "staff_admin" ? "Staff Admin" : "Scanner Staff"} created successfully`,
      staff: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: user.assignedEvents,
        assignedGates: user.assignedGates,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Create global staff error:", err);
    res.status(500).json({ message: err.message || "Failed to create staff" });
  }
};

/**
 * Get all global staff members
 * Returns both staff (scanner) and staff_admin (gate/team manager)
 */
export const getGlobalStaff = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, eventId, gate } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { role: { $in: ["staff", "staff_admin"] } };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (eventId) {
      filter.assignedEvents = mongoose.Types.ObjectId.isValid(eventId) ? eventId : null;
    }

    if (gate) {
      filter.assignedGates = gate;
    }

    const [staff, total] = await Promise.all([
      User.find(filter)
        .select("_id name email assignedEvents assignedGates active createdAt")
        .populate("assignedEvents", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Get global staff error:", err);
    res.status(500).json({ message: err.message || "Failed to get staff" });
  }
};

/**
 * Update global staff member
 * Can update both staff (scanner) and staff_admin (gate/team manager)
 */
export const updateGlobalStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, role, eventIds, gates, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff ID" });
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (!["staff", "staff_admin"].includes(staff.role)) {
      return res.status(403).json({ message: "User is not a staff member" });
    }

    // Validate role if provided
    if (role && !["staff", "staff_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'staff' or 'staff_admin'" });
    }

    // Update fields
    if (name) staff.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: staffId } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      staff.email = email;
    }
    if (role) staff.role = role;
    if (eventIds) staff.assignedEvents = eventIds;
    
    // Only assign gates to scanner staff
    if (gates) {
      staff.assignedGates = (staff.role === "staff" || role === "staff") ? gates : [];
    }
    
    if (typeof active === "boolean") staff.active = active;

    await staff.save();

    res.json({
      success: true,
      message: `${staff.role === "staff_admin" ? "Staff Admin" : "Scanner Staff"} updated successfully`,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        assignedEvents: staff.assignedEvents,
        assignedGates: staff.assignedGates,
        active: staff.active,
      },
    });
  } catch (err) {
    console.error("Update global staff error:", err);
    res.status(500).json({ message: err.message || "Failed to update staff" });
  }
};

/**
 * Delete/Deactivate global staff member
 * Works for both staff (scanner) and staff_admin (gate/team manager)
 */
export const deleteGlobalStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff ID" });
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (!["staff", "staff_admin"].includes(staff.role)) {
      return res.status(403).json({ message: "User is not a staff member" });
    }

    // Soft delete - deactivate instead of removing
    staff.active = false;
    await staff.save();

    res.json({
      success: true,
      message: `${staff.role === "staff_admin" ? "Staff Admin" : "Scanner Staff"} deactivated successfully`,
      staffId: staff._id,
    });
  } catch (err) {
    console.error("Delete global staff error:", err);
    res.status(500).json({ message: err.message || "Failed to delete staff" });
  }
};

// ============ ROLE MANAGEMENT ============

/**
 * Get all available roles
 */
export const getRoles = async (req, res) => {
  try {
    const roles = [
      {
        id: "super_admin",
        name: "Super Admin",
        description: "Full platform control - system owner",
        permissions: ["all"],
      },
      {
        id: "admin",
        name: "Admin",
        description: "Platform admin - manage users, events, bookings",
        permissions: ["manage_users", "manage_events", "manage_bookings", "view_analytics"],
      },
      {
        id: "event_admin",
        name: "Event Admin",
        description: "Manage specific events and their bookings",
        permissions: ["manage_events", "manage_event_bookings", "view_event_analytics"],
      },
      {
        id: "staff_admin",
        name: "Staff Admin (Gate/Team Manager)",
        description: "Manages staff for entry operations - creates scanner staff, assigns gates, approves manual entries",
        permissions: ["manage_staff", "approve_entries", "view_entry_logs", "assign_gates"],
      },
      {
        id: "staff",
        name: "Staff (Scanner Only)",
        description: "Lowest role - Entry execution only - scans tickets, checks status, requests manual approval",
        permissions: ["scan_tickets", "view_ticket_status", "request_manual_entry"],
      },
      {
        id: "user",
        name: "Regular User",
        description: "Can book tickets and view events",
        permissions: ["book_tickets", "view_events"],
      },
    ];

    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ EVENT MANAGEMENT ============

/**
 * Get all events
 */
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
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

    // Get booking analytics
    const bookings = await Booking.find({ event: eventId }).lean();
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.json({
      event,
      bookingStats: {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
        totalRevenue,
        averageTicketPrice: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update event (super admin can edit any event)
 */
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId).populate("organizer", "name email");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate and apply date if present
    if ("date" in updates) {
      const parsedDate = new Date(updates.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      event.date = parsedDate;
    }

    // Keep capacity and availability aligned when totalTickets changes
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

/**
 * Delete event
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

    // Delete associated bookings
    await Booking.deleteMany({ event: eventId });

    await Event.findByIdAndDelete(eventId);

    res.json({
      message: "Event and associated bookings deleted successfully",
      deletedEvent: event.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ BOOKING MANAGEMENT ============

/**
 * Get all bookings
 */
export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.event = eventId;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "name email")
        .populate("event", "title")
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

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    if (!["confirmed", "cancelled", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("user", "name email")
      .populate("event", "title");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Refund booking
 */
export const refundBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "refunded") {
      return res.status(400).json({ message: "Already refunded" });
    }

    booking.status = "refunded";
    booking.refundedAt = new Date();
    booking.refundReason = reason || "Admin refund";
    await booking.save();

    res.json({
      message: "Booking refunded successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ ANALYTICS & REPORTS ============

/**
 * Get platform-wide analytics
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Build a safe date match only if provided and valid
    const createdAtMatch = {};
    if (startDate) {
      const sd = new Date(startDate);
      if (Number.isNaN(sd.getTime())) return res.status(400).json({ message: "Invalid startDate" });
      createdAtMatch.$gte = sd;
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (Number.isNaN(ed.getTime())) return res.status(400).json({ message: "Invalid endDate" });
      createdAtMatch.$lte = ed;
    }

    const hasDateFilter = Object.keys(createdAtMatch).length > 0;
    const bookingMatchStage = hasDateFilter ? [{ $match: { createdAt: createdAtMatch } }] : [];
    const bookingFindFilter = hasDateFilter ? { createdAt: createdAtMatch } : {};

    const [totalUsers, activeUsers, totalEvents, totalBookings, totalRevenue, staffCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Event.countDocuments(),
      Booking.countDocuments(bookingFindFilter),
      Booking.aggregate([
        ...bookingMatchStage,
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.countDocuments({ role: "staff" }),
    ]);

    const bookingsByStatus = await Booking.aggregate([
      ...bookingMatchStage,
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const eventsByStatus = await Event.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ["$status", "scheduled"]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalEvents,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        staffCount,
      },
      bookingsByStatus: Object.fromEntries(
        bookingsByStatus.map((b) => [b._id, b.count])
      ),
      eventsByStatus: Object.fromEntries(
        eventsByStatus.map((e) => [e._id, e.count])
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ SYSTEM SETTINGS ============

/**
 * Get system configuration
 */
export const getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findById("system_config");
    
    console.log('[GET CONFIG] Fetching system config from database');

    // Create default config ONLY if it doesn't exist
    if (!config) {
      console.log('[GET CONFIG] No config found, creating default');
      config = new SystemConfig({
        _id: "system_config",
        qrCodeRules: {
          enabled: true,
          allowMultipleScan: false,
        },
        ticketLimits: {
          maxPerEvent: 1000,
          maxPerUser: 10,
        },
        security: {
          enableTwoFactor: false,
          passwordMinLength: 8,
          sessionTimeout: 3600,
        },
        emailNotifications: {
          enabled: true,
          confirmationEmail: true,
          reminderEmail: true,
        },
      });
      await config.save();
      console.log('[GET CONFIG] Created and saved new default config');
    }
    
    console.log('[GET CONFIG] Returning config:', {
      exists: true,
      qrEnabled: config.qrCodeRules.enabled,
      allowMultipleScan: config.qrCodeRules.allowMultipleScan,
    });

    res.json(config);
  } catch (error) {
    console.error('[GET CONFIG ERROR]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (req, res) => {
  try {
    // The entire config object is sent from frontend
    const configData = req.body;

    console.log('[UPDATE CONFIG] Incoming complete config:', JSON.stringify(configData, null, 2));

    // Find existing config
    let config = await SystemConfig.findById("system_config");
    
    if (!config) {
      console.log('[UPDATE CONFIG] No existing config, creating new one');
      config = new SystemConfig({ _id: "system_config" });
    }

    // Replace entire config with new values
    if (configData.qrCodeRules) {
      config.qrCodeRules.enabled = configData.qrCodeRules.enabled;
      config.qrCodeRules.allowMultipleScan = configData.qrCodeRules.allowMultipleScan;
      config.markModified('qrCodeRules');
    }
    if (configData.ticketLimits) {
      config.ticketLimits.maxPerEvent = configData.ticketLimits.maxPerEvent;
      config.ticketLimits.maxPerUser = configData.ticketLimits.maxPerUser;
      config.markModified('ticketLimits');
    }
    if (configData.security) {
      config.security.enableTwoFactor = configData.security.enableTwoFactor;
      config.security.passwordMinLength = configData.security.passwordMinLength;
      config.security.sessionTimeout = configData.security.sessionTimeout;
      config.markModified('security');
    }
    if (configData.emailNotifications) {
      config.emailNotifications.enabled = configData.emailNotifications.enabled;
      config.emailNotifications.confirmationEmail = configData.emailNotifications.confirmationEmail;
      config.emailNotifications.reminderEmail = configData.emailNotifications.reminderEmail;
      config.markModified('emailNotifications');
    }

    // Save to database
    await config.save();

    console.log('[UPDATE CONFIG] Saved successfully to database');
    console.log('[UPDATE CONFIG] QR Enabled after save:', config.qrCodeRules.enabled);

    // Fetch fresh from DB to return
    const savedConfig = await SystemConfig.findById("system_config");
    
    console.log('[UPDATE CONFIG] QR Enabled from fresh DB fetch:', savedConfig.qrCodeRules.enabled);
    console.log('[UPDATE CONFIG] Full config from DB:', JSON.stringify(savedConfig, null, 2));

    res.json({
      message: "System configuration updated successfully",
      config: savedConfig,
    });
  } catch (error) {
    console.error('[UPDATE CONFIG ERROR]', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ LOGS & AUDIT ============

/**
 * Get system logs (login, user changes, etc.)
 */
export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, userId } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const logs = [];

    // Get recent users and their sessions
    const users = await User.find({}, { sessions: 1, _id: 1, email: 1, name: 1, createdAt: 1, lastLoginAt: 1, role: 1 })
      .lean()
      .limit(200)
      .sort({ lastLoginAt: -1 });

    users.forEach((user) => {
      // Get most recent session for IP info
      const mostRecentSession = user.sessions && user.sessions.length > 0 
        ? user.sessions.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))[0]
        : null;

      // Add user creation log
      if (user.createdAt) {
        logs.push({
          type: "user_created",
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          timestamp: user.createdAt,
          details: {
            role: user.role,
            ip: mostRecentSession?.ip,
          },
        });
      }

      // Add last login log
      if (user.lastLoginAt) {
        logs.push({
          type: "login",
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          timestamp: user.lastLoginAt,
          details: {
            role: user.role,
            ip: mostRecentSession?.ip,
            userAgent: mostRecentSession?.userAgent,
          },
        });
      }

      // Add session logs
      if (user.sessions && Array.isArray(user.sessions)) {
        user.sessions.forEach((session) => {
          if (session.lastSeenAt) {
            logs.push({
              type: "session_activity",
              userId: user._id,
              userEmail: user.email,
              userName: user.name,
              timestamp: session.lastSeenAt,
              details: {
                ip: session.ip,
                userAgent: session.userAgent,
                role: user.role,
              },
            });
          }
        });
      }
    });

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    recentBookings.forEach((booking) => {
      logs.push({
        type: "booking_created",
        userId: booking.user?._id,
        userEmail: booking.user?.email,
        userName: booking.user?.name,
        timestamp: booking.createdAt,
        details: {
          event: booking.event?.title,
          quantity: booking.quantity,
          status: booking.status,
        },
      });
    });

    // Sort all logs by timestamp
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply filters
    let filteredLogs = sortedLogs;
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId?.toString() === userId);
    }

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paginatedLogs = filteredLogs.slice(start, start + limitNum);

    res.json({
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export platform data
 */
export const exportPlatformData = async (req, res) => {
  try {
    const { dataType } = req.query; // users, events, bookings, all

    const data = {};

    if (dataType === "all" || dataType === "users") {
      data.users = await User.find().select("-password -sessions").lean();
    }
    if (dataType === "all" || dataType === "events") {
      data.events = await Event.find().lean();
    }
    if (dataType === "all" || dataType === "bookings") {
      data.bookings = await Booking.find().lean();
    }

    res.json({
      exportedAt: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all pending account deletion requests
 */
export const getPendingDeletionRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Find users with pending deletion requests
    const [users, total] = await Promise.all([
      User.find({
        'accountSettings.deletionScheduledAt': { $exists: true, $ne: null }
      })
        .select('-password -sessions')
        .sort({ 'accountSettings.deletionScheduledAt': 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments({
        'accountSettings.deletionScheduledAt': { $exists: true, $ne: null }
      })
    ]);

    // Format response with deletion details
    const formattedUsers = users.map(user => ({
      ...user,
      deletionDetails: {
        requestedAt: user.accountSettings?.deleteRequestedAt,
        scheduledFor: user.accountSettings?.deletionScheduledAt,
        daysRemaining: user.accountSettings?.deletionScheduledAt 
          ? Math.max(0, Math.ceil((new Date(user.accountSettings.deletionScheduledAt) - new Date()) / (1000 * 60 * 60 * 24)))
          : null
      }
    }));

    res.json({
      users: formattedUsers,
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
 * Cancel a pending account deletion request (Admin action)
 */
export const cancelUserDeletion = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.accountSettings?.deletionScheduledAt) {
      return res.status(400).json({ message: "User does not have a pending deletion request" });
    }

    user.accountSettings.deleteRequestedAt = null;
    user.accountSettings.deletionScheduledAt = null;
    await user.save();

    res.json({ 
      message: "Account deletion request cancelled successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

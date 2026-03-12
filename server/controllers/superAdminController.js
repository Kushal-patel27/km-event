import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { ADMIN_ROLE_SET } from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Contact from "../models/Contact.js";
import SystemConfig from "../models/SystemConfig.js";
import SecurityEvent from "../models/SecurityEvent.js";
import Payment from "../models/Payment.js";
import Commission from "../models/Commission.js";
import EventAdminPayout from "../models/EventAdminPayout.js";
import Coupon from "../models/Coupon.js";
import FeatureToggle from "../models/FeatureToggle.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { notifyNextInLine } from "./waitlistController.js";
import { generateCSV, generateExcel, generatePDF, formatDate, formatCurrency, formatStatus, getSelectedColumns } from "../utils/exportUtils.js";

const CANCELLATION_STATUSES = new Set(["cancelled", "refunded"]);

/**
 * Helper function to get minimum password length from system config
 */
async function getMinPasswordLength() {
  try {
    const config = await SystemConfig.findById('system_config');
    return config?.security?.passwordMinLength || 8;
  } catch (error) {
    console.error('Error fetching min password length:', error);
    return 8; // Default to 8 if config fetch fails
  }
}

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

    if (role === "event_admin") {
      const organizerIds = await Event.distinct("organizer");
      if (!organizerIds.length) {
        return res.json({
          users: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0,
          },
        });
      }
      filter._id = { $in: organizerIds };
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

    const minLength = await getMinPasswordLength();
    if (!incomingPassword || incomingPassword.length < minLength) {
      return res.status(400).json({ message: `Password must be at least ${minLength} characters` });
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
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount ?? b.totalPrice ?? 0), 0);

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

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email")
      .populate("event");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const previousStatus = booking.status;
    booking.status = status;

    // If changing from cancelled/pending to confirmed, decrement available tickets
    if (
      status === "confirmed" &&
      ["cancelled", "pending"].includes(previousStatus)
    ) {
      const event = await Event.findById(booking.event._id || booking.event);
      if (event) {
        const quantity = Number(booking.quantity) || 0;
        if (
          Array.isArray(event.ticketTypes) &&
          event.ticketTypes.length > 0 &&
          booking.ticketType?.name
        ) {
          const ticketType = event.ticketTypes.find(
            (t) => t.name === booking.ticketType.name
          );
          if (ticketType && (ticketType.available ?? 0) >= quantity) {
            ticketType.available = Math.max(0, (ticketType.available ?? 0) - quantity);
          }
          // Recalculate event availableTickets
          event.availableTickets = Math.max(
            0,
            event.ticketTypes.reduce((sum, t) => sum + (t?.available ?? 0), 0)
          );
        } else if (typeof event.availableTickets === "number") {
          event.availableTickets = Math.max(0, event.availableTickets - quantity);
        }
        await event.save();
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("user", "name email")
      .populate("event");

    if (
      CANCELLATION_STATUSES.has(status) &&
      !CANCELLATION_STATUSES.has(previousStatus)
    ) {
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

    const previousStatus = booking.status;
    booking.status = "refunded";
    booking.refundedAt = new Date();
    booking.refundReason = reason || "Admin refund";
    await booking.save();

    if (CANCELLATION_STATUSES.has(booking.status) && !CANCELLATION_STATUSES.has(previousStatus)) {
      await restoreTicketsAndNotifyWaitlist(booking);
    }

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
        { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", "$totalPrice"] } } } },
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

const AVAILABLE_LOG_TYPES = [
  "login",
  "user_created",
  "session_activity",
  "booking_created",
  "booking_updated",
  "event_created",
  "event_updated",
  "event_status_changed",
  "security_event",
  "payment_created",
  "payment_failed",
  "payment_refunded",
  "commission_status_changed",
  "payout_requested",
  "payout_processing",
  "payout_completed",
  "payout_failed",
  "payout_reversed",
  "coupon_created",
  "coupon_deactivated",
  "coupon_usage_updated",
  "feature_toggle_updated",
  "system_config_updated",
  "subscription_created",
  "subscription_status_changed",
  "subscription_plan_deactivated",
];

const PAYOUT_LOG_TYPES = new Set([
  "payout_requested",
  "payout_processing",
  "payout_completed",
  "payout_failed",
  "payout_reversed",
]);

function buildDateRangeQuery(field, startDate, endDate) {
  if (!startDate && !endDate) return {};

  const range = {};
  if (startDate) {
    range.$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return { [field]: range };
}

async function resolveUserIdFilter({ userId, email, search }) {
  if (!userId && !email && !search) return null;

  const filter = {};

  if (userId) {
    filter._id = userId;
  }

  if (email && search) {
    filter.$and = [
      { email: { $regex: email, $options: "i" } },
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
    ];
  } else if (email) {
    filter.email = { $regex: email, $options: "i" };
  } else if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const ids = await User.find(filter).distinct("_id");
  return ids;
}

function applySearchToMappedLogs(logs, search) {
  if (!search) return logs;
  const s = search.toLowerCase();
  return logs.filter((log) =>
    (log.userName || "").toLowerCase().includes(s) ||
    (log.userEmail || "").toLowerCase().includes(s) ||
    (log.type || "").toLowerCase().includes(s) ||
    JSON.stringify(log.details || {}).toLowerCase().includes(s)
  );
}

async function getTypeFilteredLogs({ type, pageNum, limitNum, userId, email, search, startDate, endDate }) {
  const skip = (pageNum - 1) * limitNum;
  const userIds = await resolveUserIdFilter({ userId, email, search });
  const hasUserFilter = Boolean(userId || email || search);

  if (hasUserFilter && (!userIds || userIds.length === 0)) {
    return {
      logs: [],
      total: 0,
      pages: 0,
    };
  }

  if (type === "login") {
    const query = {
      lastLoginAt: { $exists: true, $ne: null },
      ...buildDateRangeQuery("lastLoginAt", startDate, endDate),
    };
    if (userIds) query._id = { $in: userIds };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role lastLoginAt sessions")
        .sort({ lastLoginAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const logs = users.map((u) => {
      const mostRecentSession = Array.isArray(u.sessions) && u.sessions.length > 0
        ? [...u.sessions].sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))[0]
        : null;

      return {
        type: "login",
        userId: u._id,
        userEmail: u.email,
        userName: u.name,
        timestamp: u.lastLoginAt,
        details: {
          role: u.role,
          userAgent: mostRecentSession?.userAgent,
        },
      };
    });

    return { logs, total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "user_created") {
    const query = {
      createdAt: { $exists: true, $ne: null },
      ...buildDateRangeQuery("createdAt", startDate, endDate),
    };
    if (userIds) query._id = { $in: userIds };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const logs = users.map((u) => ({
      type: "user_created",
      userId: u._id,
      userEmail: u.email,
      userName: u.name,
      timestamp: u.createdAt,
      details: { role: u.role },
    }));

    return { logs, total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "session_activity") {
    const match = {};
    if (userIds) {
      match._id = { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const dateMatch = {};
    if (startDate) {
      dateMatch.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch.$lte = end;
    }

    const pipeline = [
      { $match: match },
      { $unwind: "$sessions" },
      { $match: { "sessions.lastSeenAt": { $exists: true, ...(Object.keys(dateMatch).length ? dateMatch : {}) } } },
      { $sort: { "sessions.lastSeenAt": -1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          sessionLastSeenAt: "$sessions.lastSeenAt",
          sessionUserAgent: "$sessions.userAgent",
          sessionIp: "$sessions.ip",
        },
      },
    ];

    const [rows, totalRows] = await Promise.all([
      User.aggregate([...pipeline, { $skip: skip }, { $limit: limitNum }]),
      User.aggregate([...pipeline, { $count: "total" }]),
    ]);

    const total = totalRows[0]?.total || 0;

    const logs = rows.map((row) => ({
      type: "session_activity",
      userId: row._id,
      userEmail: row.email,
      userName: row.name,
      timestamp: row.sessionLastSeenAt,
      details: {
        userAgent: row.sessionUserAgent,
        ip: row.sessionIp,
        role: row.role,
      },
    }));

    return { logs, total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "booking_created" || type === "booking_updated") {
    const query = {};
    if (userIds) query.user = { $in: userIds };

    if (type === "booking_created") {
      Object.assign(query, buildDateRangeQuery("createdAt", startDate, endDate));
    } else {
      query.$expr = { $gt: ["$updatedAt", "$createdAt"] };
      Object.assign(query, buildDateRangeQuery("updatedAt", startDate, endDate));
    }

    const [rows, total] = await Promise.all([
      Booking.find(query)
        .populate("user", "name email")
        .populate("event", "title")
        .sort(type === "booking_created" ? { createdAt: -1 } : { updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    const logs = rows.map((booking) => ({
      type,
      userId: booking.user?._id,
      userEmail: booking.user?.email,
      userName: booking.user?.name,
      timestamp: type === "booking_created" ? booking.createdAt : booking.updatedAt,
      details: {
        bookingId: booking.bookingId,
        event: booking.event?.title,
        quantity: booking.quantity,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "event_created" || type === "event_updated" || type === "event_status_changed") {
    const query = {};
    if (userIds) query.organizer = { $in: userIds };

    if (type === "event_created") {
      Object.assign(query, buildDateRangeQuery("createdAt", startDate, endDate));
    } else if (type === "event_updated") {
      query.$expr = { $gt: ["$updatedAt", "$createdAt"] };
      Object.assign(query, buildDateRangeQuery("updatedAt", startDate, endDate));
    } else {
      query.status = { $in: ["cancelled", "completed"] };
      Object.assign(query, buildDateRangeQuery("updatedAt", startDate, endDate));
    }

    const sort = type === "event_created" ? { createdAt: -1 } : { updatedAt: -1 };
    const [rows, total] = await Promise.all([
      Event.find(query)
        .populate("organizer", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    const logs = rows.map((event) => ({
      type,
      userId: event.organizer?._id,
      userEmail: event.organizer?.email,
      userName: event.organizer?.name,
      timestamp: type === "event_created" ? event.createdAt : (event.updatedAt || event.createdAt),
      details: {
        eventTitle: event.title,
        eventCategory: event.category,
        eventDate: event.date,
        totalTickets: event.totalTickets,
        status: event.status,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "security_event") {
    const query = {
      ...buildDateRangeQuery("createdAt", startDate, endDate),
    };
    if (userIds) query.user = { $in: userIds };
    if (email) query.email = { $regex: email, $options: "i" };

    const [rows, total] = await Promise.all([
      SecurityEvent.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SecurityEvent.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type: "security_event",
      userId: row.user?._id,
      userEmail: row.user?.email || row.email,
      userName: row.user?.name,
      timestamp: row.createdAt,
      details: {
        securityType: row.type,
        ip: row.ip,
        userAgent: row.userAgent,
        metadata: row.metadata,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "payment_created" || type === "payment_failed" || type === "payment_refunded") {
    const query = {
      ...buildDateRangeQuery("createdAt", startDate, endDate),
    };
    if (userIds) query.userId = { $in: userIds };
    if (type === "payment_failed") query.status = "failed";
    if (type === "payment_refunded") query.status = "refunded";

    const sortField = type === "payment_refunded" ? "refundedAt" : "createdAt";
    const [rows, total] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email")
        .sort({ [sortField]: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      userId: row.userId?._id,
      userEmail: row.userId?.email,
      userName: row.userId?.name,
      timestamp: type === "payment_refunded" ? (row.refundedAt || row.updatedAt || row.createdAt) : row.createdAt,
      details: {
        paymentType: row.paymentType,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        orderId: row.orderId,
        errorCode: row.errorCode,
        errorDescription: row.errorDescription,
        refundAmount: row.refundAmount,
        refundId: row.refundId,
        refundReason: row.refundReason,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "commission_status_changed") {
    const query = {
      status: { $ne: "pending" },
      ...buildDateRangeQuery("updatedAt", startDate, endDate),
    };
    if (userIds) query.organizer = { $in: userIds };

    const [rows, total] = await Promise.all([
      Commission.find(query)
        .populate("organizer", "name email")
        .populate("event", "title")
        .populate("booking", "bookingId")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Commission.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      userId: row.organizer?._id,
      userEmail: row.organizer?.email,
      userName: row.organizer?.name,
      timestamp: row.updatedAt || row.createdAt,
      details: {
        event: row.event?.title,
        bookingId: row.booking?.bookingId,
        status: row.status,
        notes: row.notes,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (PAYOUT_LOG_TYPES.has(type)) {
    const query = {
      ...buildDateRangeQuery("createdAt", startDate, endDate),
    };
    if (userIds) query.eventAdmin = { $in: userIds };
    if (type === "payout_requested") {
      query.status = "pending";
    } else {
      query.status = type.replace("payout_", "");
    }

    const [rows, total] = await Promise.all([
      EventAdminPayout.find(query)
        .populate("eventAdmin", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EventAdminPayout.countDocuments(query),
    ]);

    const logs = rows.map((row) => {
      const timestamp = row.completedAt || row.processedAt || row.updatedAt || row.requestedAt || row.createdAt;
      return {
        type,
        userId: row.eventAdmin?._id,
        userEmail: row.eventAdmin?.email,
        userName: row.eventAdmin?.name,
        timestamp,
        details: {
          amount: row.totalAmount,
          status: row.status,
          paymentMethod: row.paymentMethod,
          transactionId: row.transactionId,
          failureReason: row.failureReason,
          notes: row.notes,
        },
      };
    });

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "coupon_created" || type === "coupon_deactivated" || type === "coupon_usage_updated") {
    const query = {
      ...buildDateRangeQuery("createdAt", startDate, endDate),
    };
    if (userIds) query.createdBy = { $in: userIds };
    if (type === "coupon_deactivated") query.isActive = false;
    if (type === "coupon_usage_updated") query.usageCount = { $gt: 0 };

    const [rows, total] = await Promise.all([
      Coupon.find(query)
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      userId: row.createdBy?._id,
      userEmail: row.createdBy?.email,
      userName: row.createdBy?.name,
      timestamp: type === "coupon_created" ? row.createdAt : (row.updatedAt || row.createdAt),
      details: {
        code: row.code,
        discountType: row.discountType,
        discountValue: row.discountValue,
        usageLimit: row.usageLimit,
        usageCount: row.usageCount,
        isActive: row.isActive,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "feature_toggle_updated") {
    const query = {
      ...buildDateRangeQuery("updatedAt", startDate, endDate),
    };
    if (userIds) query.toggledBy = { $in: userIds };

    const [rows, total] = await Promise.all([
      FeatureToggle.find(query)
        .populate("eventId", "title")
        .populate("toggledBy", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FeatureToggle.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      userId: row.toggledBy?._id,
      userEmail: row.toggledBy?.email,
      userName: row.toggledBy?.name,
      timestamp: row.updatedAt || row.createdAt,
      details: {
        event: row.eventId?.title,
        features: row.features,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "system_config_updated") {
    const doc = await SystemConfig.findById("system_config").lean();
    if (!doc?.updatedAt) {
      return { logs: [], total: 0, pages: 0 };
    }

    const inRange = (() => {
      if (!startDate && !endDate) return true;
      const t = new Date(doc.updatedAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Infinity;
      return t >= start && t <= end;
    })();

    if (!inRange || skip > 0) {
      return { logs: [], total: 0, pages: 0 };
    }

    return {
      logs: [
        {
          type,
          timestamp: doc.updatedAt,
          details: {
            qrCodeRules: doc.qrCodeRules,
            ticketLimits: doc.ticketLimits,
            security: doc.security,
            emailNotifications: doc.emailNotifications,
          },
        },
      ],
      total: 1,
      pages: 1,
    };
  }

  if (type === "subscription_created" || type === "subscription_status_changed") {
    const query = {};
    if (userIds) query.organizer = { $in: userIds };
    if (type === "subscription_status_changed") {
      query.status = { $ne: "active" };
      Object.assign(query, buildDateRangeQuery("updatedAt", startDate, endDate));
    } else {
      Object.assign(query, buildDateRangeQuery("createdAt", startDate, endDate));
    }

    const [rows, total] = await Promise.all([
      OrganizerSubscription.find(query)
        .populate("organizer", "name email")
        .populate("plan", "name displayName")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      OrganizerSubscription.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      userId: row.organizer?._id,
      userEmail: row.organizer?.email,
      userName: row.organizer?.name,
      timestamp: type === "subscription_created"
        ? (row.subscribedAt || row.createdAt)
        : (row.cancelledAt || row.updatedAt || row.createdAt),
      details: {
        plan: row.plan?.displayName || row.plan?.name,
        status: row.status,
        commissionPercentage: row.currentCommissionPercentage,
        reason: row.cancelReason,
        notes: row.notes,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  if (type === "subscription_plan_deactivated") {
    const query = {
      isActive: false,
      ...buildDateRangeQuery("updatedAt", startDate, endDate),
    };

    const [rows, total] = await Promise.all([
      SubscriptionPlan.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SubscriptionPlan.countDocuments(query),
    ]);

    const logs = rows.map((row) => ({
      type,
      timestamp: row.updatedAt || row.createdAt,
      details: {
        name: row.displayName || row.name,
        commissionPercentage: row.commissionPercentage,
      },
    }));

    return { logs: applySearchToMappedLogs(logs, search), total, pages: Math.ceil(total / limitNum) };
  }

  return {
    logs: [],
    total: 0,
    pages: 0,
  };
}

/**
 * Get system logs (login, user changes, etc.)
 */
export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, userId, email, search, startDate, endDate } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Fast path: for type-filtered requests query only the required collection.
    if (type) {
      const result = await getTypeFilteredLogs({
        type,
        pageNum,
        limitNum,
        userId,
        email,
        search,
        startDate,
        endDate,
      });

      return res.json({
        logs: result.logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: result.pages,
        },
        filters: {
          availableTypes: AVAILABLE_LOG_TYPES,
        },
      });
    }

    const userIds = await resolveUserIdFilter({ userId, email });
    const hasUserScopedFilter = Boolean(userId || email);

    if (hasUserScopedFilter && userIds && userIds.length === 0) {
      return res.json({
        logs: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        filters: {
          availableTypes: AVAILABLE_LOG_TYPES,
        },
      });
    }

    const dateRange = (() => {
      const range = {};
      if (startDate) range.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
      }
      return Object.keys(range).length ? range : null;
    })();

    const logs = [];
    const pushLog = (entry) => {
      if (!entry?.timestamp) return;
      logs.push(entry);
    };

    // Get all users first so we can enrich user IDs from other collections.
    const usersQuery = {};
    if (userIds) {
      usersQuery._id = { $in: userIds };
    }
    if (dateRange) {
      usersQuery.$or = [
        { createdAt: dateRange },
        { lastLoginAt: dateRange },
        { "sessions.lastSeenAt": dateRange },
      ];
    }

    const users = await User.find(usersQuery, { sessions: { $slice: -10 }, _id: 1, email: 1, name: 1, createdAt: 1, lastLoginAt: 1, role: 1 })
      .lean()
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .limit(400);

    users.forEach((user) => {
      // Get most recent session for IP info
      const mostRecentSession = user.sessions && user.sessions.length > 0
        ? user.sessions.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))[0]
        : null;

      // Add user creation log
      if (user.createdAt) {
        pushLog({
          type: "user_created",
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          timestamp: user.createdAt,
          details: {
            role: user.role,
          },
        });
      }

      // Add last login log
      if (user.lastLoginAt) {
        pushLog({
          type: "login",
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          timestamp: user.lastLoginAt,
          details: {
            role: user.role,
            userAgent: mostRecentSession?.userAgent,
          },
        });
      }

      // Add session logs
      if (user.sessions && Array.isArray(user.sessions)) {
        const sortedSessions = [...user.sessions]
          .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
          .slice(0, 5);

        sortedSessions.forEach((session) => {
          if (session.lastSeenAt) {
            const sessionTs = new Date(session.lastSeenAt);
            if (dateRange?.$gte && sessionTs < dateRange.$gte) return;
            if (dateRange?.$lte && sessionTs > dateRange.$lte) return;

            pushLog({
              type: "session_activity",
              userId: user._id,
              userEmail: user.email,
              userName: user.name,
              timestamp: session.lastSeenAt,
              details: {
                userAgent: session.userAgent,
                ip: session.ip,
                role: user.role,
              },
            });
          }
        });
      }
    });

    const [
      allBookings,
      allEvents,
      securityEvents,
      allPayments,
      allCommissions,
      allPayouts,
      allCoupons,
      allFeatureToggles,
      systemConfig,
      organizerSubscriptions,
      subscriptionPlans,
    ] = await Promise.all([
      Booking.find({
        ...(userIds ? { user: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      })
        .populate("user", "name email")
        .populate("event", "title")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      Event.find({
        ...(userIds ? { organizer: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      })
        .populate("organizer", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      SecurityEvent.find({
        ...(userIds ? { user: { $in: userIds } } : {}),
        ...(email ? { email: { $regex: email, $options: "i" } } : {}),
        ...buildDateRangeQuery("createdAt", startDate, endDate),
      })
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
      Payment.find({
        ...(userIds ? { userId: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }, { refundedAt: dateRange }] } : {}),
      })
        .populate("userId", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      Commission.find({
        ...(userIds ? { organizer: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      })
        .populate("organizer", "name email")
        .populate("event", "title")
        .populate("booking", "bookingId")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      EventAdminPayout.find({
        ...(userIds ? { eventAdmin: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }, { requestedAt: dateRange }] } : {}),
      })
        .populate("eventAdmin", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      Coupon.find({
        ...(userIds ? { createdBy: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      })
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      FeatureToggle.find({
        ...(userIds ? { toggledBy: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      })
        .populate("eventId", "title")
        .populate("toggledBy", "name email")
        .sort({ updatedAt: -1 })
        .limit(500)
        .lean(),
      SystemConfig.findById("system_config").lean(),
      OrganizerSubscription.find({
        ...(userIds ? { organizer: { $in: userIds } } : {}),
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }, { subscribedAt: dateRange }, { cancelledAt: dateRange }] } : {}),
      })
        .populate("organizer", "name email")
        .populate("plan", "name displayName")
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(500)
        .lean(),
      SubscriptionPlan.find({
        ...(dateRange ? { $or: [{ createdAt: dateRange }, { updatedAt: dateRange }] } : {}),
      }).sort({ updatedAt: -1, createdAt: -1 }).limit(500).lean(),
    ]);

    allBookings.forEach((booking) => {
      pushLog({
        type: "booking_created",
        userId: booking.user?._id,
        userEmail: booking.user?.email,
        userName: booking.user?.name,
        timestamp: booking.createdAt,
        details: {
          bookingId: booking.bookingId,
          event: booking.event?.title,
          quantity: booking.quantity,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
      });

      if (booking.updatedAt && booking.createdAt && new Date(booking.updatedAt) > new Date(booking.createdAt)) {
        pushLog({
          type: "booking_updated",
          userId: booking.user?._id,
          userEmail: booking.user?.email,
          userName: booking.user?.name,
          timestamp: booking.updatedAt,
          details: {
            bookingId: booking.bookingId,
            event: booking.event?.title,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
          },
        });
      }

    });

    allEvents.forEach((event) => {
      pushLog({
        type: "event_created",
        userId: event.organizer?._id,
        userEmail: event.organizer?.email,
        userName: event.organizer?.name,
        timestamp: event.createdAt,
        details: {
          eventTitle: event.title,
          eventCategory: event.category,
          eventDate: event.date,
          totalTickets: event.totalTickets,
          status: event.status,
        },
      });

      if (event.updatedAt && event.createdAt && new Date(event.updatedAt) > new Date(event.createdAt)) {
        pushLog({
          type: "event_updated",
          userId: event.organizer?._id,
          userEmail: event.organizer?.email,
          userName: event.organizer?.name,
          timestamp: event.updatedAt,
          details: {
            eventTitle: event.title,
            status: event.status,
            availableTickets: event.availableTickets,
          },
        });
      }

      if (event.status === "cancelled" || event.status === "completed") {
        pushLog({
          type: "event_status_changed",
          userId: event.organizer?._id,
          userEmail: event.organizer?.email,
          userName: event.organizer?.name,
          timestamp: event.updatedAt || event.createdAt,
          details: {
            eventTitle: event.title,
            status: event.status,
          },
        });
      }
    });

    securityEvents.forEach((securityEvent) => {
      pushLog({
        type: "security_event",
        userId: securityEvent.user?._id,
        userEmail: securityEvent.user?.email || securityEvent.email,
        userName: securityEvent.user?.name,
        timestamp: securityEvent.createdAt,
        details: {
          securityType: securityEvent.type,
          ip: securityEvent.ip,
          userAgent: securityEvent.userAgent,
          metadata: securityEvent.metadata,
        },
      });
    });

    allPayments.forEach((payment) => {
      const paymentUser = payment.userId;
      pushLog({
        type: "payment_created",
        userId: paymentUser?._id,
        userEmail: paymentUser?.email,
        userName: paymentUser?.name,
        timestamp: payment.createdAt,
        details: {
          paymentType: payment.paymentType,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          orderId: payment.orderId,
        },
      });

      if (payment.status === "failed") {
        pushLog({
          type: "payment_failed",
          userId: paymentUser?._id,
          userEmail: paymentUser?.email,
          userName: paymentUser?.name,
          timestamp: payment.updatedAt || payment.createdAt,
          details: {
            paymentType: payment.paymentType,
            amount: payment.amount,
            currency: payment.currency,
            orderId: payment.orderId,
            errorCode: payment.errorCode,
            errorDescription: payment.errorDescription,
          },
        });
      }

      if (payment.status === "refunded") {
        pushLog({
          type: "payment_refunded",
          userId: paymentUser?._id,
          userEmail: paymentUser?.email,
          userName: paymentUser?.name,
          timestamp: payment.refundedAt || payment.updatedAt || payment.createdAt,
          details: {
            paymentType: payment.paymentType,
            amount: payment.amount,
            refundAmount: payment.refundAmount,
            refundId: payment.refundId,
            refundReason: payment.refundReason,
            orderId: payment.orderId,
          },
        });
      }
    });

    allCommissions.forEach((commission) => {
      if (commission.status !== "pending") {
        pushLog({
          type: "commission_status_changed",
          userId: commission.organizer?._id,
          userEmail: commission.organizer?.email,
          userName: commission.organizer?.name,
          timestamp: commission.updatedAt || commission.createdAt,
          details: {
            event: commission.event?.title,
            bookingId: commission.booking?.bookingId,
            status: commission.status,
            notes: commission.notes,
          },
        });
      }
    });

    allPayouts.forEach((payout) => {
      pushLog({
        type: "payout_requested",
        userId: payout.eventAdmin?._id,
        userEmail: payout.eventAdmin?.email,
        userName: payout.eventAdmin?.name,
        timestamp: payout.requestedAt || payout.createdAt,
        details: {
          amount: payout.totalAmount,
          status: payout.status,
          paymentMethod: payout.paymentMethod,
          commissionAmount: payout.commissionAmount,
          commissionCount: payout.commissionCount,
          ticketCount: payout.ticketCount,
        },
      });

      if (payout.status !== "pending") {
        const payoutTimestamp = payout.completedAt || payout.processedAt || payout.updatedAt || payout.createdAt;
        pushLog({
          type: `payout_${payout.status}`,
          userId: payout.eventAdmin?._id,
          userEmail: payout.eventAdmin?.email,
          userName: payout.eventAdmin?.name,
          timestamp: payoutTimestamp,
          details: {
            amount: payout.totalAmount,
            status: payout.status,
            paymentMethod: payout.paymentMethod,
            transactionId: payout.transactionId,
            failureReason: payout.failureReason,
            notes: payout.notes,
          },
        });
      }
    });

    allCoupons.forEach((coupon) => {
      pushLog({
        type: "coupon_created",
        userId: coupon.createdBy?._id,
        userEmail: coupon.createdBy?.email,
        userName: coupon.createdBy?.name,
        timestamp: coupon.createdAt,
        details: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          usageLimit: coupon.usageLimit,
          usageCount: coupon.usageCount,
          isActive: coupon.isActive,
        },
      });

      if (!coupon.isActive) {
        pushLog({
          type: "coupon_deactivated",
          userId: coupon.createdBy?._id,
          userEmail: coupon.createdBy?.email,
          userName: coupon.createdBy?.name,
          timestamp: coupon.updatedAt || coupon.createdAt,
          details: {
            code: coupon.code,
            usageCount: coupon.usageCount,
          },
        });
      }

      if ((coupon.usageCount || 0) > 0) {
        pushLog({
          type: "coupon_usage_updated",
          userId: coupon.createdBy?._id,
          userEmail: coupon.createdBy?.email,
          userName: coupon.createdBy?.name,
          timestamp: coupon.updatedAt || coupon.createdAt,
          details: {
            code: coupon.code,
            usageCount: coupon.usageCount,
            usageLimit: coupon.usageLimit,
          },
        });
      }
    });

    allFeatureToggles.forEach((featureToggle) => {
      pushLog({
        type: "feature_toggle_updated",
        userId: featureToggle.toggledBy?._id,
        userEmail: featureToggle.toggledBy?.email,
        userName: featureToggle.toggledBy?.name,
        timestamp: featureToggle.updatedAt || featureToggle.createdAt,
        details: {
          event: featureToggle.eventId?.title,
          features: featureToggle.features,
        },
      });
    });

    if (systemConfig?.updatedAt) {
      pushLog({
        type: "system_config_updated",
        timestamp: systemConfig.updatedAt,
        details: {
          qrCodeRules: systemConfig.qrCodeRules,
          ticketLimits: systemConfig.ticketLimits,
          security: systemConfig.security,
          emailNotifications: systemConfig.emailNotifications,
        },
      });
    }

    organizerSubscriptions.forEach((subscription) => {
      pushLog({
        type: "subscription_created",
        userId: subscription.organizer?._id,
        userEmail: subscription.organizer?.email,
        userName: subscription.organizer?.name,
        timestamp: subscription.subscribedAt || subscription.createdAt,
        details: {
          plan: subscription.plan?.displayName || subscription.plan?.name,
          status: subscription.status,
          commissionPercentage: subscription.currentCommissionPercentage,
        },
      });

      if (subscription.status !== "active") {
        pushLog({
          type: "subscription_status_changed",
          userId: subscription.organizer?._id,
          userEmail: subscription.organizer?.email,
          userName: subscription.organizer?.name,
          timestamp: subscription.cancelledAt || subscription.updatedAt || subscription.createdAt,
          details: {
            plan: subscription.plan?.displayName || subscription.plan?.name,
            status: subscription.status,
            reason: subscription.cancelReason,
            notes: subscription.notes,
          },
        });
      }
    });

    subscriptionPlans.forEach((plan) => {
      if (!plan.isActive) {
        pushLog({
          type: "subscription_plan_deactivated",
          timestamp: plan.updatedAt || plan.createdAt,
          details: {
            name: plan.displayName || plan.name,
            commissionPercentage: plan.commissionPercentage,
          },
        });
      }
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
    if (email) {
      filteredLogs = filteredLogs.filter(log => log.userEmail?.toLowerCase().includes(email.toLowerCase()));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        (log.userName?.toLowerCase().includes(searchLower)) ||
        (log.userEmail?.toLowerCase().includes(searchLower)) ||
        (log.type?.toLowerCase().includes(searchLower)) ||
        (log.details?.event?.toLowerCase().includes(searchLower)) ||
        (log.details?.eventTitle?.toLowerCase().includes(searchLower)) ||
        ((log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)) || false)
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
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
      filters: {
        availableTypes: AVAILABLE_LOG_TYPES,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export users data
 */
export const exportUsers = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, role, active, selectedFields } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (role) filter.role = role;
    if (typeof active === 'string') filter.active = active === 'true';

    // Fetch users
    const users = await User.find(filter)
      .select('-password -sessions -tokenVersion')
      .sort({ createdAt: -1 })
      .lean();

    // Define columns for export
    const columns = [
      { key: 'name', header: 'Name', width: 25 },
      { key: 'email', header: 'Email', width: 30 },
      { key: 'role', header: 'Role', width: 20, format: formatStatus },
      { key: 'active', header: 'Status', width: 12, format: (val) => val ? 'Active' : 'Inactive' },
      { key: 'createdAt', header: 'Created', width: 20, format: formatDate },
      { key: 'lastLoginAt', header: 'Last Login', width: 20, format: formatDate }
    ];
    const exportColumns = getSelectedColumns(columns, selectedFields);

    // Format data for export
    const exportData = users.map(user => ({
      ...user,
      lastLoginAt: user.lastLoginAt || 'N/A'
    }));

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData, exportColumns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const buffer = await generateExcel(exportData, exportColumns, 'Users');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(exportData, exportColumns, {
        title: 'Users Report',
        subtitle: `Generated on ${formatDate(new Date())}`
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.pdf`);
      return res.send(buffer);
    }

    return res.status(400).json({ message: 'Invalid format. Use csv, xlsx, or pdf' });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export events data
 */
export const exportEvents = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, status, selectedFields } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
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
      { key: 'availableTickets', header: 'Available', width: 15 },
      { key: 'organizerName', header: 'Organizer', width: 20 },
      { key: 'status', header: 'Status', width: 15, format: formatStatus },
      { key: 'createdAt', header: 'Created', width: 20, format: formatDate }
    ];
    const exportColumns = getSelectedColumns(columns, selectedFields);

    // Format data for export
    const exportData = events.map(event => ({
      ...event,
      organizerName: event.organizer?.name || 'N/A',
      totalTickets: event.totalTickets || event.capacity || 0,
      availableTickets: event.availableTickets || 0
    }));

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(exportData, exportColumns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=events-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const buffer = await generateExcel(exportData, exportColumns, 'Events');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=events-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(exportData, exportColumns, {
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
 * Export bookings data
 */
export const exportBookings = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, status, paymentStatus, selectedFields } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (status) filter.status = status;
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
    const exportColumns = getSelectedColumns(columns, selectedFields);

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
      const csv = generateCSV(exportData, exportColumns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const buffer = await generateExcel(exportData, exportColumns, 'Bookings');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=bookings-export-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(exportData, exportColumns, {
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

/**
 * Export platform data (legacy endpoint)
 */
export const exportPlatformData = async (req, res) => {
  try {
    const { dataType = 'all' } = req.query;

    const data = {};

    if (dataType === 'all' || dataType === 'users') {
      data.users = await User.find().select('-password -sessions').lean();
    }
    if (dataType === 'all' || dataType === 'events') {
      data.events = await Event.find().lean();
    }
    if (dataType === 'all' || dataType === 'bookings') {
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

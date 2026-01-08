import User from "../models/User.js";
import Event from "../models/Event.js";
import EntryLog from "../models/EntryLog.js";
import Booking from "../models/Booking.js";
import bcrypt from "bcryptjs";

// Create/Invite staff member
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, eventIds, gates } = req.body;
    const staffAdminId = req.user._id;

    // Enforce event scoping: staff admin can only assign their own events
    const staffAdmin = await User.findById(staffAdminId);
    const allowedEvents = staffAdmin.assignedEvents || [];
    if (!allowedEvents.length) {
      return res.status(403).json({ message: "No events assigned to this staff admin" });
    }
    const filteredEvents = (eventIds || []).filter(id => allowedEvents.map(e => e.toString()).includes(id.toString()));
    if (!filteredEvents.length) {
      return res.status(400).json({ message: "Staff must be assigned at least one of your events" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || "staff123", salt);

    // Create new staff user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "staff",
      assignedEvents: filteredEvents,
      assignedGates: gates || [],
      assignedBy: staffAdminId,
      active: true,
    });

    await user.save();

    res.json({
      success: true,
      message: "Staff member created successfully",
      staff: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: user.assignedEvents,
        assignedGates: user.assignedGates,
      },
    });
  } catch (err) {
    console.error("Create staff error:", err);
    res.status(500).json({ message: err.message || "Failed to create staff" });
  }
};

// Get all staff members assigned to staff admin's events
export const getStaffMembers = async (req, res) => {
  try {
    const staffAdminId = req.user._id;

    // Get events assigned to this staff admin
    const staffAdmin = await User.findById(staffAdminId);
    if (!staffAdmin) {
      return res.status(404).json({ message: "Staff Admin not found" });
    }

    let assignedEventIds = staffAdmin.assignedEvents || [];
    
    // If no events assigned, get all events
    if (!assignedEventIds || assignedEventIds.length === 0) {
      const allEvents = await Event.find({}).select('_id');
      assignedEventIds = allEvents.map(e => e._id);
    }

    // Get all staff assigned to same events OR staff role users
    const staff = await User.find({
      role: { $in: ["staff", "staff_admin"] },
      $or: [
        { assignedEvents: { $in: assignedEventIds } },
        { assignedBy: staffAdminId },
        { role: "staff", assignedEvents: { $size: 0 } } // Staff with no events assigned yet
      ]
    }).select("_id name email role assignedEvents assignedGates createdAt active");

    res.json({ staff });
  } catch (err) {
    console.error("Get staff error:", err);
    res.status(500).json({ message: err.message || "Failed to get staff" });
  }
};

// Update staff member
export const updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, password, role, eventIds, gates, active } = req.body;

    // Enforce event scoping: staff admin can only assign their own events
    const staffAdminId = req.user._id;
    const staffAdmin = await User.findById(staffAdminId);
    if (!staffAdmin) {
      return res.status(404).json({ message: "Staff admin not found" });
    }

    const targetStaff = await User.findById(staffId);
    if (!targetStaff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const allowedEvents = staffAdmin.assignedEvents || [];
    if (!allowedEvents.length) {
      return res.status(403).json({ message: "No events assigned to this staff admin" });
    }

    const isSelf = staffId.toString() === staffAdminId.toString();
    let filteredEvents = targetStaff.assignedEvents || [];

    if (!isSelf) {
      filteredEvents = (eventIds || []).filter(id => allowedEvents.map(e => e.toString()).includes(id.toString()));
      if (!filteredEvents.length) {
        return res.status(400).json({ message: "Staff must be assigned at least one of your events" });
      }
    }

    const updateData = {
      name,
      email,
      assignedEvents: filteredEvents,
      assignedGates: gates || [],
    };

    if (role) {
      updateData.role = role;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    // If password is provided, hash it
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const staff = await User.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true }
    ).select("_id name email role assignedEvents assignedGates active");

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ success: true, staff });
  } catch (err) {
    console.error("Update staff error:", err);
    res.status(500).json({ message: err.message || "Failed to update staff" });
  }
};

// Delete/Deactivate staff member
export const deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await User.findByIdAndUpdate(
      staffId,
      { active: false },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ success: true, message: "Staff member deactivated" });
  } catch (err) {
    console.error("Delete staff error:", err);
    res.status(500).json({ message: err.message || "Failed to delete staff" });
  }
};

// Get entry stats for an event
export const getEntryStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const staffAdminId = req.user._id;

    // Check if event exists
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Staff admin must have event assigned to view logs
    const staffAdmin = await User.findById(staffAdminId);
    const assignedEventIds = staffAdmin.assignedEvents || [];

    if (!assignedEventIds || assignedEventIds.length === 0) {
      return res.status(403).json({ message: "No events assigned to this staff admin" });
    }

    const eventIdStr = eventId.toString();
    const hasAccess = assignedEventIds.some(id => id.toString() === eventIdStr);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this event" });
    }

    // Get bookings with scans (same approach as event admin for consistency)
    const bookings = await Booking.find({ 
      event: eventId,
      lastScannedAt: { $exists: true, $ne: null }
    })
      .populate('user', 'name email')
      .populate({
        path: 'scans.scannedBy',
        select: 'name email'
      })
      .sort({ lastScannedAt: -1 });

    // Transform to match frontend expectations - one entry per ticket scan
    const entries = [];
    bookings.forEach(booking => {
      if (booking.scans && booking.scans.length > 0) {
        booking.scans.forEach((scan, index) => {
          const scannedByStaff = scan.scannedBy;
          entries.push({
            _id: `${booking._id}-scan-${index}`,
            booking: {
              _id: booking._id,
              bookingId: booking.bookingId,
              user: booking.user ? {
                _id: booking.user._id,
                name: booking.user.name,
                email: booking.user.email
              } : null
            },
            scannedBy: {
              _id: scannedByStaff?._id,
              name: scannedByStaff?.name || 'Unknown',
              email: scannedByStaff?.email || ''
            },
            scannedAt: scan.scannedAt || booking.lastScannedAt,
            gate: 'Main Gate',
            ticketIndex: scan.ticketIndex || (index + 1),
            ticketId: scan.ticketId || null,
            approved: true,
            approvedAt: scan.scannedAt || booking.lastScannedAt
          });
        });
      }
    });
    
    // Sort by scan time descending
    entries.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

    const stats = {
      totalScanned: entries.length,
      valid: entries.filter((e) => e.approved).length,
      used: entries.length,
      cancelled: 0,
      invalid: 0,
      byGate: {},
      byStaff: {},
    };

    // Count by gate
    entries.forEach((entry) => {
      const gate = entry.gate || "Unknown";
      stats.byGate[gate] = (stats.byGate[gate] || 0) + 1;
    });

    // Count by staff
    entries.forEach((entry) => {
      const staffName = entry.scannedBy?.name || "Unknown";
      stats.byStaff[staffName] = (stats.byStaff[staffName] || 0) + 1;
    });

    res.json({ entries, stats });
  } catch (err) {
    console.error("Get entry stats error:", err);
    res.status(500).json({ message: err.message || "Failed to get entry stats" });
  }
};

// Approve/Reject entry (for manual approval)
export const approveEntry = async (req, res) => {
  try {
    const { logId } = req.params;
    const { approved, notes } = req.body;

    const log = await EntryLog.findByIdAndUpdate(
      logId,
      {
        ticketStatus: approved ? "valid" : "invalid",
        approvedAt: new Date(),
        approvedBy: req.user._id,
        notes,
      },
      { new: true }
    ).populate("booking staff");

    if (!log) {
      return res.status(404).json({ message: "Entry log not found" });
    }

    res.json({ success: true, log });
  } catch (err) {
    console.error("Approve entry error:", err);
    res.status(500).json({ message: err.message || "Failed to approve entry" });
  }
};

// Get dashboard stats for staff admin
export const getDashboardStats = async (req, res) => {
  try {
    const staffAdminId = req.user._id;

    // Get assigned events
    const staffAdmin = await User.findById(staffAdminId);
    let assignedEventIds = staffAdmin.assignedEvents || [];
    
    // If no events assigned, get all events (staff admin can manage all)
    let allEventsMode = false;
    if (!assignedEventIds || assignedEventIds.length === 0) {
      const allEvents = await Event.find({}).select('_id');
      assignedEventIds = allEvents.map(e => e._id);
      allEventsMode = true;
    }
    
    // Get event details
    const events = await Event.find({ _id: { $in: assignedEventIds } })
      .select('title date location venue totalTickets availableTickets')
      .sort({ date: 1 });
    
    const totalEvents = events.length;

    // Get total staff members (either assigned by this admin OR assigned to same events)
    const totalStaff = await User.countDocuments({
      role: "staff",
      $or: [
        { assignedBy: staffAdminId },
        { assignedEvents: { $in: assignedEventIds } }
      ]
    });

    // Get total entries scanned for assigned events
    const totalScanned = await EntryLog.countDocuments({
      event: { $in: assignedEventIds },
    });

    // Get today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayScanned = await EntryLog.countDocuments({
      event: { $in: assignedEventIds },
      scannedAt: { $gte: today },
    });

    res.json({
      stats: {
        totalEvents,
        totalStaff,
        totalScanned,
        todayScanned,
      },
      events,
      allEventsMode
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ message: err.message || "Failed to get stats" });
  }
};

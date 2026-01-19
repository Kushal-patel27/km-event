import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Recalculate aggregate inventory for events with ticket types
function recomputeTicketInventory(event) {
  if (!event.ticketTypes || event.ticketTypes.length === 0) {
    event.totalTickets = 0;
    event.availableTickets = 0;
    return;
  }

  let totalQty = 0;
  let totalAvail = 0;

  event.ticketTypes.forEach((t) => {
    const qty = Number(t.quantity) || 0;
    // Ensure available never exceeds quantity and is non-negative
    const avail = Math.max(0, Math.min(Number(t.available) || 0, qty));
    t.available = avail;
    totalQty += qty;
    totalAvail += avail;
  });

  event.totalTickets = totalQty;
  event.availableTickets = totalAvail;
}

/**
 * Get all events assigned to this event admin
 */
export const getAssignedEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all events where user is in assignedEvents
    const events = await Event.find({
      _id: { $in: req.user.assignedEvents }
    })
      .populate('organizer', 'name email')
      .populate('assignedStaff.user', 'name email role')
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching assigned events:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get single event details (if user has access)
 */
export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizer', 'name email')
      .populate('assignedStaff.user', 'name email role');

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching event details:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update event (only assigned event)
 */
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Prevent changing organizer or assigned staff via this endpoint
    delete updates.organizer;
    delete updates.assignedStaff;

    const event = await Event.findByIdAndUpdate(
      eventId,
      updates,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error('[EVENT ADMIN] Error updating event:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create ticket types for event
 */
export const createTicketType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, price, quantity, description } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.ticketTypes.push({
      name,
      price,
      quantity,
      available: quantity,
      description: description || ''
    });

    // Recompute aggregate totals
    recomputeTicketInventory(event);

    await event.save();

    res.json({ message: "Ticket type created successfully", event });
  } catch (error) {
    console.error('[EVENT ADMIN] Error creating ticket type:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update ticket type
 */
export const updateTicketType = async (req, res) => {
  try {
    const { eventId, ticketTypeId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ticketType = event.ticketTypes.id(ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({ message: "Ticket type not found" });
    }

    // Update ticket type fields
    if (updates.name) ticketType.name = updates.name;
    if (updates.price !== undefined) ticketType.price = updates.price;
    if (updates.description !== undefined) ticketType.description = updates.description;
    
    // If quantity changed, adjust available tickets
    if (updates.quantity !== undefined) {
      const diff = updates.quantity - ticketType.quantity;
      ticketType.quantity = updates.quantity;
      ticketType.available = Math.max(0, Math.min(ticketType.available + diff, ticketType.quantity));
    }

    // Ensure available not above quantity
    if (ticketType.available > ticketType.quantity) {
      ticketType.available = ticketType.quantity;
    }

    // Recompute aggregate totals
    recomputeTicketInventory(event);

    await event.save();

    res.json({ message: "Ticket type updated successfully", event });
  } catch (error) {
    console.error('[EVENT ADMIN] Error updating ticket type:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete ticket type
 */
export const deleteTicketType = async (req, res) => {
  try {
    const { eventId, ticketTypeId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.ticketTypes.pull(ticketTypeId);

    // Recompute aggregate totals after deletion
    recomputeTicketInventory(event);
    await event.save();

    res.json({ message: "Ticket type deleted successfully", event });
  } catch (error) {
    console.error('[EVENT ADMIN] Error deleting ticket type:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all bookings for assigned event
 */
export const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { event: eventId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('event', 'title date location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching bookings:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get booking statistics for event
 */
export const getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const totalBookings = await Booking.countDocuments({ event: eventId });
    const confirmedBookings = await Booking.countDocuments({ 
      event: eventId, 
      status: 'confirmed' 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      event: eventId, 
      status: 'cancelled' 
    });

    // Calculate revenue
    const bookings = await Booking.find({ 
      event: eventId, 
      status: 'confirmed' 
    });
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Get recent bookings
    const recentBookings = await Booking.find({ event: eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      event,
      stats: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        ticketsSold: event.totalTickets - event.availableTickets,
        ticketsAvailable: event.availableTickets
      },
      recentBookings
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching event stats:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Download attendee list (CSV export)
 */
export const downloadAttendeeList = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookings = await Booking.find({ 
      event: eventId,
      status: { $ne: 'cancelled' }
    })
      .populate('user', 'name email')
      .populate('event', 'title date');

    // Generate CSV
    let csv = 'Name,Email,Tickets,Booking Date,Status,QR Scanned\n';
    
    bookings.forEach(booking => {
      const name = booking.user?.name || 'N/A';
      const email = booking.user?.email || 'N/A';
      const tickets = booking.quantity || 1;
      const bookingDate = new Date(booking.createdAt).toLocaleDateString();
      const status = booking.status;
      const scanned = booking.lastScannedAt ? 'Yes' : 'No';
      
      csv += `"${name}","${email}",${tickets},${bookingDate},${status},${scanned}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendees-${eventId}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('[EVENT ADMIN] Error downloading attendee list:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Assign staff to event
 */
export const assignStaff = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, role = 'staff' } = req.body;

    if (!['staff', 'staff_admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'staff' or 'staff_admin'" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if staff already assigned
    const alreadyAssigned = event.assignedStaff.some(
      s => s.user.toString() === userId.toString()
    );

    if (alreadyAssigned) {
      return res.status(400).json({ message: "Staff member already assigned to this event" });
    }

    // Add to event's assignedStaff
    event.assignedStaff.push({
      user: userId,
      role: role,
      assignedAt: new Date()
    });
    await event.save();

    // Add event to user's assignedEvents if not already there
    if (!user.assignedEvents.includes(eventId)) {
      user.assignedEvents.push(eventId);
      await user.save();
    }

    const updatedEvent = await Event.findById(eventId)
      .populate('assignedStaff.user', 'name email role');

    res.json({ 
      message: "Staff assigned successfully", 
      event: updatedEvent 
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error assigning staff:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create or invite a staff member directly by Event Admin and assign to this event
export const createStaffForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, role = 'staff', gates = [], password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (!['staff', 'staff_admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'staff' or 'staff_admin'" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      user = new User({
        name,
        email,
        role,
        password: hashedPassword,
        assignedEvents: [eventId],
        assignedGates: role === 'staff' ? gates : [],
        active: true,
        assignedBy: req.user._id,
      });
    } else {
      // Ensure staff role is compatible and add this event
      user.name = name || user.name;
      user.role = role;
      if (!user.assignedEvents.includes(eventId)) {
        user.assignedEvents.push(eventId);
      }
      if (role === 'staff') {
        const mergedGates = new Set([...(user.assignedGates || []), ...gates]);
        user.assignedGates = Array.from(mergedGates);
      }
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      user.active = true;
      user.assignedBy = req.user._id;
    }

    await user.save();

    // Add to event assignedStaff if missing
    const alreadyAssigned = event.assignedStaff.some(s => s.user.toString() === user._id.toString());
    if (!alreadyAssigned) {
      event.assignedStaff.push({ user: user._id, role, assignedAt: new Date() });
      await event.save();
    }

    const populatedEvent = await Event.findById(eventId).populate('assignedStaff.user', 'name email role');

    res.json({
      message: 'Staff member created and assigned',
      staff: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: user.assignedEvents,
        assignedGates: user.assignedGates,
      },
      event: populatedEvent,
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error creating staff:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove staff from event
 */
export const removeStaff = async (req, res) => {
  try {
    const { eventId, staffId } = req.params;

    if (!staffId || staffId === 'undefined') {
      return res.status(400).json({ message: 'Missing staff id' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Remove from assignedStaff
    event.assignedStaff = event.assignedStaff.filter(
      s => s.user?.toString() !== staffId.toString()
    );
    await event.save();

    // Remove event from user's assignedEvents
    const user = await User.findById(staffId);
    if (user) {
      user.assignedEvents = user.assignedEvents.filter(
        e => e.toString() !== eventId.toString()
      );
      await user.save();
    }

    res.json({ message: "Staff removed successfully", event });
  } catch (error) {
    console.error('[EVENT ADMIN] Error removing staff:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Search for available staff members by email
 */
export const searchStaff = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email parameter is required" });
    }

    // Search for users with staff or staff_admin role
    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      role: { $in: ['staff', 'staff_admin'] },
      active: true
    })
      .select('_id name email role assignedEvents assignedGates')
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('[EVENT ADMIN] Error searching staff:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get entry logs (scanned tickets)
 */
export const getEntryLogs = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

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

    // Transform to ticket-wise entries (one entry per ticket scan)
    const allLogs = [];
    bookings.forEach(booking => {
      if (booking.scans && booking.scans.length > 0) {
        booking.scans.forEach((scan, index) => {
          const scannedByStaff = scan.scannedBy;
          allLogs.push({
            id: `${booking._id}-scan-${index}`,
            bookingId: booking.bookingId || booking._id.toString().slice(-8),
            userName: booking.user?.name,
            userEmail: booking.user?.email,
            ticketIndex: scan.ticketIndex || (index + 1),
            ticketId: scan.ticketId || null,
            numberOfTickets: booking.quantity || 1,
            scannedAt: scan.scannedAt || booking.lastScannedAt,
            scannedBy: scannedByStaff?.name || 'Unknown'
          });
        });
      }
    });

    // Sort by scan time descending
    allLogs.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

    const total = allLogs.length;
    const skip = (pageNum - 1) * limitNum;
    const logs = allLogs.slice(skip, skip + limitNum);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching entry logs:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get dashboard overview (quick stats for all assigned events)
 */
export const getDashboard = async (req, res) => {
  try {
    const assignedEventIds = req.user.assignedEvents;

    const totalEvents = assignedEventIds.length;
    const totalBookings = await Booking.countDocuments({ 
      event: { $in: assignedEventIds } 
    });
    const confirmedBookings = await Booking.countDocuments({ 
      event: { $in: assignedEventIds },
      status: 'confirmed'
    });

    // Calculate total revenue
    const bookings = await Booking.find({ 
      event: { $in: assignedEventIds },
      status: 'confirmed'
    });
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      _id: { $in: assignedEventIds },
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    })
      .sort({ date: 1 })
      .limit(5);

    // Recent bookings
    const recentBookings = await Booking.find({ 
      event: { $in: assignedEventIds } 
    })
      .populate('user', 'name email')
      .populate('event', 'title date')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalEvents,
        totalBookings,
        confirmedBookings,
        totalRevenue
      },
      upcomingEvents,
      recentBookings
    });
  } catch (error) {
    console.error('[EVENT ADMIN] Error fetching dashboard:', error);
    res.status(500).json({ message: error.message });
  }
};

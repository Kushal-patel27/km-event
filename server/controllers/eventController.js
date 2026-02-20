import Event from "../models/Event.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { ADMIN_ROLE_SET } from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    console.log('Creating event with data:', req.body);
    console.log('User ID:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Normalize and validate input so we don't create invalid documents
    const eventDate = req.body.date ? new Date(req.body.date) : null;
    const totalTickets = Number(req.body.totalTickets ?? req.body.capacity);
    const price = Number(req.body.price ?? 0);
    const availableTickets = Number(
      req.body.availableTickets ?? req.body.totalTickets ?? req.body.capacity
    );

    if (!eventDate || isNaN(eventDate)) {
      return res.status(400).json({ message: 'Invalid or missing event date' });
    }

    if (!Number.isFinite(totalTickets) || totalTickets < 1) {
      return res.status(400).json({ message: 'Total tickets must be at least 1' });
    }

    // Enforce plan limits for non-admin organizers
    if (!ADMIN_ROLE_SET.has(req.user.role)) {
      let plan = null;
      const subscription = await OrganizerSubscription.findOne({ organizer: req.user._id })
        .populate("plan");

      if (subscription?.plan) {
        plan = subscription.plan;
      } else {
        plan = await SubscriptionPlan.findOne({ name: "Free" });
      }

      if (plan?.eventLimit !== null && plan?.eventLimit !== undefined) {
        const totalEvents = await Event.countDocuments({ organizer: req.user._id });
        if (totalEvents >= plan.eventLimit) {
          return res.status(403).json({
            message: `Event limit reached (${plan.eventLimit}). Upgrade your plan to create more events.`
          });
        }
      }

      if (plan?.limits?.eventsPerMonth !== null && plan?.limits?.eventsPerMonth !== undefined) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthEvents = await Event.countDocuments({
          organizer: req.user._id,
          createdAt: { $gte: monthStart, $lt: monthEnd }
        });

        if (monthEvents >= plan.limits.eventsPerMonth) {
          return res.status(403).json({
            message: `Monthly event limit reached (${plan.limits.eventsPerMonth}). Upgrade your plan to create more events this month.`
          });
        }
      }

      const maxTickets = plan?.ticketLimit ?? plan?.limits?.attendeesPerEvent;
      if (maxTickets !== null && maxTickets !== undefined && totalTickets > maxTickets) {
        return res.status(400).json({
          message: `Ticket limit exceeded. Max allowed is ${maxTickets}.`
        });
      }
    }

    const payload = {
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      location: req.body.location?.trim(),
      image: req.body.image?.trim?.() || '',
      category: req.body.category || '',
      price: Number.isFinite(price) ? price : 0,
      date: eventDate,
      totalTickets,
      availableTickets: Number.isFinite(availableTickets)
        ? Math.max(0, availableTickets)
        : totalTickets,
      organizer: req.user._id,
    };

    const requiredMissing = ['title', 'description', 'location'].filter(
      key => !payload[key]
    );

    if (requiredMissing.length) {
      return res.status(400).json({ message: `Missing required fields: ${requiredMissing.join(', ')}` });
    }

    const event = await Event.create(payload);
    
    console.log('Event created successfully:', event._id);
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error.message);
    console.error('Error details:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to create event' });
  }
};

export const getEvents = async (req, res) => {
  try {
    // Super admin and staff can see all events
    // Event admin and staff admin assigned to events can only see their assigned events
    const user = req.user;
    let query = {};

    // If user is event_admin or staff_admin, filter by assignedEvents
    if (user && ['event_admin', 'staff_admin'].includes(user.role)) {
      if (!user.assignedEvents || user.assignedEvents.length === 0) {
        // No events assigned
        return res.json([]);
      }
      query._id = { $in: user.assignedEvents };
    }

    // Hide past events from regular users (show only upcoming events)
    // Admin, staff, event_admin, and staff_admin can see all events
    if (!user || user.role === 'user') {
      query.date = { $gte: new Date() }; // Only show events in the future
    }

    const events = await Event.find(query).populate("organizer", "name email");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );
    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Check authorization for event_admin/staff_admin
    if (req.user && ['event_admin', 'staff_admin'].includes(req.user.role)) {
      const isAssigned = req.user.assignedEvents && req.user.assignedEvents.some(id => String(id) === String(event._id));
      if (!isAssigned) {
        return res.status(403).json({ message: "Not authorized to view this event" });
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const user = req.user;
    
    // event_admin sees their assigned events
    if (user.role === 'event_admin') {
      if (!user.assignedEvents || user.assignedEvents.length === 0) {
        return res.json([]);
      }
      const events = await Event.find({ _id: { $in: user.assignedEvents } }).populate("organizer", "name email");
      return res.json(events);
    }

    // Default: get by organizer (original behavior for other users)
    const events = await Event.find({ organizer: user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isSuper = req.user?.role === 'super_admin';
    const isOwner = String(event.organizer) === String(req.user._id);
    // Only organizer or super admin can update (legacy "admin" also allowed)
    const isLegacyAdmin = req.user?.role === 'admin';
    if (!isOwner && !isSuper && !isLegacyAdmin) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    // Keep availableTickets in sync if totalTickets/capacity change without resetting sold seats
    const updates = { ...req.body };
    if (updates.capacity) updates.totalTickets = updates.capacity;

    if (updates.totalTickets) {
      const newTotal = Number(updates.totalTickets);
      if (Number.isFinite(newTotal) && newTotal > 0) {
        const delta = newTotal - event.totalTickets;
        const proposed = event.availableTickets + delta;
        // If client explicitly sends availableTickets, honor it but cap within bounds
        const clientAvailable = updates.availableTickets;
        const nextAvailable = clientAvailable !== undefined ? Number(clientAvailable) : proposed;
        updates.availableTickets = Math.max(0, Math.min(newTotal, Number.isFinite(nextAvailable) ? nextAvailable : proposed));
      }
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const isSuper = req.user?.role === 'super_admin';
    const isOwner = String(event.organizer) === String(req.user._id);
    const isLegacyAdmin = req.user?.role === 'admin';
    if (!isOwner && !isSuper && !isLegacyAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event' })
    }

    await Event.findByIdAndDelete(req.params.id)
    res.json({ message: 'Event deleted' })
  } catch (error) {
    console.error('Delete event error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

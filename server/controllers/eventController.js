import Event from "../models/Event.js";

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
    const events = await Event.find().populate("organizer", "name email");
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

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only organizer or admin can update
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
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

    // Organizer or admin can delete
    if (String(event.organizer) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' })
    }

    await Event.findByIdAndDelete(req.params.id)
    res.json({ message: 'Event deleted' })
  } catch (error) {
    console.error('Delete event error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

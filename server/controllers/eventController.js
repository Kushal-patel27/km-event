import Event from "../models/Event.js";

export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      availableTickets: req.body.totalTickets,
      organizer: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Keep availableTickets in sync if totalTickets/capacity change
    const updates = { ...req.body };
    if (updates.capacity) updates.totalTickets = updates.capacity;
    if (updates.totalTickets && !updates.availableTickets) {
      // If totalTickets changed, reset availableTickets unless provided
      updates.availableTickets = updates.totalTickets;
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

    await event.deleteOne()
    res.json({ message: 'Event deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

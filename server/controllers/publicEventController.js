import Event from '../models/Event.js';
import EventTemplate from '../models/EventTemplate.js';

const canManagePublicSharing = (user, event) => {
  if (!user || !event) return false;

  if (['super_admin', 'admin'].includes(user.role)) return true;
  if (String(event.organizer) === String(user._id)) return true;

  if (['event_admin', 'staff_admin'].includes(user.role) && Array.isArray(user.assignedEvents)) {
    return user.assignedEvents.some((assignedId) => String(assignedId) === String(event._id));
  }

  return false;
};

/**
 * @desc    Get public event by slug
 * @route   GET /api/events/public/:slug
 * @access  Public
 */
export const getPublicEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ slug, isPublic: true })
      .populate('organizer', 'name email')
      .populate('templateUsed', 'name category')
      .select('-assignedStaff -subscriptionPlan')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not publicly available'
      });
    }

    // Increment views (do this in background to not slow down response)
    Event.findByIdAndUpdate(
      event._id,
      { $inc: { views: 1 } },
      { new: false }
    ).exec();

    // Clean up sensitive data
    const publicEvent = {
      _id: event._id,
      title: event.title,
      slug: event.slug,
      shortCode: event.shortCode,
      description: event.description,
      date: event.date,
      location: event.location,
      locationDetails: event.locationDetails,
      mapLink: event.mapLink,
      image: event.image,
      category: event.category,
      status: event.status,
      views: event.views + 1, // Include incremented view count
      ticketTypes: event.ticketTypes,
      customBranding: event.customBranding,
      organizer: {
        name: event.organizer?.name || 'Event Organizer',
        email: event.organizer?.email
      },
      templateUsed: event.templateUsed,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    res.json({
      success: true,
      data: publicEvent
    });
  } catch (error) {
    console.error('Get public event by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

/**
 * @desc    Get public event by short code
 * @route   GET /api/events/code/:shortCode
 * @access  Public
 */
export const getPublicEventByCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const event = await Event.findOne({ 
      shortCode: shortCode.toUpperCase(), 
      isPublic: true 
    })
      .populate('organizer', 'name email')
      .populate('templateUsed', 'name category')
      .select('-assignedStaff -subscriptionPlan')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not publicly available'
      });
    }

    // Increment views
    Event.findByIdAndUpdate(
      event._id,
      { $inc: { views: 1 } },
      { new: false }
    ).exec();

    // Clean up sensitive data
    const publicEvent = {
      _id: event._id,
      title: event.title,
      slug: event.slug,
      shortCode: event.shortCode,
      description: event.description,
      date: event.date,
      location: event.location,
      locationDetails: event.locationDetails,
      mapLink: event.mapLink,
      image: event.image,
      category: event.category,
      status: event.status,
      views: event.views + 1,
      ticketTypes: event.ticketTypes,
      customBranding: event.customBranding,
      organizer: {
        name: event.organizer?.name || 'Event Organizer',
        email: event.organizer?.email
      },
      templateUsed: event.templateUsed,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    res.json({
      success: true,
      data: publicEvent
    });
  } catch (error) {
    console.error('Get public event by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

/**
 * @desc    Get all public events (for listing page)
 * @route   GET /api/events/public
 * @access  Public
 */
export const getAllPublicEvents = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      sort = '-createdAt', 
      page = 1, 
      limit = 12 
    } = req.query;

    // Build query
    const query = { isPublic: true, status: { $ne: 'cancelled' } };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name')
        .populate('templateUsed', 'name category')
        .select('-assignedStaff -subscriptionPlan')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: events.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: events
    });
  } catch (error) {
    console.error('Get all public events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

/**
 * @desc    Generate share links for an event
 * @route   GET /api/events/:id/share-links
 * @access  Private (Event owner)
 */
export const getEventShareLinks = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permission (owner/admin/super_admin/assigned event_admin or staff_admin)
    if (!canManagePublicSharing(req.user, event)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const shareLinks = {
      slug: event.slug ? `${baseUrl}/event/${event.slug}` : null,
      shortCode: event.shortCode ? `${baseUrl}/e/${event.shortCode}` : null,
      isPublic: event.isPublic
    };

    res.json({
      success: true,
      data: shareLinks
    });
  } catch (error) {
    console.error('Get share links error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share links',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle event public status
 * @route   PUT /api/events/:id/toggle-public
 * @access  Private (Event owner)
 */
export const toggleEventPublicStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permission (owner/admin/super_admin/assigned event_admin or staff_admin)
    if (!canManagePublicSharing(req.user, event)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Toggle public status
    event.isPublic = !event.isPublic;
    const updatedEvent = await event.save();

    // Re-fetch to get full populated data
    const populatedEvent = await Event.findById(updatedEvent._id)
      .populate('organizer', 'name email')
      .populate('templateUsed', 'name category');

    res.json({
      success: true,
      message: `Event is now ${updatedEvent.isPublic ? 'public' : 'private'}`,
      data: populatedEvent
    });
  } catch (error) {
    console.error('Toggle public status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event status',
      error: error.message
    });
  }
};

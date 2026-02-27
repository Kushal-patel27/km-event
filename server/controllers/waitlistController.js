import Waitlist from '../models/Waitlist.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import { sendNotificationEmail } from '../utils/emailService.js';

// Join waitlist
export const joinWaitlist = async (req, res) => {
  try {
    const { eventId, ticketType, quantity = 1 } = req.body;
    const userId = req.user.id;

    console.log('Join waitlist request:', { userId, eventId, ticketType, quantity });

    if (!eventId || !ticketType) {
      console.log('Missing required fields:', { eventId: !!eventId, ticketType: !!ticketType });
      return res.status(400).json({ 
        message: 'Missing required fields: eventId, ticketType',
        received: { eventId: eventId || 'missing', ticketType: ticketType || 'missing' }
      });
    }

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Event found:', { 
      eventId: event._id, 
      title: event.title,
      ticketTypes: event.ticketTypes?.map(t => t.name) || []
    });

    // Check if event has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot join waitlist for past events' });
    }

    // Validate ticket type exists
    const ticket = event.ticketTypes?.find(t => t.name === ticketType);
    if (!ticket) {
      console.log('Invalid ticket type:', { 
        requested: ticketType,
        available: event.ticketTypes?.map(t => t.name) || []
      });
      return res.status(400).json({ 
        message: 'Invalid ticket type',
        requestedTicketType: ticketType,
        availableTicketTypes: event.ticketTypes?.map(t => t.name) || []
      });
    }

    // Create waitlist entry
    const waitlistEntry = new Waitlist({
      user: userId,
      event: eventId,
      ticketType: ticketType,
      quantity: quantity,
      status: 'waiting',
      metadata: {
        source: req.body.source || 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await waitlistEntry.save();
    const position = waitlistEntry.position || 1;

    // Populate event details for response
    await waitlistEntry.populate({
      path: 'event',
      select: 'title date location image category price ticketTypes status'
    });

    // Send confirmation email asynchronously (non-blocking)
    Waitlist.findById(waitlistEntry._id)
      .populate('user', 'name email')
      .populate('event', 'title date location')
      .then(populatedEntry => {
        if (populatedEntry && populatedEntry.user && populatedEntry.event) {
          sendWaitlistConfirmationEmail({
            ...populatedEntry.toObject(),
            currentPosition: position
          }).catch(err => console.error('Email send error:', err));
        }
      })
      .catch(err => console.error('Populate error:', err));

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      waitlistEntry: {
        ...waitlistEntry.toObject(),
        currentPosition: position
      }
    });
  } catch (error) {
    console.error('Join waitlist error:', error.message || error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Failed to join waitlist', error: error.message });
  }
};

// Leave waitlist
export const leaveWaitlist = async (req, res) => {
  try {
    const { waitlistId } = req.params;
    const userId = req.user.id;

    const waitlistEntry = await Waitlist.findOne({
      _id: waitlistId,
      user: userId
    });

    if (!waitlistEntry) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    if (waitlistEntry.status === 'converted') {
      return res.status(400).json({ message: 'Cannot leave waitlist - already converted to booking' });
    }

    await Waitlist.findByIdAndDelete(waitlistId);

    res.json({ message: 'Successfully left waitlist' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ message: 'Failed to leave waitlist', error: error.message });
  }
};

// Get user's waitlist entries
export const getMyWaitlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const waitlistEntries = await Waitlist.find(query)
      .populate({
        path: 'event',
        select: 'title date location image category price ticketTypes status totalTickets availableTickets',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Filter out entries where event was deleted
    const validEntries = waitlistEntries.filter(entry => entry.event);

    // Get current position for each waiting entry
    const entriesWithPosition = await Promise.all(
      validEntries.map(async (entry) => {
        let currentPosition = null;
        if (entry.status === 'waiting' && entry.event) {
          currentPosition = await Waitlist.getUserPosition(
            userId,
            entry.event._id,
            entry.ticketType
          );
        }
        return {
          ...entry.toObject(),
          currentPosition
        };
      })
    );

    res.json({ 
      success: true,
      waitlist: entriesWithPosition,
      count: entriesWithPosition.length
    });
  } catch (error) {
    console.error('Get my waitlist error:', error);
    res.status(500).json({ message: 'Failed to get waitlist', error: error.message });
  }
};

// Get waitlist for specific event (for organizers/admins)
export const getEventWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketType, status = 'waiting' } = req.query;

    // Verify user has access to this event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is admin or event creator
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isCreator = event.createdBy && event.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = {
      event: eventId,
      status: status
    };

    if (ticketType) {
      query.ticketType = ticketType;
    }

    const waitlistEntries = await Waitlist.find(query)
      .populate('user', 'name email phone')
      .sort({ priority: -1, position: 1, createdAt: 1 });

    // Group by ticket type
    const groupedByTicketType = waitlistEntries.reduce((acc, entry) => {
      if (!acc[entry.ticketType]) {
        acc[entry.ticketType] = [];
      }
      acc[entry.ticketType].push(entry);
      return acc;
    }, {});

    res.json({
      waitlist: waitlistEntries,
      groupedByTicketType,
      totalCount: waitlistEntries.length
    });
  } catch (error) {
    console.error('Get event waitlist error:', error);
    res.status(500).json({ message: 'Failed to get event waitlist', error: error.message });
  }
};

// Notify next in line (triggered when tickets become available)
export const notifyNextInLine = async (eventId, ticketType, availableQuantity) => {
  try {
    // Cleanup expired notifications first
    await Waitlist.cleanupExpired();

    // Get next people in line
    const nextInLine = await Waitlist.getNextInLine(eventId, ticketType, availableQuantity);

    if (nextInLine.length === 0) {
      return { notified: 0 };
    }

    // Mark them as notified and send emails
    const notified = [];
    for (const entry of nextInLine) {
      await entry.markAsNotified();
      
      // Populate event details
      const populatedEntry = await Waitlist.findById(entry._id)
        .populate('event', 'title date location images')
        .populate('user', 'name email');

      await sendWaitlistAvailabilityEmail(populatedEntry);
      notified.push(entry);
    }

    return { notified: notified.length, entries: notified };
  } catch (error) {
    console.error('Notify next in line error:', error);
    throw error;
  }
};

// Manual notification trigger (for admins)
export const triggerNotification = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketType, quantity = 1 } = req.body;

    const result = await notifyNextInLine(eventId, ticketType, quantity);

    res.json({
      message: `Notified ${result.notified} people from waitlist`,
      ...result
    });
  } catch (error) {
    console.error('Trigger notification error:', error);
    res.status(500).json({ message: 'Failed to notify waitlist', error: error.message });
  }
};

// Get waitlist analytics (for admins/organizers)
export const getWaitlistAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify access
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isCreator = event.createdBy && event.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get analytics
    const totalWaiting = await Waitlist.countDocuments({ event: eventId, status: 'waiting' });
    const totalNotified = await Waitlist.countDocuments({ event: eventId, status: 'notified' });
    const totalConverted = await Waitlist.countDocuments({ event: eventId, status: 'converted' });
    const totalExpired = await Waitlist.countDocuments({ event: eventId, status: 'expired' });

    // Conversion rate
    const conversionRate = totalNotified > 0 
      ? ((totalConverted / totalNotified) * 100).toFixed(2) 
      : 0;

    // By ticket type
    const byTicketType = await Waitlist.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: { ticketType: '$ticketType', status: '$status' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.ticketType',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    // Recent activity
    const recentActivity = await Waitlist.find({ event: eventId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('ticketType status createdAt notifiedAt');

    res.json({
      summary: {
        totalWaiting,
        totalNotified,
        totalConverted,
        totalExpired,
        conversionRate: `${conversionRate}%`
      },
      byTicketType,
      recentActivity
    });
  } catch (error) {
    console.error('Get waitlist analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
};

// Cleanup expired notifications (can be run via cron job)
export const cleanupExpired = async (req, res) => {
  try {
    const count = await Waitlist.cleanupExpired();
    res.json({ message: `Cleaned up ${count} expired notifications` });
  } catch (error) {
    console.error('Cleanup expired error:', error);
    res.status(500).json({ message: 'Failed to cleanup', error: error.message });
  }
};

// Helper functions for sending emails
async function sendWaitlistConfirmationEmail(waitlistEntry) {
  try {
    const { user, event, ticketType, currentPosition } = waitlistEntry;
    
    await sendNotificationEmail({
      to: user.email,
      subject: `Waitlist Confirmation - ${event.title}`,
      title: "You're on the Waitlist!",
      recipientName: user.name,
      htmlContent: `
        <p>You have successfully joined the waitlist for <strong>${event.title}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Ticket Type:</strong> ${ticketType}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>

        <p>We'll notify you via email as soon as tickets become available. You'll have 48 hours to complete your booking.</p>
        
        <p>Thank you for your interest!</p>
      `,
      messageType: 'waitlist'
    });
  } catch (error) {
    console.error('Failed to send waitlist confirmation email:', error);
  }
}

async function sendWaitlistAvailabilityEmail(waitlistEntry) {
  try {
    const { user, event, ticketType, quantity, expiresAt } = waitlistEntry;
    
    const bookingLink = `${process.env.FRONTEND_URL}/events/${event._id}?waitlist=${waitlistEntry._id}`;
    
    await sendNotificationEmail({
      to: user.email,
      subject: `🎉 Tickets Available - ${event.title}`,
      title: 'Great News! Tickets Are Now Available!',
      recipientName: user.name,
      htmlContent: `
        <p>Tickets for <strong>${event.title}</strong> are now available!</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Ticket Type:</strong> ${ticketType}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>⏰ IMPORTANT:</strong> You have until <strong>${new Date(expiresAt).toLocaleString()}</strong> to complete your booking.</p>
          <p>After this time, your spot will be offered to the next person on the waitlist.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingLink}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Book Your Tickets Now
          </a>
        </div>
        
        <p>Don't miss out on this opportunity!</p>
      `,
      messageType: 'waitlist'
    });
  } catch (error) {
    console.error('Failed to send waitlist availability email:', error);
  }
}

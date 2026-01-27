import EventRequest from '../models/EventRequest.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import FeatureToggle from '../models/FeatureToggle.js'
import Event from '../models/Event.js'
import User from '../models/User.js'
import { ensureEmailConfigured, sendEventApprovalEmail, sendEventRejectionEmail } from '../utils/emailService.js'

// Organizer: Create event request
export const createEventRequest = async (req, res) => {
  try {
    const { 
      title, description, category, date, location, locationDetails, 
      totalTickets, availableTickets, price, ticketTypes, 
      planSelected, billingCycle, image, 
      organizerPhone, organizerCompany 
    } = req.body
    const user = req.user

    // Validate user authentication
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Validate date
    const parsedDate = date ? new Date(date) : null
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' })
    }

    // Validate ticket counts
    const totalTicketsNum = Number(totalTickets)
    if (!Number.isInteger(totalTicketsNum) || totalTicketsNum < 1) {
      return res.status(400).json({ message: 'Total tickets must be a positive integer' })
    }

    let availableTicketsNum = (availableTickets === undefined || availableTickets === '' || availableTickets === null)
      ? totalTicketsNum
      : Number(availableTickets)

    if (!Number.isInteger(availableTicketsNum) || availableTicketsNum < 0) {
      return res.status(400).json({ message: 'Available tickets must be a non-negative integer' })
    }

    if (availableTicketsNum > totalTicketsNum) {
      availableTicketsNum = totalTicketsNum
    }

    // Normalize ticket types (optional)
    const normalizedTicketTypes = Array.isArray(ticketTypes)
      ? ticketTypes
          .map(t => ({
            name: t.name,
            price: Number(t.price) || 0,
            quantity: Number(t.quantity) || 0,
            available: Number(t.available ?? t.quantity ?? 0),
            description: t.description || ''
          }))
          .filter(t => t.name && Number.isInteger(t.quantity) && t.quantity > 0)
          .map(t => ({
            ...t,
            available: Math.min(t.available, t.quantity)
          }))
      : []


    // Validate category
    const allowedCategories = ['Music','Sports','Comedy','Arts','Culture','Travel','Festival','Workshop','Conference','Other']
    const normalizedCategory = allowedCategories.includes(category) ? category : 'Other'

    // Validate subscription plan
    const subscriptionPlan = await SubscriptionPlan.findOne({ 
      name: planSelected, 
      isActive: true 
    })

    if (!subscriptionPlan) {
      return res.status(400).json({ 
        message: `Invalid subscription plan: ${planSelected}` 
      })
    }

    // Check if organizer already has a pending request for this event
    const existingRequest = await EventRequest.findOne({
      organizerId: user._id || user.id,
      title: title.trim(),
      date: parsedDate,
      status: 'PENDING'
    })

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this event. Please wait for approval.' 
      })
    }

    // Auto-populate requested features based on plan
    const requestedFeatures = {
      ticketing: subscriptionPlan.features.ticketing.enabled,
      qrCheckIn: subscriptionPlan.features.qrCheckIn.enabled,
      scannerApp: subscriptionPlan.features.scannerApp.enabled,
      analytics: subscriptionPlan.features.analytics.enabled,
      emailSms: subscriptionPlan.features.emailSms.enabled,
      payments: subscriptionPlan.features.payments.enabled,
      weatherAlerts: subscriptionPlan.features.weatherAlerts.enabled,
      subAdmins: subscriptionPlan.features.subAdmins.enabled,
      reports: subscriptionPlan.features.reports.enabled
    }

    const eventRequest = new EventRequest({
      organizerId: user._id || user.id,
      organizerName: user.name,
      organizerEmail: user.email,
      organizerPhone: organizerPhone || '',
      organizerCompany: organizerCompany || '',
      title,
      description,
      category: normalizedCategory,
      date: parsedDate,
      location,
      locationDetails: locationDetails || '',
      totalTickets: totalTicketsNum,
      availableTickets: availableTicketsNum,
      price: Number(price) || 0,
      ticketTypes: normalizedTicketTypes,
      subscriptionPlan: subscriptionPlan._id,
      planSelected,
      billingCycle: billingCycle || 'monthly',
      requestedFeatures,
      image: image || '',
      status: 'PENDING'
    })

    const savedRequest = await eventRequest.save()
    
    // Populate the plan details for response
    await savedRequest.populate('subscriptionPlan')

    res.status(201).json({
      success: true,
      message: 'Event request submitted successfully. Awaiting super admin approval.',
      eventRequest: savedRequest
    })
  } catch (err) {
    console.error('createEventRequest error:', err)
    res.status(500).json({ 
      success: false,
      message: 'Error creating event request',
      error: err.message 
    })
  }
}

// Super Admin: Get all pending event requests
export const getPendingEventRequests = async (req, res) => {
  try {
    const requests = await EventRequest.find({ status: 'PENDING' })
      .populate('organizerId', 'name email')
      .populate('subscriptionPlan')
      .sort({ createdAt: -1 })
    res.json({
      success: true,
      requests
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching pending requests',
      error: err.message 
    })
  }
}

// Super Admin: Get all event requests (with filter)
export const getAllEventRequests = async (req, res) => {
  try {
    const { status } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const filter = status ? { status } : {}

    const skip = (page - 1) * limit

    const [requests, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      EventRequest.find(filter)
        .select('title description category date location totalTickets price planSelected status rejectReason organizerName organizerEmail requestedFeatures createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventRequest.countDocuments(filter),
      EventRequest.countDocuments({ status: 'PENDING' }),
      EventRequest.countDocuments({ status: 'APPROVED' }),
      EventRequest.countDocuments({ status: 'REJECTED' })
    ])

    res.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      counts: {
        PENDING: pendingCount,
        APPROVED: approvedCount,
        REJECTED: rejectedCount
      }
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching event requests',
      error: err.message 
    })
  }
}

// Super Admin: Approve event request with feature override
export const approveEventRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { featureOverrides, adminNotes } = req.body
    const user = req.user

    // Fail fast if mailer is not configured
    ensureEmailConfigured()

    const eventRequest = await EventRequest.findById(id).populate('subscriptionPlan')
    if (!eventRequest) {
      return res.status(404).json({ 
        success: false,
        message: 'Event request not found' 
      })
    }

    if (eventRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot approve request with status: ${eventRequest.status}` 
      })
    }

    // Determine final features (use overrides if provided, otherwise use requested features)
    const approvedFeatures = featureOverrides || eventRequest.requestedFeatures

    // Create the event in the system
    const newEvent = new Event({
      title: eventRequest.title,
      description: eventRequest.description,
      category: eventRequest.category,
      date: eventRequest.date,
      location: eventRequest.location,
      locationDetails: eventRequest.locationDetails || '',
      price: eventRequest.price || 0,
      totalTickets: eventRequest.totalTickets,
      availableTickets: eventRequest.availableTickets,
      image: eventRequest.image || '',
      ticketTypes: eventRequest.ticketTypes && eventRequest.ticketTypes.length > 0 
        ? eventRequest.ticketTypes.map(t => ({
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            available: t.available || t.quantity,
            description: t.description || ''
          }))
        : [],
      organizer: eventRequest.organizerId,
      status: 'scheduled'
    })

    const savedEvent = await newEvent.save()

    // Grant event admin access to the organizer
    const organizer = await User.findById(eventRequest.organizerId)
    if (organizer) {
      // Upgrade user to event_admin if they're not already an admin
      if (!['super_admin', 'admin', 'event_admin'].includes(organizer.role)) {
        organizer.role = 'event_admin'
      }
      
      // Add this event to their assignedEvents
      if (!organizer.assignedEvents) {
        organizer.assignedEvents = []
      }
      if (!organizer.assignedEvents.some(id => id.toString() === savedEvent._id.toString())) {
        organizer.assignedEvents.push(savedEvent._id)
      }
      
      await organizer.save()
    }

    // Create feature toggles based on approved features
    const featureToggle = new FeatureToggle({
      eventId: savedEvent._id,
      toggledBy: user._id || user.id,
      features: {
        ticketing: { 
          enabled: approvedFeatures.ticketing,
          description: 'Allow ticket sales and management' 
        },
        qrCheckIn: { 
          enabled: approvedFeatures.qrCheckIn,
          description: 'QR code generation for check-in' 
        },
        scannerApp: { 
          enabled: approvedFeatures.scannerApp,
          description: 'Mobile scanner app for entry verification' 
        },
        analytics: { 
          enabled: approvedFeatures.analytics,
          description: 'Event analytics and reporting' 
        },
        emailSms: { 
          enabled: approvedFeatures.emailSms,
          description: 'Email and SMS notifications' 
        },
        payments: { 
          enabled: approvedFeatures.payments,
          description: 'Payment processing and wallet integration' 
        },
        weatherAlerts: { 
          enabled: approvedFeatures.weatherAlerts,
          description: 'Weather alerts and notifications' 
        },
        subAdmins: { 
          enabled: approvedFeatures.subAdmins,
          description: 'Add and manage sub-administrators' 
        },
        reports: { 
          enabled: approvedFeatures.reports,
          description: 'Generate detailed event reports' 
        }
      }
    })

    await featureToggle.save()
    console.log('FeatureToggle created:', featureToggle)

    // Update event request status and link created event
    eventRequest.status = 'APPROVED'
    eventRequest.approvedBy = user._id || user.id
    eventRequest.approvedAt = new Date()
    eventRequest.approvedFeatures = approvedFeatures
    eventRequest.eventId = savedEvent._id
    if (adminNotes) {
      eventRequest.adminNotes = adminNotes
    }
    await eventRequest.save()

    // Send approval email
    const emailSent = await sendEventApprovalEmail({
      recipientEmail: eventRequest.organizerEmail,
      organizerName: eventRequest.organizerName,
      eventTitle: eventRequest.title,
      eventDate: eventRequest.date,
      planSelected: eventRequest.planSelected
    })

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Event approved, but failed to send approval email. Please verify email configuration.',
        event: savedEvent,
        featureToggle,
        eventRequest
      })
    }

    res.json({
      success: true,
      message: 'Event approved successfully and confirmation email sent',
      event: savedEvent,
      featureToggle,
      eventRequest
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error approving event request',
      error: err.message 
    })
  }
}

// Super Admin: Reject event request
export const rejectEventRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { rejectReason } = req.body

    const eventRequest = await EventRequest.findById(id)
    if (!eventRequest) {
      return res.status(404).json({ 
        success: false,
        message: 'Event request not found' 
      })
    }

    if (eventRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot reject request with status: ${eventRequest.status}` 
      })
    }

    eventRequest.status = 'REJECTED'
    eventRequest.rejectReason = rejectReason || 'Your event request does not meet our guidelines.'
    await eventRequest.save()

    // Send rejection email
    await sendEventRejectionEmail({
      recipientEmail: eventRequest.organizerEmail,
      organizerName: eventRequest.organizerName,
      eventTitle: eventRequest.title,
      rejectReason: eventRequest.rejectReason
    })

    res.json({
      success: true,
      message: 'Event request rejected and notification email sent',
      eventRequest
    })
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error rejecting event request',
      error: err.message 
    })
  }
}

// Super Admin: Update feature toggles for an event
export const updateFeatureToggles = async (req, res) => {
  try {
    const { eventId: idParam } = req.params
    const { features } = req.body
    const user = req.user

    // Resolve to actual event ID (supports both Event and EventRequest ids)
    let resolvedEventId = null
    const directEvent = await Event.findById(idParam)
    if (directEvent) {
      resolvedEventId = directEvent._id
    } else {
      const eventRequest = await EventRequest.findById(idParam)
      if (eventRequest?.eventId) {
        resolvedEventId = eventRequest.eventId
      }
    }

    if (!resolvedEventId) {
      return res.status(404).json({ success: false, message: 'Event not found for feature update' })
    }

    if (!features || typeof features !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid features data'
      })
    }

    let featureToggle = await FeatureToggle.findOne({ eventId: resolvedEventId })

    if (!featureToggle) {
      featureToggle = new FeatureToggle({
        eventId: resolvedEventId,
        toggledBy: user._id || user.id,
        features
      })
    } else {
      // Update features while preserving descriptions
      Object.keys(features).forEach(key => {
        if (featureToggle.features[key]) {
          featureToggle.features[key].enabled = features[key].enabled || false
          // Keep existing description if not provided
          if (features[key].description) {
            featureToggle.features[key].description = features[key].description
          }
        } else {
          featureToggle.features[key] = features[key]
        }
      })
      featureToggle.toggledBy = user._id || user.id
      featureToggle.updatedAt = new Date()
    }

    const saved = await featureToggle.save()
    console.log('Features updated:', saved)
    
    res.json({
      success: true,
      message: 'Features updated successfully',
      features: saved.features
    })
  } catch (err) {
    console.error('updateFeatureToggles error:', err)
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

// Get feature toggles for an event
export const getFeatureToggles = async (req, res) => {
  try {
    const { eventId: idParam } = req.params

    // Resolve to actual event ID (supports both Event and EventRequest ids)
    let resolvedEventId = null
    let eventDetails = null

    const event = await Event.findById(idParam)
    if (event) {
      resolvedEventId = event._id
      eventDetails = { title: event.title }
    } else {
      const eventRequest = await EventRequest.findById(idParam)
      if (eventRequest?.eventId) {
        resolvedEventId = eventRequest.eventId
      }
      if (eventRequest) {
        eventDetails = { title: eventRequest.title }
      }
    }

    if (!resolvedEventId) {
      return res.status(404).json({ success: false, message: 'Event not found for features' })
    }

    // Try to find the FeatureToggle by resolved eventId
    let featureToggle = await FeatureToggle.findOne({ eventId: resolvedEventId })

    // If still not found, create a default one for this event
    if (!featureToggle) {
      // Create default features structure
      const defaultFeatures = {
        ticketing: { enabled: true, description: 'Allow ticket sales and management' },
        qrCheckIn: { enabled: false, description: 'QR code generation for check-in' },
        scannerApp: { enabled: false, description: 'Mobile scanner app for entry verification' },
        analytics: { enabled: false, description: 'Event analytics and reporting' },
        emailSms: { enabled: false, description: 'Email and SMS notifications' },
        payments: { enabled: true, description: 'Payment processing and wallet integration' },
        weatherAlerts: { enabled: false, description: 'Weather alerts and notifications' },
        subAdmins: { enabled: false, description: 'Add and manage sub-administrators' },
        reports: { enabled: false, description: 'Generate detailed event reports' }
      }

      featureToggle = new FeatureToggle({
        eventId: resolvedEventId,
        toggledBy: req.user?._id || req.user?.id,
        features: defaultFeatures
      })
      await featureToggle.save()
    }

    res.json({
      success: true,
      eventId: resolvedEventId,
      eventTitle: eventDetails?.title || 'Unknown Event',
      features: featureToggle.features
    })
  } catch (err) {
    console.error('getFeatureToggles error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Event Admin/Organizer: Get only enabled features for their event
export const getEnabledFeatures = async (req, res) => {
  try {
    const { eventId } = req.params
    const user = req.user

    // Check if user has access to this event (event_admin or organizer of an approved event)
    if (user.role === 'event_admin') {
      // Verify user has access to this event
      const hasAccess = user.assignedEvents && user.assignedEvents.some(id => id.toString() === eventId.toString())
      if (!hasAccess) {
        return res.status(403).json({ message: 'You do not have access to this event' })
      }
    }

    const featureToggle = await FeatureToggle.findOne({ eventId })
    if (!featureToggle) {
      // Return empty features if none configured yet
      return res.json({
        success: true,
        eventId,
        enabledFeatures: {}
      })
    }

    // Filter only enabled features
    const enabledFeatures = {}
    Object.keys(featureToggle.features).forEach(key => {
      if (featureToggle.features[key].enabled) {
        enabledFeatures[key] = featureToggle.features[key]
      }
    })

    res.json({
      success: true,
      eventId,
      enabledFeatures
    })
  } catch (err) {
    console.error('getEnabledFeatures error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Organizer: Get their own event requests
export const getMyEventRequests = async (req, res) => {
  try {
    const organizerId = req.user._id || req.user.id

    if (!organizerId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    console.log(`[EVENT REQUESTS] Fetching requests for user: ${organizerId}`)

    // Use lean() for read-only data to improve performance
    const requests = await EventRequest.find({ organizerId })
      .lean()
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 requests
    
    console.log(`[EVENT REQUESTS] Found ${requests.length} requests for user ${organizerId}`)
    
    res.json({
      requests
    })
  } catch (err) {
    console.error('[EVENT REQUESTS] Error:', err)
    res.status(500).json({ message: err.message })
  }
}

import FeatureToggle from '../models/FeatureToggle.js'
import Event from '../models/Event.js'

/**
 * Middleware to check if a specific feature is enabled for an event
 * Usage: checkFeature('ticketing')
 */
export const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const { eventId } = req.params
      const user = req.user

      if (!eventId) {
        return res.status(400).json({ 
          message: 'Event ID is required',
          feature: featureName,
          access: false
        })
      }

      // Super admins bypass all feature checks
      if (user.role === 'super_admin') {
        req.featureEnabled = true
        return next()
      }

      // Verify user has access to this event
      const event = await Event.findById(eventId)
      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }

      // Check if user is the organizer or assigned to this event
      const isOrganizer = event.organizer.toString() === (user._id || user.id).toString()
      const isAssigned = user.assignedEvents && user.assignedEvents.some(
        id => id.toString() === eventId.toString()
      )

      if (!isOrganizer && !isAssigned && user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'You do not have access to this event',
          access: false
        })
      }

      // Check feature toggle
      const featureToggle = await FeatureToggle.findOne({ eventId })
      
      if (!featureToggle) {
        return res.status(403).json({ 
          message: 'Feature configuration not found for this event',
          feature: featureName,
          access: false
        })
      }

      const feature = featureToggle.features[featureName]
      
      if (!feature || !feature.enabled) {
        return res.status(403).json({ 
          message: `The feature '${featureName}' is not enabled for this event. Please upgrade your plan or contact support.`,
          feature: featureName,
          access: false
        })
      }

      req.featureEnabled = true
      req.featureToggle = featureToggle
      next()
    } catch (err) {
      res.status(500).json({ 
        message: 'Error checking feature access',
        error: err.message 
      })
    }
  }
}

/**
 * Middleware to check multiple features (at least one must be enabled)
 * Usage: checkAnyFeature(['ticketing', 'qrCheckIn'])
 */
export const checkAnyFeature = (featureNames) => {
  return async (req, res, next) => {
    try {
      const { eventId } = req.params
      const user = req.user

      if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' })
      }

      // Super admins bypass all feature checks
      if (user.role === 'super_admin') {
        req.featureEnabled = true
        return next()
      }

      const featureToggle = await FeatureToggle.findOne({ eventId })
      
      if (!featureToggle) {
        return res.status(403).json({ 
          message: 'Feature configuration not found',
          access: false
        })
      }

      const hasAnyFeature = featureNames.some(name => {
        const feature = featureToggle.features[name]
        return feature && feature.enabled
      })

      if (!hasAnyFeature) {
        return res.status(403).json({ 
          message: `None of the required features are enabled for this event: ${featureNames.join(', ')}`,
          features: featureNames,
          access: false
        })
      }

      req.featureEnabled = true
      req.featureToggle = featureToggle
      next()
    } catch (err) {
      res.status(500).json({ 
        message: 'Error checking feature access',
        error: err.message 
      })
    }
  }
}

/**
 * Middleware to check all specified features are enabled
 * Usage: checkAllFeatures(['ticketing', 'payments'])
 */
export const checkAllFeatures = (featureNames) => {
  return async (req, res, next) => {
    try {
      const { eventId } = req.params
      const user = req.user

      if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' })
      }

      // Super admins bypass all feature checks
      if (user.role === 'super_admin') {
        req.featureEnabled = true
        return next()
      }

      const featureToggle = await FeatureToggle.findOne({ eventId })
      
      if (!featureToggle) {
        return res.status(403).json({ 
          message: 'Feature configuration not found',
          access: false
        })
      }

      const disabledFeatures = featureNames.filter(name => {
        const feature = featureToggle.features[name]
        return !feature || !feature.enabled
      })

      if (disabledFeatures.length > 0) {
        return res.status(403).json({ 
          message: `The following features are not enabled: ${disabledFeatures.join(', ')}`,
          disabledFeatures,
          access: false
        })
      }

      req.featureEnabled = true
      req.featureToggle = featureToggle
      next()
    } catch (err) {
      res.status(500).json({ 
        message: 'Error checking feature access',
        error: err.message 
      })
    }
  }
}

/**
 * Middleware to get all enabled features for an event (doesn't block request)
 * Usage: getEnabledFeatures
 */
export const attachEnabledFeatures = async (req, res, next) => {
  try {
    const { eventId } = req.params

    if (!eventId) {
      return next()
    }

    const featureToggle = await FeatureToggle.findOne({ eventId })
    
    if (featureToggle) {
      const enabledFeatures = {}
      Object.keys(featureToggle.features).forEach(key => {
        if (featureToggle.features[key].enabled) {
          enabledFeatures[key] = true
        }
      })
      req.enabledFeatures = enabledFeatures
    }

    next()
  } catch (err) {
    // Don't block the request on error, just continue without features
    next()
  }
}

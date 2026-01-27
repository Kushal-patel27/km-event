import SystemConfig from "../models/SystemConfig.js";

/**
 * Middleware to check if weather alerts feature is enabled
 */
export const checkWeatherAlertsEnabled = async (req, res, next) => {
  try {
    const config = await SystemConfig.findById("system_config");

    if (!config || !config.weatherAlerts?.enabled) {
      return res.status(403).json({
        success: false,
        message: "Weather alerts feature is disabled by Super Admin",
        featureDisabled: true,
      });
    }

    // Attach config to request for later use
    req.weatherAlertsConfig = config.weatherAlerts;
    next();
  } catch (error) {
    console.error("Error checking weather alerts feature:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify feature access",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user has permission to access weather alerts
 */
export const checkWeatherAlertsPermission = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const config = await SystemConfig.findById("system_config");

    if (!config || !config.weatherAlerts?.enabled) {
      return res.status(403).json({
        success: false,
        message: "Weather alerts feature is disabled",
        featureDisabled: true,
      });
    }

    const allowedRoles = config.weatherAlerts.allowedRoles || ["super_admin"];

    // Super admin always has access
    if (user.role === "super_admin") {
      req.weatherAlertsConfig = config.weatherAlerts;
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access weather alerts",
        requiredRoles: allowedRoles,
      });
    }

    req.weatherAlertsConfig = config.weatherAlerts;
    next();
  } catch (error) {
    console.error("Error checking weather alerts permission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify permissions",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user can manage weather config for an event
 */
export const checkEventWeatherAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const { eventId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Super admin can access all events
    if (user.role === "super_admin") {
      return next();
    }

    // Event admin can only access their assigned events
    if (user.role === "event_admin") {
      const Event = (await import("../models/Event.js")).default;
      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if user is the organizer or assigned to this event
      if (
        event.organizer?.toString() === user._id.toString() ||
        user.assignedEvents?.some((e) => e.toString() === eventId)
      ) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "You don't have access to this event's weather settings",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  } catch (error) {
    console.error("Error checking event weather access:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify event access",
      error: error.message,
    });
  }
};

/**
 * Check if approval is required for automation actions
 */
export const checkAutomationApproval = async (req, res, next) => {
  try {
    const config = await SystemConfig.findById("system_config");

    req.requiresApproval = config?.weatherAlerts?.requireApproval ?? true;
    next();
  } catch (error) {
    console.error("Error checking automation approval:", error);
    req.requiresApproval = true; // Default to requiring approval
    next();
  }
};

export default {
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  checkAutomationApproval,
};

/**
 * Super Admin Weather Alert System Controller
 * System-wide weather alert configuration and management
 */
import SystemConfig from "../models/SystemConfig.js";
import WeatherAlertConfig from "../models/WeatherAlertConfig.js";
import WeatherAlertLog from "../models/WeatherAlertLog.js";
import Event from "../models/Event.js";

/**
 * Get system-wide weather alerts configuration
 */
export const getSystemWeatherConfig = async (req, res) => {
  try {
    const config = await SystemConfig.findById("system_config");

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "System configuration not found",
      });
    }

    res.json({
      success: true,
      config: config.weatherAlerts || {
        enabled: false,
        autoPolling: true,
        pollingInterval: 60,
        allowedRoles: ["super_admin"],
        requireApproval: true,
      },
    });
  } catch (error) {
    console.error("Error fetching system weather config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
      error: error.message,
    });
  }
};

/**
 * Update system-wide weather alerts configuration
 */
export const updateSystemWeatherConfig = async (req, res) => {
  try {
    const { enabled, autoPolling, pollingInterval, allowedRoles, requireApproval } = req.body;

    let config = await SystemConfig.findById("system_config");

    if (!config) {
      // Create default system config
      config = new SystemConfig({
        _id: "system_config",
        weatherAlerts: {
          enabled: false,
          autoPolling: true,
          pollingInterval: 60,
          allowedRoles: ["super_admin"],
          requireApproval: true,
        },
      });
    }

    // Update weather alerts config
    if (enabled !== undefined) {
      config.weatherAlerts.enabled = enabled;
    }

    if (autoPolling !== undefined) {
      config.weatherAlerts.autoPolling = autoPolling;
    }

    if (pollingInterval !== undefined) {
      config.weatherAlerts.pollingInterval = Math.max(5, Math.min(1440, pollingInterval));
    }

    if (allowedRoles && Array.isArray(allowedRoles)) {
      config.weatherAlerts.allowedRoles = allowedRoles;
    }

    if (requireApproval !== undefined) {
      config.weatherAlerts.requireApproval = requireApproval;
    }

    await config.save();

    res.json({
      success: true,
      message: "System weather alerts configuration updated",
      config: config.weatherAlerts,
    });
  } catch (error) {
    console.error("Error updating system weather config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
      error: error.message,
    });
  }
};

/**
 * Toggle weather alerts feature ON/OFF
 */
export const toggleWeatherAlerts = async (req, res) => {
  try {
    const { enabled } = req.body;

    let config = await SystemConfig.findById("system_config");

    if (!config) {
      config = new SystemConfig({
        _id: "system_config",
        weatherAlerts: {
          enabled: false,
          autoPolling: true,
          pollingInterval: 60,
          allowedRoles: ["super_admin"],
          requireApproval: true,
        },
      });
    }

    config.weatherAlerts.enabled = enabled;
    await config.save();

    res.json({
      success: true,
      message: `Weather alerts ${enabled ? "enabled" : "disabled"} system-wide`,
      enabled,
    });
  } catch (error) {
    console.error("Error toggling weather alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle weather alerts",
      error: error.message,
    });
  }
};

/**
 * Get all events with weather alert configurations
 */
export const getAllEventWeatherConfigs = async (req, res) => {
  try {
    const { enabled, page = 1, limit = 20 } = req.query;

    const query = {};
    if (enabled !== undefined) {
      query.enabled = enabled === "true";
    }

    const configs = await WeatherAlertConfig.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("event", "title location date time latitude longitude status")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    const total = await WeatherAlertConfig.countDocuments(query);

    res.json({
      success: true,
      configs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching event weather configs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configurations",
      error: error.message,
    });
  }
};

/**
 * Get system-wide weather alert statistics
 */
export const getSystemWeatherStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total events with weather monitoring enabled
    const totalMonitoredEvents = await WeatherAlertConfig.countDocuments({
      enabled: true,
    });

    // Total alerts sent in period
    const totalAlerts = await WeatherAlertLog.countDocuments({
      createdAt: { $gte: startDate },
    });

    // Alerts by type
    const alertsByType = await WeatherAlertLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$alertType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Acknowledged vs unacknowledged
    const acknowledgedCount = await WeatherAlertLog.countDocuments({
      createdAt: { $gte: startDate },
      acknowledged: true,
    });

    // Notification delivery stats
    const notificationStats = await WeatherAlertLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEmailSent: { $sum: "$notifications.email.sent" },
          totalEmailFailed: { $sum: "$notifications.email.failed" },
          totalSmsSent: { $sum: "$notifications.sms.sent" },
          totalSmsFailed: { $sum: "$notifications.sms.failed" },
          totalWhatsappSent: { $sum: "$notifications.whatsapp.sent" },
          totalWhatsappFailed: { $sum: "$notifications.whatsapp.failed" },
        },
      },
    ]);

    // Automation actions executed
    const automationStats = await WeatherAlertLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "automationActions.0": { $exists: true },
        },
      },
      {
        $unwind: "$automationActions",
      },
      {
        $group: {
          _id: "$automationActions.action",
          executed: {
            $sum: { $cond: ["$automationActions.executed", 1, 0] },
          },
          pending: {
            $sum: { $cond: ["$automationActions.executed", 0, 1] },
          },
        },
      },
    ]);

    // Recent alerts
    const recentAlerts = await WeatherAlertLog.find({
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("event", "title location date")
      .select("alertType weatherCondition message createdAt acknowledged");

    res.json({
      success: true,
      stats: {
        period: `Last ${days} days`,
        totalMonitoredEvents,
        totalAlerts,
        alertsByType,
        acknowledged: acknowledgedCount,
        unacknowledged: totalAlerts - acknowledgedCount,
        notifications: notificationStats[0] || {
          totalEmailSent: 0,
          totalEmailFailed: 0,
          totalSmsSent: 0,
          totalSmsFailed: 0,
          totalWhatsappSent: 0,
          totalWhatsappFailed: 0,
        },
        automation: automationStats,
        recentAlerts,
      },
    });
  } catch (error) {
    console.error("Error fetching system weather stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

/**
 * Get all pending automation approvals
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingAlerts = await WeatherAlertLog.find({
      "automationActions.requiresApproval": true,
      "automationActions.approved": { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("event", "title location date time status")
      .populate("triggeredByUser", "name email");

    const formatted = [];

    for (const alert of pendingAlerts) {
      for (let i = 0; i < alert.automationActions.length; i++) {
        const action = alert.automationActions[i];
        if (action.requiresApproval && !action.approved) {
          formatted.push({
            alertId: alert._id,
            actionIndex: i,
            event: alert.event,
            alertType: alert.alertType,
            weatherCondition: alert.weatherCondition,
            action: action.action,
            createdAt: alert.createdAt,
            triggeredBy: alert.triggeredBy,
            triggeredByUser: alert.triggeredByUser,
          });
        }
      }
    }

    res.json({
      success: true,
      total: formatted.length,
      pendingApprovals: formatted,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals",
      error: error.message,
    });
  }
};

/**
 * Bulk enable/disable weather alerts for multiple events
 */
export const bulkToggleWeatherAlerts = async (req, res) => {
  try {
    const { eventIds, enabled } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of event IDs",
      });
    }

    const result = await WeatherAlertConfig.updateMany(
      { event: { $in: eventIds } },
      { enabled, updatedBy: req.user._id }
    );

    res.json({
      success: true,
      message: `Weather alerts ${enabled ? "enabled" : "disabled"} for ${
        result.modifiedCount
      } events`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk toggling weather alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configurations",
      error: error.message,
    });
  }
};

/**
 * Delete weather alert configuration for an event
 */
export const deleteWeatherAlertConfig = async (req, res) => {
  try {
    const { eventId } = req.params;

    const config = await WeatherAlertConfig.findOneAndDelete({ event: eventId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Weather alert configuration not found",
      });
    }

    res.json({
      success: true,
      message: "Weather alert configuration deleted",
    });
  } catch (error) {
    console.error("Error deleting weather alert config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete configuration",
      error: error.message,
    });
  }
};

export default {
  getSystemWeatherConfig,
  updateSystemWeatherConfig,
  toggleWeatherAlerts,
  getAllEventWeatherConfigs,
  getSystemWeatherStats,
  getPendingApprovals,
  bulkToggleWeatherAlerts,
  deleteWeatherAlertConfig,
};

/**
 * Advanced Weather Alert Controller
 * Comprehensive weather monitoring and alert system
 */
import Event from "../models/Event.js";
import WeatherAlertConfig from "../models/WeatherAlertConfig.js";
import WeatherAlertLog from "../models/WeatherAlertLog.js";
import SystemConfig from "../models/SystemConfig.js";
import {
  fetchWeatherByCoordinates,
  fetchWeatherForecast,
  generateWeatherNotification,
} from "../utils/weatherService.js";
import { sendWeatherNotification } from "../utils/notificationService.js";

/**
 * Create or update weather alert config for an event
 */
export const createWeatherAlertConfig = async (req, res) => {
  try {
    const { eventId } = req.params;
    const configData = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event has location coordinates
    if (!event.latitude || !event.longitude) {
      return res.status(400).json({
        success: false,
        message: "Event must have latitude and longitude for weather monitoring",
      });
    }

    // Create or update config
    const config = await WeatherAlertConfig.findOneAndUpdate(
      { event: eventId },
      {
        ...configData,
        event: eventId,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Weather alert configuration saved",
      config,
    });
  } catch (error) {
    console.error("Error creating weather alert config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save weather alert configuration",
      error: error.message,
    });
  }
};

/**
 * Get weather alert config for an event
 */
export const getWeatherAlertConfig = async (req, res) => {
  try {
    const { eventId } = req.params;

    const config = await WeatherAlertConfig.findOne({ event: eventId })
      .populate("event", "title location date time latitude longitude")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!config) {
      // Return default config if none exists (allows admin to create one)
      const defaultConfig = {
        event: eventId,
        enabled: false,
        alertThresholds: {
          temperature: { min: -10, max: 40 },
          humidity: { min: 10, max: 90 },
          windSpeed: { max: 50 },
          precipitation: { max: 50 },
        },
        alertTypes: {
          storm: true,
          rain: true,
          heatwave: true,
          coldWave: false,
        },
        notificationTiming: {
          before: 24, // hours before event
        },
        recipients: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({
        success: true,
        config: defaultConfig,
        logs: [],
        isNew: true,
      });
      return;
    }

    // Get recent alert logs
    const logs = await WeatherAlertLog.find({ event: eventId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      config,
      logs,
    });
  } catch (error) {
    console.error("Error fetching weather alert config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
      error: error.message,
    });
  }
};

/**
 * Update weather alert configuration
 */
export const updateWeatherAlertConfig = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    let config = await WeatherAlertConfig.findOne({ event: eventId });

    if (!config) {
      // Create new config if it doesn't exist
      config = new WeatherAlertConfig({
        event: eventId,
        createdBy: userId,
        ...updates,
      });
    } else {
      // Update existing config
      Object.assign(config, updates);
      config.updatedBy = userId;
    }

    await config.save();

    res.json({
      success: true,
      message: "Configuration updated successfully",
      config,
    });
  } catch (error) {
    console.error("Error updating weather alert config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
      error: error.message,
    });
  }
};

/**
 * Manually trigger weather check and send alerts
 */
export const triggerWeatherAlert = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { forceNotify = false } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.latitude || !event.longitude) {
      return res.status(400).json({
        success: false,
        message: "Event location coordinates not available",
      });
    }

    const config = await WeatherAlertConfig.findOne({ event: eventId });
    if (!config || !config.enabled) {
      return res.status(400).json({
        success: false,
        message: "Weather alerts are not enabled for this event",
      });
    }

    // Fetch current weather
    const weatherData = await fetchWeatherByCoordinates(
      event.latitude,
      event.longitude
    );

    // Check if alert should be triggered
    const shouldAlert = checkAlertThresholds(weatherData, config);

    if (!shouldAlert && !forceNotify) {
      return res.json({
        success: true,
        message: "Weather conditions are within acceptable thresholds",
        weatherData,
        alertTriggered: false,
      });
    }

    // Generate notification
    const notification = generateWeatherNotification(weatherData);

    // Send notifications
    const notificationResult = await sendWeatherNotification({
      event,
      weatherAlert: {
        ...notification,
        ...weatherData,
      },
      alertConfig: config,
      recipients: config.notifications.email.recipients,
    });

    // Log the alert
    const alertLog = await WeatherAlertLog.create({
      event: eventId,
      alertType: notification.type,
      weatherCondition: weatherData.weatherCondition,
      weatherData: {
        temperature: weatherData.temperature,
        feelsLike: weatherData.feelsLike,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        rainfall: weatherData.rainfall || 0,
        description: weatherData.weatherDescription,
      },
      message: notification.message,
      notifications: notificationResult.notificationLog,
      triggeredBy: "manual",
      triggeredByUser: req.user._id,
    });

    // Execute automation actions if configured
    if (config.automation?.enabled) {
      const automationResults = await executeAutomationActions(
        event,
        config,
        notification.type,
        req.user._id,
        req.requiresApproval
      );
      alertLog.automationActions = automationResults;
      await alertLog.save();
    }

    res.json({
      success: true,
      message: "Weather alert triggered successfully",
      weatherData,
      notification,
      notificationResult,
      alertLog,
    });
  } catch (error) {
    console.error("Error triggering weather alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger weather alert",
      error: error.message,
    });
  }
};

/**
 * Get weather alert history for an event
 */
export const getWeatherAlertHistory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, alertType, acknowledged } = req.query;

    const query = { event: eventId };

    if (alertType) {
      query.alertType = alertType;
    }

    if (acknowledged !== undefined) {
      query.acknowledged = acknowledged === "true";
    }

    const alerts = await WeatherAlertLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("triggeredByUser", "name email role")
      .populate("acknowledgedBy", "name email role");

    const total = await WeatherAlertLog.countDocuments(query);

    res.json({
      success: true,
      alerts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alert history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert history",
      error: error.message,
    });
  }
};

/**
 * Acknowledge a weather alert
 */
export const acknowledgeWeatherAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await WeatherAlertLog.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    ).populate("acknowledgedBy", "name email");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      message: "Alert acknowledged",
      alert,
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
      error: error.message,
    });
  }
};

/**
 * Get dashboard statistics for weather alerts
 */
export const getWeatherAlertStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await WeatherAlertLog.aggregate([
      {
        $match: {
          event: mongoose.Types.ObjectId(eventId),
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

    const totalAlerts = await WeatherAlertLog.countDocuments({
      event: eventId,
      createdAt: { $gte: startDate },
    });

    const acknowledgedAlerts = await WeatherAlertLog.countDocuments({
      event: eventId,
      acknowledged: true,
      createdAt: { $gte: startDate },
    });

    // Get notification delivery stats
    const notificationStats = await WeatherAlertLog.aggregate([
      {
        $match: {
          event: mongoose.Types.ObjectId(eventId),
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

    res.json({
      success: true,
      stats: {
        period: `Last ${days} days`,
        totalAlerts,
        acknowledgedAlerts,
        unacknowledgedAlerts: totalAlerts - acknowledgedAlerts,
        byType: stats,
        notifications: notificationStats[0] || {
          totalEmailSent: 0,
          totalEmailFailed: 0,
          totalSmsSent: 0,
          totalSmsFailed: 0,
          totalWhatsappSent: 0,
          totalWhatsappFailed: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching weather alert stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

/**
 * Approve automation action
 */
export const approveAutomationAction = async (req, res) => {
  try {
    const { alertId, actionIndex } = req.params;

    const alert = await WeatherAlertLog.findById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    if (!alert.automationActions || !alert.automationActions[actionIndex]) {
      return res.status(404).json({
        success: false,
        message: "Automation action not found",
      });
    }

    const action = alert.automationActions[actionIndex];

    if (action.executed && !action.requiresApproval) {
      return res.status(400).json({
        success: false,
        message: "Action already executed",
      });
    }

    // Approve and execute the action
    action.approved = true;
    action.approvedBy = req.user._id;
    action.approvedAt = new Date();

    // Execute the action
    const event = await Event.findById(alert.event);
    await performAutomationAction(event, action.action);

    action.executed = true;
    action.executedAt = new Date();
    action.executedBy = req.user._id;

    await alert.save();

    res.json({
      success: true,
      message: "Automation action approved and executed",
      alert,
    });
  } catch (error) {
    console.error("Error approving automation action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve action",
      error: error.message,
    });
  }
};

/**
 * Helper: Check if weather data exceeds thresholds
 */
function checkAlertThresholds(weatherData, config) {
  const thresholds = config.thresholds;
  const conditions = config.alertConditions;

  // Temperature check
  if (
    weatherData.temperature < thresholds.temperature.min ||
    weatherData.temperature > thresholds.temperature.max
  ) {
    return true;
  }

  // Rainfall check
  if (weatherData.rainfall > thresholds.rainfall) {
    return true;
  }

  // Wind speed check
  if (weatherData.windSpeed > thresholds.windSpeed) {
    return true;
  }

  // Humidity check
  if (weatherData.humidity > thresholds.humidity) {
    return true;
  }

  // Weather condition checks
  const condition = weatherData.weatherCondition.toLowerCase();

  if (conditions.thunderstorm && condition.includes("thunderstorm")) {
    return true;
  }

  if (conditions.heavyRain && (condition.includes("rain") || condition.includes("drizzle"))) {
    return true;
  }

  if (conditions.snow && condition.includes("snow")) {
    return true;
  }

  if (conditions.tornado && condition.includes("tornado")) {
    return true;
  }

  if (conditions.fog && (condition.includes("fog") || condition.includes("mist"))) {
    return true;
  }

  return false;
}

/**
 * Helper: Execute automation actions
 */
async function executeAutomationActions(
  event,
  config,
  alertType,
  userId,
  requiresApproval
) {
  const actions = [];
  const automation = config.automation.actions;

  // Mark On Hold
  if (
    automation.markOnHold?.enabled &&
    shouldExecuteAction(alertType, automation.markOnHold.threshold)
  ) {
    actions.push({
      action: "markOnHold",
      requiresApproval,
      executed: !requiresApproval,
      executedAt: !requiresApproval ? new Date() : undefined,
      executedBy: !requiresApproval ? userId : undefined,
    });

    if (!requiresApproval) {
      await performAutomationAction(event, "markOnHold");
    }
  }

  // Mark Delayed
  if (
    automation.markDelayed?.enabled &&
    shouldExecuteAction(alertType, automation.markDelayed.threshold)
  ) {
    actions.push({
      action: "markDelayed",
      requiresApproval,
      executed: !requiresApproval,
      executedAt: !requiresApproval ? new Date() : undefined,
      executedBy: !requiresApproval ? userId : undefined,
    });

    if (!requiresApproval) {
      await performAutomationAction(event, "markDelayed");
    }
  }

  // Mark Cancelled
  if (
    automation.markCancelled?.enabled &&
    shouldExecuteAction(alertType, automation.markCancelled.threshold)
  ) {
    const needsApproval = requiresApproval || automation.markCancelled.requireManualApproval;

    actions.push({
      action: "markCancelled",
      requiresApproval: needsApproval,
      executed: !needsApproval,
      executedAt: !needsApproval ? new Date() : undefined,
      executedBy: !needsApproval ? userId : undefined,
    });

    if (!needsApproval) {
      await performAutomationAction(event, "markCancelled");
    }
  }

  // Restrict Entry
  if (
    automation.restrictEntry?.enabled &&
    shouldExecuteAction(alertType, automation.restrictEntry.threshold)
  ) {
    actions.push({
      action: "restrictEntry",
      requiresApproval,
      executed: !requiresApproval,
      executedAt: !requiresApproval ? new Date() : undefined,
      executedBy: !requiresApproval ? userId : undefined,
    });

    if (!requiresApproval) {
      await performAutomationAction(event, "restrictEntry");
    }
  }

  return actions;
}

/**
 * Helper: Check if action should be executed based on threshold
 */
function shouldExecuteAction(alertType, threshold) {
  if (threshold === "warning") {
    return alertType === "warning";
  }
  if (threshold === "caution") {
    return alertType === "warning" || alertType === "caution";
  }
  return false;
}

/**
 * Helper: Perform automation action on event
 */
async function performAutomationAction(event, action) {
  switch (action) {
    case "markOnHold":
      event.weatherStatus = "on_hold";
      break;
    case "markDelayed":
      event.weatherStatus = "delayed";
      break;
    case "markCancelled":
      event.status = "cancelled";
      event.weatherStatus = "cancelled_weather";
      break;
    case "restrictEntry":
      event.weatherStatus = "entry_restricted";
      break;
  }

  await event.save();
}

export default {
  createWeatherAlertConfig,
  getWeatherAlertConfig,
  updateWeatherAlertConfig,
  triggerWeatherAlert,
  getWeatherAlertHistory,
  acknowledgeWeatherAlert,
  getWeatherAlertStats,
  approveAutomationAction,
};

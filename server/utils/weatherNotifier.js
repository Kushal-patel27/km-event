import Event from "../models/Event.js";
import WeatherAlertConfig from "../models/WeatherAlertConfig.js";
import WeatherAlertLog from "../models/WeatherAlertLog.js";
import SystemConfig from "../models/SystemConfig.js";
import {
  fetchWeatherByCoordinates,
  fetchWeatherForecast,
  fetchUVIndex,
  generateWeatherNotification,
  saveWeatherData,
} from "./weatherService.js";
import { sendWeatherNotification } from "./notificationService.js";

/**
 * Background scheduler to check weather for upcoming events
 * with configurable thresholds and automation
 */
export function startWeatherAlertsScheduler() {
  // Run immediately and then on interval
  runScheduler();
  
  // Set interval based on system config
  setInterval(async () => {
    await runScheduler();
  }, 5 * 60 * 1000); // Check every 5 minutes for config changes
}

async function runScheduler() {
  try {
    // Check if feature is enabled
    const systemConfig = await SystemConfig.findById("system_config");
    
    if (!systemConfig || !systemConfig.weatherAlerts?.enabled) {
      console.log("Weather alerts scheduler: Feature disabled by Super Admin");
      return;
    }

    if (!systemConfig.weatherAlerts?.autoPolling) {
      console.log("Weather alerts scheduler: Auto-polling disabled");
      return;
    }

    const now = new Date();
    const lookaheadDays = Number(process.env.WEATHER_ALERTS_LOOKAHEAD_DAYS || 3);
    const lookahead = new Date(now.getTime() + lookaheadDays * 24 * 60 * 60 * 1000);

    // Fetch upcoming events that are scheduled/ongoing
    const events = await Event.find({
      date: { $gte: now, $lte: lookahead },
      status: { $in: ["scheduled", "ongoing"] },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    }).select("title date time location latitude longitude");

    if (!events || events.length === 0) {
      console.log("Weather scheduler: No upcoming events found in lookahead window.");
      return;
    }

    console.log(`Weather scheduler: Checking ${events.length} upcoming events...`);

    for (const event of events) {
      try {
        // Get alert configuration for this event
        const alertConfig = await WeatherAlertConfig.findOne({ event: event._id });

        if (!alertConfig || !alertConfig.enabled) {
          console.log(`Weather scheduler: Skipping event '${event.title}' — alerts disabled`);
          continue;
        }

        // Check if enough time has passed since last check
        const pollingInterval = alertConfig.pollingInterval || systemConfig.weatherAlerts.pollingInterval || 60;
        const lastChecked = alertConfig.lastChecked;
        
        if (lastChecked) {
          const minutesSinceLastCheck = (now - lastChecked) / (1000 * 60);
          if (minutesSinceLastCheck < pollingInterval) {
            console.log(`Weather scheduler: Skipping event '${event.title}' — checked ${Math.round(minutesSinceLastCheck)} min ago`);
            continue;
          }
        }

        // Fetch weather data
        const current = await fetchWeatherByCoordinates(event.latitude, event.longitude);
        const forecast = await fetchWeatherForecast(event.latitude, event.longitude);
        const uvIndex = await fetchUVIndex(event.latitude, event.longitude);

        const weatherData = { ...current, uvIndex };

        // Check if alert should be triggered based on thresholds
        const shouldAlert = checkAlertThresholds(weatherData, alertConfig);

        // Update last checked time
        alertConfig.lastChecked = now;
        await alertConfig.save();

        // Save weather data
        await saveWeatherData(event._id, weatherData, forecast);

        if (!shouldAlert) {
          console.log(`Weather scheduler: Event '${event.title}' — weather OK`);
          continue;
        }

        // Check if we should send notification based on event timing
        if (!isTimeToSendNotification(event, alertConfig)) {
          console.log(
            `Weather scheduler: Event '${event.title}' — not yet time to send (send ${alertConfig.notificationTiming}h before)`
          );
          continue;
        }

        // Get risk data to check for specific risk types
        const { risks } = weatherData.riskData || { risks: [] };

        // Check each risk type and send alerts only for new risks
        let alertsSent = 0;
        for (const risk of risks) {
          const riskType = risk.type;

          // Check if we've already sent an alert for this risk type
          if (hasAlertBeenSent(alertConfig, riskType)) {
            console.log(
              `Weather scheduler: Event '${event.title}' — alert for ${riskType} already sent recently`
            );
            continue;
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
            alertConfig,
            recipients: alertConfig.notifications.email.recipients,
          });

          // Log the alert
          const alertLog = await WeatherAlertLog.create({
            event: event._id,
            alertType: notification.type,
            weatherCondition: riskType,
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
            triggeredBy: "auto",
          });

          // Mark this risk alert as sent
          await markAlertAsSent(alertConfig, riskType, notification.message);

          alertsSent++;
          console.log(
            `✅ Weather alert sent for event '${event.title}' — ${riskType} (${notification.type})`
          );

          // Execute automation actions if configured
          if (alertConfig.automation?.enabled) {
            const requiresApproval = systemConfig.weatherAlerts?.requireApproval ?? true;
            const automationResults = await executeAutomationActions(
              event,
              alertConfig,
              notification.type,
              null,
              requiresApproval
            );
            alertLog.automationActions = automationResults;
            await alertLog.save();
          }
        }

        if (alertsSent === 0) {
          console.log(
            `Weather scheduler: Event '${event.title}' — has risks but all alerts already sent`
          );
        }
      } catch (e) {
        console.error("Weather scheduler: Error processing event", event._id?.toString(), e.message);
      }
    }
  } catch (err) {
    console.error("Weather scheduler: runScheduler failed:", err.message);
  }
}

/**
 * Check if alert for this risk type has already been sent recently
 */
function hasAlertBeenSent(alertConfig, riskType) {
  if (!alertConfig.alertsSent || alertConfig.alertsSent.length === 0) {
    return false;
  }

  // Find the most recent alert of this type
  const lastAlert = alertConfig.alertsSent.find((a) => a.alertType === riskType);

  if (!lastAlert) {
    return false;
  }

  // Check if alert was sent in the last 3 hours (prevent spam)
  const threHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return lastAlert.sentAt > threHoursAgo;
}

/**
 * Check if it's time to send notification based on event timing
 */
function isTimeToSendNotification(event, config) {
  const now = new Date();
  const eventTime = new Date(event.date);
  const timingHours = config.notificationTiming || 24;
  const sendBefore = new Date(eventTime.getTime() - timingHours * 60 * 60 * 1000);

  // Send notification only within the time window (up to notificationTiming hours before)
  return now >= sendBefore && now < eventTime;
}

/**
 * Update alert sent tracking to prevent spam
 */
async function markAlertAsSent(alertConfig, riskType, weatherCondition) {
  alertConfig.alertsSent = alertConfig.alertsSent || [];

  // Remove old alerts of this type (keep only recent ones)
  alertConfig.alertsSent = alertConfig.alertsSent.filter(
    (a) => a.alertType !== riskType
  );

  // Add new alert record
  alertConfig.alertsSent.push({
    alertType: riskType,
    sentAt: new Date(),
    weatherCondition,
  });

  // Keep only last 10 alerts
  if (alertConfig.alertsSent.length > 10) {
    alertConfig.alertsSent = alertConfig.alertsSent.slice(-10);
  }

  await alertConfig.save();
}

/**
 * Check if weather data exceeds configured thresholds
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
  if ((weatherData.rainfall || 0) > thresholds.rainfall) {
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
 * Execute automation actions based on alert type
 */
async function executeAutomationActions(event, config, alertType, userId, requiresApproval) {
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
      executedBy: userId,
    });

    if (!requiresApproval) {
      event.weatherStatus = "on_hold";
      await event.save();
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
      executedBy: userId,
    });

    if (!requiresApproval) {
      event.weatherStatus = "delayed";
      await event.save();
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
      executedBy: userId,
    });

    if (!needsApproval) {
      event.status = "cancelled";
      event.weatherStatus = "cancelled_weather";
      await event.save();
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
      executedBy: userId,
    });

    if (!requiresApproval) {
      event.weatherStatus = "entry_restricted";
      await event.save();
    }
  }

  return actions;
}

/**
 * Check if action should be executed based on threshold
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


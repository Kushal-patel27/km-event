import {
  fetchWeatherByCoordinates,
  fetchWeatherForecast,
  fetchUVIndex,
  generateWeatherNotification,
  saveWeatherData,
  getWeatherAlerts,
} from "../utils/weatherService.js";
import { sendWeatherAlertEmail } from "../utils/emailService.js";
import Weather from "../models/Weather.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

/**
 * Get current weather for an event
 */
export const getCurrentWeather = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event to fetch coordinates
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch current weather
    const weatherData = await fetchWeatherByCoordinates(
      event.latitude || 0,
      event.longitude || 0
    );

    // Fetch forecast
    const forecast = await fetchWeatherForecast(
      event.latitude || 0,
      event.longitude || 0
    );

    // Fetch UV Index
    const uvIndex = await fetchUVIndex(
      event.latitude || 0,
      event.longitude || 0
    );

    // Generate notification
    const notification = generateWeatherNotification({
      ...weatherData,
      uvIndex,
    });

    // Save weather data
    const weatherRecord = await saveWeatherData(eventId, weatherData, forecast);

    // ✅ Auto-notify bookers if there's a bad weather alert
    if (notification.hasAlert && (notification.type === 'warning' || notification.type === 'caution')) {
      try {
        await notifyBookersOfWeather(eventId, {
          ...notification,
          ...weatherData,
          feelsLike: weatherData.feelsLike,
        });
      } catch (notifyError) {
        console.error("Error sending notifications:", notifyError);
        // Don't fail the request if notifications fail
      }
    }

    res.json({
      success: true,
      currentWeather: {
        ...weatherData,
        uvIndex,
      },
      forecast,
      notification,
      lastUpdated: weatherRecord.lastUpdated,
    });
  } catch (error) {
    console.error("Error getting current weather:", error.message);
    res.status(500).json({
      message: "Failed to fetch weather data",
      error: error.message,
    });
  }
};

/**
 * Get weather alerts for an event
 */
export const getWeatherNotifications = async (req, res) => {
  try {
    const { eventId } = req.params;

    const alerts = await getWeatherAlerts(eventId);

    res.json({
      success: true,
      ...alerts,
    });
  } catch (error) {
    console.error("Error getting weather alerts:", error.message);
    res.status(500).json({
      message: "Failed to fetch weather alerts",
      error: error.message,
    });
  }
};

/**
 * Get weather history for an event
 */
export const getWeatherHistory = async (req, res) => {
  try {
    const { eventId } = req.params;

    const weatherHistory = await Weather.findOne({ eventId });

    if (!weatherHistory) {
      return res.status(404).json({ message: "No weather history found" });
    }

    res.json({
      success: true,
      data: weatherHistory,
    });
  } catch (error) {
    console.error("Error getting weather history:", error.message);
    res.status(500).json({
      message: "Failed to fetch weather history",
      error: error.message,
    });
  }
};

/**
 * Get weather for multiple events
 */
export const getMultipleEventsWeather = async (req, res) => {
  try {
    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of event IDs" });
    }

    const events = await Event.find({
      _id: { $in: eventIds },
    }).select("_id latitude longitude city venue");

    const weatherResults = [];

    for (const event of events) {
      try {
        const weatherData = await fetchWeatherByCoordinates(
          event.latitude || 0,
          event.longitude || 0
        );

        const notification = generateWeatherNotification(weatherData);

        weatherResults.push({
          eventId: event._id,
          venue: event.venue,
          city: event.city,
          weather: weatherData,
          notification,
        });
      } catch (error) {
        weatherResults.push({
          eventId: event._id,
          error: "Failed to fetch weather",
        });
      }
    }

    res.json({
      success: true,
      data: weatherResults,
    });
  } catch (error) {
    console.error("Error getting multiple events weather:", error.message);
    res.status(500).json({
      message: "Failed to fetch weather for events",
      error: error.message,
    });
  }
};

/**
 * Update weather settings for an event
 */
export const updateWeatherSettings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notificationEnabled, alertThreshold } = req.body;

    const weather = await Weather.findOneAndUpdate(
      { eventId },
      {
        notificationEnabled,
        alertThreshold,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Weather settings updated",
      data: weather,
    });
  } catch (error) {
    console.error("Error updating weather settings:", error.message);
    res.status(500).json({
      message: "Failed to update weather settings",
      error: error.message,
    });
  }
};

/**
 * Get weather comparison between locations
 */
export const compareWeather = async (req, res) => {
  try {
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of locations" });
    }

    const weatherComparison = [];

    for (const location of locations) {
      try {
        const weatherData = await fetchWeatherByCoordinates(
          location.latitude,
          location.longitude
        );
        weatherComparison.push({
          location: location.name,
          ...weatherData,
        });
      } catch (error) {
        weatherComparison.push({
          location: location.name,
          error: "Failed to fetch weather",
        });
      }
    }

    res.json({
      success: true,
      data: weatherComparison,
    });
  } catch (error) {
    console.error("Error comparing weather:", error.message);
    res.status(500).json({
      message: "Failed to compare weather",
      error: error.message,
    });
  }
};

/**
 * Get weather impact assessment for events
 */
export const getWeatherImpactAssessment = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const weatherData = await fetchWeatherByCoordinates(
      event.latitude || 0,
      event.longitude || 0
    );

    const forecast = await fetchWeatherForecast(
      event.latitude || 0,
      event.longitude || 0
    );

    // Calculate impact score
    let impactScore = 0;
    let riskLevel = "LOW";
    const recommendations = [];

    const temp = weatherData.temperature;
    const condition = weatherData.weatherCondition.toLowerCase();
    const windSpeed = weatherData.windSpeed;
    const rainfall = weatherData.rainfall;

    // Temperature impact
    if (temp > 40 || temp < -5) {
      impactScore += 30;
      recommendations.push("Consider cancellation or rescheduling");
    } else if (temp > 35 || temp < 0) {
      impactScore += 15;
      recommendations.push("Prepare heating/cooling arrangements");
    }

    // Weather condition impact
    if (condition.includes("thunderstorm") || condition.includes("tornado")) {
      impactScore += 35;
      recommendations.push("Secure tents and canopies");
    } else if (condition.includes("rain") && rainfall > 5) {
      impactScore += 20;
      recommendations.push("Arrange covered areas and drainage");
    } else if (condition.includes("snow")) {
      impactScore += 15;
      recommendations.push("Clear snow paths and provide winter gear");
    }

    // Wind impact
    if (windSpeed > 50) {
      impactScore += 25;
      recommendations.push("Secure all outdoor equipment and decorations");
    } else if (windSpeed > 30) {
      impactScore += 10;
      recommendations.push("Monitor wind conditions throughout event");
    }

    if (impactScore >= 40) {
      riskLevel = "HIGH";
    } else if (impactScore >= 20) {
      riskLevel = "MEDIUM";
    }

    res.json({
      success: true,
      impactAssessment: {
        impactScore,
        riskLevel,
        currentConditions: weatherData,
        forecast: forecast.slice(0, 3),
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error getting impact assessment:", error.message);
    res.status(500).json({
      message: "Failed to assess weather impact",
      error: error.message,
    });
  }
};

/**
 * Get all weather alerts with affected bookings
 * @desc    Admin dashboard - shows all events with weather alerts and who booked tickets
 * @access  Private (Admin only)
 */
export const getAllWeatherAlertsWithBookings = async (req, res) => {
  try {
    // Import Booking and User models
    import("../models/Booking.js").then(async ({ default: Booking }) => {
      import("../models/User.js").then(async ({ default: User }) => {
        // Get all weather records with alerts
        const weatherAlerts = await Weather.find(
          { notificationSent: true },
          { eventId: 1, notificationType: 1, notificationMessage: 1, lastUpdated: 1, temperature: 1, weatherCondition: 1, humidity: 1, windSpeed: 1, rainfall: 1 }
        ).populate("eventId", "name location latitude longitude date time");

        // For each weather alert, get affected bookings
        const alertsWithBookings = await Promise.all(
          weatherAlerts.map(async (alert) => {
            const bookings = await Booking.find({ event: alert.eventId })
              .populate("user", "name email phone")
              .populate("event", "name date time");

            return {
              eventId: alert.eventId?._id,
              eventName: alert.eventId?.name,
              eventLocation: alert.eventId?.location,
              eventDate: alert.eventId?.date,
              eventTime: alert.eventId?.time,
              weatherAlert: {
                type: alert.notificationType,
                message: alert.notificationMessage,
                condition: alert.weatherCondition,
                temperature: alert.temperature,
                humidity: alert.humidity,
                windSpeed: alert.windSpeed,
                rainfall: alert.rainfall,
                lastUpdated: alert.lastUpdated,
              },
              affectedBookings: bookings.map((booking) => ({
                bookingId: booking._id,
                userName: booking.user?.name,
                userEmail: booking.user?.email,
                userPhone: booking.user?.phone,
                ticketsBooked: booking.quantity,
                totalAmount: booking.totalAmount,
                status: booking.status,
                bookingDate: booking.createdAt,
                seats: booking.seats,
              })),
              totalBookings: bookings.length,
              totalTickets: bookings.reduce((sum, b) => sum + b.quantity, 0),
            };
          })
        );

        res.json({
          success: true,
          totalAlerts: alertsWithBookings.length,
          alerts: alertsWithBookings,
        });
      });
    });
  } catch (error) {
    console.error("Error getting weather alerts with bookings:", error.message);
    res.status(500).json({
      message: "Failed to fetch weather alerts",
      error: error.message,
    });
  }
};

/**
 * Notify all bookers of an event about bad weather
 * @private - Called internally when weather alerts are generated
 */
export const notifyBookersOfWeather = async (eventId, weatherAlert) => {
  try {
    if (!weatherAlert || !weatherAlert.hasAlert) {
      console.log("No significant weather alert to notify");
      return { success: true, notified: 0 };
    }

    // Get all bookings for the event
    const bookings = await Booking.find({ event: eventId })
      .populate("user", "name email phone")
      .populate("event", "name date time location");

    if (bookings.length === 0) {
      console.log("No bookings found for event:", eventId);
      return { success: true, notified: 0 };
    }

    let notificationCount = 0;
    let failedCount = 0;

    // Send email to each booker
    for (const booking of bookings) {
      try {
        const emailSent = await sendWeatherAlertEmail(
          {
            user: booking.user,
            event: booking.event,
            quantity: booking.quantity,
          },
          {
            type: weatherAlert.type,
            message: weatherAlert.message,
            condition: weatherAlert.condition || "Unknown",
            temperature: weatherAlert.temperature,
            feelsLike: weatherAlert.feelsLike,
            humidity: weatherAlert.humidity,
            windSpeed: weatherAlert.windSpeed,
            rainfall: weatherAlert.rainfall || 0,
          }
        );

        if (emailSent) {
          notificationCount++;
        } else {
          failedCount++;
        }
      } catch (emailError) {
        console.error(
          `Failed to send email to ${booking.user.email}:`,
          emailError
        );
        failedCount++;
      }
    }

    console.log(
      `✅ Weather notifications sent: ${notificationCount} successful, ${failedCount} failed`
    );

    return {
      success: true,
      notified: notificationCount,
      failed: failedCount,
      total: bookings.length,
    };
  } catch (error) {
    console.error("Error in notifyBookersOfWeather:", error.message);
    return {
      success: false,
      notified: 0,
      error: error.message,
    };
  }
};

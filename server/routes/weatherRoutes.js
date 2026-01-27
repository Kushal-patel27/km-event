import express from "express";
import {
  getCurrentWeather,
  getWeatherNotifications,
  getWeatherHistory,
  getMultipleEventsWeather,
  updateWeatherSettings,
  compareWeather,
  getWeatherImpactAssessment,
  getAllWeatherAlertsWithBookings,
  notifyBookersOfWeather,
} from "../controllers/weatherController.js";

const router = express.Router();

/**
 * @route   GET /api/weather/:eventId
 * @desc    Get current weather for an event
 * @access  Public
 */
router.get("/:eventId", getCurrentWeather);

/**
 * @route   GET /api/weather/:eventId/alerts
 * @desc    Get weather alerts and notifications for an event
 * @access  Public
 */
router.get("/:eventId/alerts", getWeatherNotifications);

/**
 * @route   GET /api/weather/:eventId/history
 * @desc    Get weather history for an event
 * @access  Public
 */
router.get("/:eventId/history", getWeatherHistory);

/**
 * @route   POST /api/weather/multiple
 * @desc    Get weather for multiple events
 * @access  Public
 * @body    { eventIds: [id1, id2, ...] }
 */
router.post("/multiple/events", getMultipleEventsWeather);

/**
 * @route   PUT /api/weather/:eventId/settings
 * @desc    Update weather settings for an event
 * @access  Private (Admin/Event Admin)
 * @body    { notificationEnabled: boolean, alertThreshold: number }
 */
router.put("/:eventId/settings", updateWeatherSettings);

/**
 * @route   POST /api/weather/compare
 * @desc    Compare weather between locations
 * @access  Public
 * @body    { locations: [{ name, latitude, longitude }, ...] }
 */
router.post("/compare/locations", compareWeather);

/**
 * @route   GET /api/weather/:eventId/impact
 * @desc    Get weather impact assessment for an event
 * @access  Public
 */
router.get("/:eventId/impact", getWeatherImpactAssessment);

/**
 * @route   GET /api/weather/admin/all-alerts
 * @desc    Get all weather alerts with affected bookings (Admin dashboard)
 * @access  Private (Admin only)
 */
router.get("/admin/all-alerts", getAllWeatherAlertsWithBookings);

/**
 * @route   POST /api/weather/test/notify/:eventId
 * @desc    TEST ENDPOINT - Send weather notifications to all bookers for an event
 * @access  Public (FOR TESTING ONLY)
 * @body    { type, message, condition, temperature, humidity, windSpeed, rainfall }
 */
router.post("/test/notify/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      type = "warning", 
      message = "Test weather alert", 
      condition = "Heavy Rain",
      temperature = 28,
      humidity = 85,
      windSpeed = 45,
      rainfall = 10
    } = req.body;

    console.log("🧪 TEST: Sending weather notifications for event:", eventId);

    const result = await notifyBookersOfWeather(eventId, {
      hasAlert: true,
      type,
      message,
      condition,
      temperature,
      humidity,
      windSpeed,
      rainfall,
    });

    res.json({
      success: true,
      test: true,
      message: "Test notification triggered",
      result,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

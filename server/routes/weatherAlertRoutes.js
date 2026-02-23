import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  checkAutomationApproval,
} from "../middleware/weatherMiddleware.js";
import {
  createWeatherAlertConfig,
  getWeatherAlertConfig,
  updateWeatherAlertConfig,
  triggerWeatherAlert,
  getWeatherAlertHistory,
  acknowledgeWeatherAlert,
  getWeatherAlertStats,
  approveAutomationAction,
} from "../controllers/weatherAlertController.js";

const router = express.Router();

/**
 * @route   POST /api/weather-alerts/config/:eventId
 * @desc    Create or update weather alert configuration for an event
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.post(
  "/config/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  createWeatherAlertConfig
);

/**
 * @route   GET /api/weather-alerts/config/:eventId
 * @desc    Get weather alert configuration for an event
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.get(
  "/config/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  getWeatherAlertConfig
);

/**
 * @route   PUT /api/weather-alerts/config/:eventId
 * @desc    Update weather alert configuration for an event
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.put(
  "/config/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  updateWeatherAlertConfig
);

/**
 * @route   POST /api/weather-alerts/trigger/:eventId
 * @desc    Manually trigger weather check and send alerts
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.post(
  "/trigger/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  checkAutomationApproval,
  triggerWeatherAlert
);

/**
 * @route   GET /api/weather-alerts/history/:eventId
 * @desc    Get weather alert history for an event
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.get(
  "/history/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  getWeatherAlertHistory
);

/**
 * @route   PATCH /api/weather-alerts/acknowledge/:alertId
 * @desc    Acknowledge a weather alert
 * @access  Private (Super Admin, Event Admin)
 */
router.patch(
  "/acknowledge/:alertId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  acknowledgeWeatherAlert
);

/**
 * @route   GET /api/weather-alerts/stats/:eventId
 * @desc    Get weather alert statistics for an event
 * @access  Private (Super Admin, Event Admin with permission)
 */
router.get(
  "/stats/:eventId",
  protect,
  checkWeatherAlertsEnabled,
  checkWeatherAlertsPermission,
  checkEventWeatherAccess,
  getWeatherAlertStats
);

/**
 * @route   POST /api/weather-alerts/approve/:alertId/:actionIndex
 * @desc    Approve and execute an automation action
 * @access  Private (Super Admin only)
 */
router.post(
  "/approve/:alertId/:actionIndex",
  protect,
  checkWeatherAlertsEnabled,
  (req, res, next) => {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can approve automation actions",
      });
    }
    next();
  },
  approveAutomationAction
);

export default router;

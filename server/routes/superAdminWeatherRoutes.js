import express from "express";
import { protect, requireSuperAdmin } from "../middleware/authMiddleware.js";
import {
  getSystemWeatherConfig,
  updateSystemWeatherConfig,
  toggleWeatherAlerts,
  getAllEventWeatherConfigs,
  getSystemWeatherStats,
  getPendingApprovals,
  bulkToggleWeatherAlerts,
  deleteWeatherAlertConfig,
} from "../controllers/superAdminWeatherController.js";

const router = express.Router();

/**
 * @route   GET /api/super-admin/weather/system-config
 * @desc    Get system-wide weather alerts configuration
 * @access  Private (Super Admin only)
 */
router.get(
  "/system-config",
  protect,
  requireSuperAdmin,
  getSystemWeatherConfig
);

/**
 * @route   PUT /api/super-admin/weather/system-config
 * @desc    Update system-wide weather alerts configuration
 * @access  Private (Super Admin only)
 */
router.put(
  "/system-config",
  protect,
  requireSuperAdmin,
  updateSystemWeatherConfig
);

/**
 * @route   POST /api/super-admin/weather/toggle
 * @desc    Toggle weather alerts feature ON/OFF system-wide
 * @access  Private (Super Admin only)
 */
router.post("/toggle", protect, requireSuperAdmin, toggleWeatherAlerts);

/**
 * @route   GET /api/super-admin/weather/configs
 * @desc    Get all events with weather alert configurations
 * @access  Private (Super Admin only)
 */
router.get(
  "/configs",
  protect,
  requireSuperAdmin,
  getAllEventWeatherConfigs
);

/**
 * @route   GET /api/super-admin/weather/stats
 * @desc    Get system-wide weather alert statistics
 * @access  Private (Super Admin only)
 */
router.get("/stats", protect, requireSuperAdmin, getSystemWeatherStats);

/**
 * @route   GET /api/super-admin/weather/pending-approvals
 * @desc    Get all pending automation approvals
 * @access  Private (Super Admin only)
 */
router.get(
  "/pending-approvals",
  protect,
  requireSuperAdmin,
  getPendingApprovals
);

/**
 * @route   POST /api/super-admin/weather/bulk-toggle
 * @desc    Bulk enable/disable weather alerts for multiple events
 * @access  Private (Super Admin only)
 */
router.post(
  "/bulk-toggle",
  protect,
  requireSuperAdmin,
  bulkToggleWeatherAlerts
);

/**
 * @route   DELETE /api/super-admin/weather/config/:eventId
 * @desc    Delete weather alert configuration for an event
 * @access  Private (Super Admin only)
 */
router.delete(
  "/config/:eventId",
  protect,
  requireSuperAdmin,
  deleteWeatherAlertConfig
);

export default router;

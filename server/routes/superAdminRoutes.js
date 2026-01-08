import express from "express";
import { protect, requireSuperAdmin } from "../middleware/authMiddleware.js";
import {
  // User management
  getAllUsers,
  getUserDetails,
  updateUser,
  createUser,
  disableUser,
  reactivateUser,
  assignUserRole,
  deleteUser,
  // Staff management (Global)
  createGlobalStaff,
  getGlobalStaff,
  updateGlobalStaff,
  deleteGlobalStaff,
  // Role management
  getRoles,
  // Event management
  getAllEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  // Booking management
  getAllBookings,
  updateBookingStatus,
  refundBooking,
  // Analytics
  getPlatformAnalytics,
  // System settings
  getSystemConfig,
  updateSystemConfig,
  // Logs
  getSystemLogs,
  exportPlatformData,
} from "../controllers/superAdminController.js";

const router = express.Router();

// Apply super admin protection to all routes
router.use(protect, requireSuperAdmin);

// ============ USER MANAGEMENT ============
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.post("/users", createUser);
router.put("/users/:userId", updateUser);
router.post("/users/:userId/disable", disableUser);
router.post("/users/:userId/reactivate", reactivateUser);
router.put("/users/:userId/role", assignUserRole);
router.delete("/users/:userId", deleteUser);

// ============ STAFF MANAGEMENT (Global) ============
router.post("/staff", createGlobalStaff);
router.get("/staff", getGlobalStaff);
router.put("/staff/:staffId", updateGlobalStaff);
router.delete("/staff/:staffId", deleteGlobalStaff);

// ============ ROLE MANAGEMENT ============
router.get("/roles", getRoles);

// ============ EVENT MANAGEMENT ============
router.get("/events", getAllEvents);
router.get("/events/:eventId", getEventDetails);
router.put("/events/:eventId", updateEvent);
router.delete("/events/:eventId", deleteEvent);

// ============ BOOKING MANAGEMENT ============
router.get("/bookings", getAllBookings);
router.put("/bookings/:bookingId/status", updateBookingStatus);
router.post("/bookings/:bookingId/refund", refundBooking);

// ============ ANALYTICS ============
router.get("/analytics/platform", getPlatformAnalytics);

// ============ SYSTEM SETTINGS ============
router.get("/config", getSystemConfig);
router.put("/config", updateSystemConfig);

// ============ LOGS ============
router.get("/logs", getSystemLogs);
router.get("/export", exportPlatformData);

export default router;

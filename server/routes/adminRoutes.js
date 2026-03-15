import express from "express";
import { protect, requireAdminRole, requireRoles } from "../middleware/authMiddleware.js";
import {
  getDashboardOverview,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getEvents,
  createEvent,
  getEventDetails,
  updateEvent,
  deleteEvent,
  getBookings,
  updateBookingStatus,
  getContacts,
  replyContact,
  getUsersEmailPreferences,
  exportEventsData,
  exportBookingsData,
  getFcmDevices,
} from "../controllers/adminController.js";
import { sendNotification, listNotifications, listTemplates, saveTemplate } from "../controllers/notificationController.js";
import { sendPushNotification, getPushNotificationHealth } from "../controllers/pushNotificationController.js";
import rateLimit from "express-rate-limit";

// Limit push notification dispatches to 20 per hour per admin (prevents accidental spam)
const pushNotificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: "Too many push notification requests. Please wait before sending more." },
});

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, requireAdminRole);

// ============ DASHBOARD ============
router.get("/overview", getDashboardOverview);

// ============ TEAM MANAGEMENT (Event Admin & Staff Admin) ============
router.get("/team", getTeamMembers);
router.post("/team", createTeamMember);
router.put("/team/:userId", updateTeamMember);
router.delete("/team/:userId", deleteTeamMember);

// ============ EVENT MANAGEMENT ============
router.get("/events", getEvents);
router.post("/events", createEvent);
router.get("/events/:eventId", getEventDetails);
router.put("/events/:eventId", updateEvent);
router.delete("/events/:eventId", deleteEvent);

// ============ BOOKING MANAGEMENT ============
router.get("/bookings", getBookings);
router.put("/bookings/:bookingId/status", updateBookingStatus);

// ============ CONTACTS ============
router.get("/contacts", getContacts);
router.put("/contacts/:contactId/reply", replyContact);

// ============ USER EMAIL PREFERENCES ============
router.get("/email-preferences", getUsersEmailPreferences);

// ============ NOTIFICATIONS / EMAIL BLAST ============
router.post("/notifications/send", sendNotification);
router.get("/notifications", listNotifications);
router.get("/notifications/templates", listTemplates);
router.post("/notifications/templates", saveTemplate);

// ============ EXPORT DATA ============
router.get("/export/events", exportEventsData);
router.get("/export/bookings", exportBookingsData);

// ============ PUSH NOTIFICATIONS (FCM) ============
router.get("/fcm-devices", requireRoles("super_admin", "admin"), getFcmDevices);
router.get("/push-notification/health", requireRoles("super_admin", "admin"), getPushNotificationHealth);
router.post("/send-notification", requireRoles("super_admin", "admin"), pushNotificationLimiter, sendPushNotification);

export default router;

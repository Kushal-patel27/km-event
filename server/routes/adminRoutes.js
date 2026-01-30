import express from "express";
import { protect, requireAdminRole } from "../middleware/authMiddleware.js";
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
  getBookings,
  updateBookingStatus,
  getContacts,
  replyContact,
} from "../controllers/adminController.js";
import { sendNotification, listNotifications, listTemplates, saveTemplate } from "../controllers/notificationController.js";

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

// ============ BOOKING MANAGEMENT ============
router.get("/bookings", getBookings);
router.put("/bookings/:bookingId/status", updateBookingStatus);

// ============ CONTACTS ============
router.get("/contacts", getContacts);
router.put("/contacts/:contactId/reply", replyContact);

// ============ NOTIFICATIONS / EMAIL BLAST ============
router.post("/notifications/send", sendNotification);
router.get("/notifications", listNotifications);
router.get("/notifications/templates", listTemplates);
router.post("/notifications/templates", saveTemplate);

export default router;

import express from "express";
import { protect, requireEventAdmin, requireEventAccess } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  getAssignedEvents,
  getEventDetails,
  updateEvent,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  getEventBookings,
  getEventStats,
  downloadAttendeeList,
  assignStaff,
  removeStaff,
  searchStaff,
  getEntryLogs,
  createStaffForEvent,
} from "../controllers/eventAdminController.js";

const router = express.Router();

// All routes require authentication and event admin role
router.use(protect);
router.use(requireEventAdmin);

// Dashboard
router.get("/dashboard", getDashboard);

// Events
router.get("/events", getAssignedEvents);
router.get("/events/:eventId", requireEventAccess, getEventDetails);
router.put("/events/:eventId", requireEventAccess, updateEvent);
router.get("/events/:eventId/stats", requireEventAccess, getEventStats);

// Ticket Types
router.post("/events/:eventId/ticket-types", requireEventAccess, createTicketType);
router.put("/events/:eventId/ticket-types/:ticketTypeId", requireEventAccess, updateTicketType);
router.delete("/events/:eventId/ticket-types/:ticketTypeId", requireEventAccess, deleteTicketType);

// Bookings
router.get("/events/:eventId/bookings", requireEventAccess, getEventBookings);
router.get("/events/:eventId/attendees/download", requireEventAccess, downloadAttendeeList);

// Staff Management
router.get("/staff/search", searchStaff);
router.post("/events/:eventId/staff", requireEventAccess, assignStaff);
router.post("/events/:eventId/staff/new", requireEventAccess, createStaffForEvent);
router.delete("/events/:eventId/staff/:staffId", requireEventAccess, removeStaff);

// Entry Logs
router.get("/events/:eventId/entry-logs", requireEventAccess, getEntryLogs);

export default router;

import express from "express";
import { protect, requireRoles } from "../middleware/authMiddleware.js";
import * as staffController from "../controllers/staffController.js";

const router = express.Router();

// Middleware: Only staff (scanner) can access
router.use(protect);
router.use(requireRoles("staff", "staff_admin"));

// Scanning operations
router.post("/scan", staffController.scanTicket);
router.get("/ticket/:bookingId/status", staffController.getTicketStatus);
router.post("/manual-entry", staffController.requestManualEntry);

// Stats
router.get("/events/:eventId/stats", staffController.getGateStats);

// Assigned info
router.get("/info", staffController.getAssignedInfo);

export default router;

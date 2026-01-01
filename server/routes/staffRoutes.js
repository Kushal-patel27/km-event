import express from "express";
import { protect, requireRoles } from "../middleware/authMiddleware.js";
import {
  validateAndScanQR,
  getStaffEvents,
  getEventScanStats,
} from "../controllers/staffController.js";

const router = express.Router();

// Staff-only endpoints
router.post(
  "/scan",
  protect,
  requireRoles("staff_admin"),
  validateAndScanQR
);
router.get(
  "/events",
  protect,
  requireRoles("staff_admin"),
  getStaffEvents
);
router.get(
  "/stats/:eventId",
  protect,
  requireRoles("staff_admin"),
  getEventScanStats
);

export default router;

import express from "express";
import { protect, requireRoles } from "../middleware/authMiddleware.js";
import * as staffAdminController from "../controllers/staffAdminController.js";

const router = express.Router();

// Middleware: Only staff_admin can access
router.use(protect);
router.use(requireRoles("staff_admin"));

// Staff management
router.post("/staff", staffAdminController.createStaff);
router.get("/staff", staffAdminController.getStaffMembers);
router.put("/staff/:staffId", staffAdminController.updateStaff);
router.delete("/staff/:staffId", staffAdminController.deleteStaff);

// Entry stats
router.get("/events/:eventId/entries", staffAdminController.getEntryStats);
router.put("/entries/:logId/approve", staffAdminController.approveEntry);

// Dashboard
router.get("/dashboard", staffAdminController.getDashboardStats);

export default router;

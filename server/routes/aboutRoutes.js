import express from "express";
import {
  getAbout,
  updateAbout,
  getAboutStats,
} from "../controllers/aboutController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAbout); // Get about page content
router.get("/stats", getAboutStats); // Get stats

// Admin routes
router.put("/", protect, adminOnly, updateAbout); // Update about page

export default router;

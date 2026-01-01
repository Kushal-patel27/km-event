import express from "express";
import {
  submitContact,
  getContacts,
  getContact,
  replyContact,
  deleteContact,
  getUserMessages,
} from "../controllers/contactController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/", submitContact); // Submit contact form

// User routes (authenticated) - MUST come before /:id
router.get("/my", protect, getUserMessages); // Get user's own messages

// Admin routes
router.get("/", protect, adminOnly, getContacts); // Get all (admin only)
router.get("/:id", protect, adminOnly, getContact); // Get single
router.put("/:id", protect, adminOnly, replyContact); // Reply to contact
router.delete("/:id", protect, adminOnly, deleteContact); // Delete contact

export default router;

import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import {
  getPublicEventBySlug,
  getPublicEventByCode,
  getAllPublicEvents,
  getEventShareLinks,
  toggleEventPublicStatus
} from "../controllers/publicEventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (NO authentication required) - MUST be before generic /:id routes
router.get("/public", getAllPublicEvents);
router.get("/public/:slug", getPublicEventBySlug);
router.get("/code/:shortCode", getPublicEventByCode);

// Protected specific routes
router.post("/", protect, createEvent);
router.get("/my", protect, getMyEvents);
router.get("/:id/share-links", protect, getEventShareLinks);
router.patch("/:id/toggle-public", protect, toggleEventPublicStatus);

// Generic routes - MUST be after specific routes
router.get("/", getEvents);
router.put("/:id", protect, updateEvent);
router.get("/:id", getEventById);
router.delete("/:id", protect, deleteEvent);

export default router;

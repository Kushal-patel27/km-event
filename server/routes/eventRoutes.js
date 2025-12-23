import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, createEvent);
router.get("/my", protect, getMyEvents);   // 👈 FIRST
router.get("/", getEvents);
router.get("/:id", getEventById);          // 👈 LAST



export default router;

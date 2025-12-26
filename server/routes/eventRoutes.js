import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, createEvent);
router.get("/my", protect, getMyEvents);   // 👈 FIRST
router.get("/", getEvents);
router.put("/:id", protect, updateEvent);
router.get("/:id", getEventById);          // 👈 LAST
router.delete("/:id", protect, deleteEvent);



export default router;

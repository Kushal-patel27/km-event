import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createBooking, getMyBookings, getEventBookingsForOrganizer} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get(
  "/event/:eventId",
  protect,
  getEventBookingsForOrganizer
);

export default router;

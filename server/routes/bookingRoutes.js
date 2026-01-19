import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createBooking, getMyBookings, getEventBookingsForOrganizer, getAllBookings, deleteBooking, getBookedSeats, downloadTicketPDF } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get(
  "/event/:eventId",
  protect,
  getEventBookingsForOrganizer
);
router.get("/event/:eventId/seats", getBookedSeats); // Public endpoint to check seat availability
router.get("/:bookingId/ticket/:ticketIndex/pdf", protect, downloadTicketPDF); // Download ticket PDF

router.get('/all', protect, getAllBookings)
router.delete('/:id', protect, deleteBooking)

export default router;

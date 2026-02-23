import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createBooking, getMyBookings, getEventBookingsForOrganizer, getAllBookings, deleteBooking, getBookedSeats, downloadTicketPDF, getAdminAllBookings, searchBookingByBookingId, searchBookingsByUser, searchBookingByTicketId } from "../controllers/bookingController.js";

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

// Admin API endpoints
router.get("/admin/all-bookings", protect, getAdminAllBookings); // Get all bookings with pagination
router.get("/admin/search-booking", protect, searchBookingByBookingId); // Search by booking ID
router.get("/admin/search-ticket", protect, searchBookingByTicketId); // Search by ticket ID
router.get("/admin/search-user", protect, searchBookingsByUser); // Search by email/name

router.get('/all', protect, getAllBookings)
router.delete('/:id', protect, deleteBooking)

export default router;

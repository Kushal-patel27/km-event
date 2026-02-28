import express from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  handlePaymentFailure,
  initiateRefund,
} from "../controllers/paymentController.js";
import { protect, requireAdminRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (authenticated users)
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/failure", protect, handlePaymentFailure);
router.get("/my-payments", protect, getMyPayments);
router.get("/:paymentId", protect, getPaymentById);

// Admin routes
router.get("/", protect, requireAdminRole, getAllPayments);
router.post("/:paymentId/refund", protect, requireAdminRole, initiateRefund);

export default router;

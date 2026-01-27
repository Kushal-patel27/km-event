import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  processRefund
} from "../controllers/paymentController.js";

const router = express.Router();

// Create payment order
router.post("/order", protect, createOrder);

// Verify payment signature
router.post("/verify", protect, verifyPayment);

// Get payment status
router.get("/status/:bookingId", protect, getPaymentStatus);

// Process refund
router.post("/refund", protect, processRefund);

// Webhook endpoint (no authentication needed)
router.post("/webhook", handleWebhook);

export default router;

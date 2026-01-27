import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPaymentAnalytics,
  getPaymentReport,
  getRefundRequests,
  updateRefundStatus,
  getFailedPayments,
  retryPaymentVerification
} from "../controllers/analyticsController.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect);

// Payment analytics dashboard
router.get("/payments/analytics", getPaymentAnalytics);

// Payment report (JSON or CSV)
router.get("/payments/report", getPaymentReport);

// Refund management
router.get("/refunds", getRefundRequests);
router.patch("/refunds/:paymentId", updateRefundStatus);

// Failed payments
router.get("/payments/failed", getFailedPayments);

// Retry payment verification
router.post("/payments/:paymentId/retry-verification", retryPaymentVerification);

export default router;

import express from "express";
import { protect, requireAdminRole, requireEventAdmin } from "../middleware/authMiddleware.js";
import {
  // Admin routes
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getCouponStatistics,
  // Event Admin routes
  createEventCoupon,
  getEventAdminCoupons,
  updateEventAdminCoupon,
  deleteEventAdminCoupon,
  // Public/User routes
  validateCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

/**
 * ============ PUBLIC ROUTES (Authenticated Users) ============
 */

// Validate and get coupon details
router.post("/validate", protect, validateCoupon);

// Apply coupon to booking (after payment)
router.post("/apply", protect, applyCoupon);

/**
 * ============ ADMIN ROUTES ============
 */

// Get all coupons
router.get("/", protect, requireAdminRole, getAllCoupons);

// Create new coupon
router.post("/", protect, requireAdminRole, createCoupon);

// Get coupon by ID
router.get("/details/:couponId", protect, requireAdminRole, getCouponById);

// Update coupon
router.put("/:couponId", protect, requireAdminRole, updateCoupon);

// Delete coupon
router.delete("/:couponId", protect, requireAdminRole, deleteCoupon);

// Get coupon statistics
router.get("/:couponId/statistics", protect, requireAdminRole, getCouponStatistics);

/**
 * ============ EVENT ADMIN ROUTES ============
 */

// Get event admin's coupons
router.get("/event-admin/my-coupons", protect, requireEventAdmin, getEventAdminCoupons);

// Create event coupon
router.post("/event-admin/create", protect, requireEventAdmin, createEventCoupon);

// Update event admin coupon
router.put("/event-admin/:couponId", protect, requireEventAdmin, updateEventAdminCoupon);

// Delete event admin coupon
router.delete("/event-admin/:couponId", protect, requireEventAdmin, deleteEventAdminCoupon);

export default router;

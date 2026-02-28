import Coupon from "../models/Coupon.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

/**
 * ============ ADMIN COUPON MANAGEMENT ============
 */

/**
 * Create a new coupon (Admin only)
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      applicableEventIds,
      applicableCategories,
      isPublic,
      tags,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, discount value, and expiry date are required",
      });
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be 'percentage' or 'fixed'",
      });
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      expiryDate: new Date(expiryDate),
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      applicableEventIds: applicableEventIds || [],
      applicableCategories: applicableCategories || [],
      isPublic,
      createdBy: req.user._id,
      createdByRole: "admin",
      tags: tags || [],
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

/**
 * Get all coupons (Admin only)
 */
export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const coupons = await Coupon.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Coupons retrieved successfully",
      data: coupons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId).populate(
      "createdBy applicableEventIds",
      "name email title"
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon retrieved successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};

/**
 * Update coupon by ID (Admin only)
 */
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const {
      description,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      applicableEventIds,
      applicableCategories,
      isPublic,
      isActive,
      tags,
    } = req.body;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Allow updating specific fields
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = maxDiscountAmount;
    if (applicableEventIds !== undefined)
      coupon.applicableEventIds = applicableEventIds;
    if (applicableCategories !== undefined)
      coupon.applicableCategories = applicableCategories;
    if (isPublic !== undefined) coupon.isPublic = isPublic;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (tags !== undefined) coupon.tags = tags;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

/**
 * Delete coupon by ID (Admin only)
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

/**
 * ============ EVENT ADMIN COUPON MANAGEMENT ============
 */

/**
 * Create coupon for specific events (Event Admin only)
 */
export const createEventCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      eventIds,
      tags,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !expiryDate || !eventIds?.length) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount value, expiry date, and event IDs are required",
      });
    }

    // Verify all events belong to the event admin
    const events = await Event.find({
      _id: { $in: eventIds },
      organizer: req.user._id,
    });

    if (events.length !== eventIds.length) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create coupons for your own events",
      });
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      expiryDate: new Date(expiryDate),
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      applicableEventIds: eventIds,
      createdBy: req.user._id,
      createdByRole: "event_admin",
      eventAdminId: req.user._id,
      tags: tags || [],
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating event coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

/**
 * Get coupons for event admin
 */
export const getEventAdminCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { eventAdminId: req.user._id };

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const coupons = await Coupon.find(query)
      .populate("applicableEventIds", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Coupons retrieved successfully",
      data: coupons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

/**
 * Update event admin coupon
 */
export const updateEventAdminCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const {
      description,
      discountType,
      discountValue,
      expiryDate,
      usageLimit,
      minOrderAmount,
      maxDiscountAmount,
      eventIds,
      isActive,
      tags,
    } = req.body;

    const coupon = await Coupon.findOne({
      _id: couponId,
      eventAdminId: req.user._id,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or access denied",
      });
    }

    // Verify events if provided
    if (eventIds && eventIds.length > 0) {
      const events = await Event.find({
        _id: { $in: eventIds },
        organizer: req.user._id,
      });

      if (events.length !== eventIds.length) {
        return res.status(403).json({
          success: false,
          message: "You can only assign coupons to your own events",
        });
      }

      coupon.applicableEventIds = eventIds;
    }

    // Update fields
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = maxDiscountAmount;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (tags !== undefined) coupon.tags = tags;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

/**
 * Delete event admin coupon
 */
export const deleteEventAdminCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findOneAndDelete({
      _id: couponId,
      eventAdminId: req.user._id,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found or access denied",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

/**
 * ============ COUPON VALIDATION & USAGE ============
 */

/**
 * Validate and get coupon details (Public - authenticated users)
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code, eventId, subtotal } = req.body;

    if (!code || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and event ID are required",
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check if coupon is valid
    if (!coupon.canBeUsed()) {
      let reason = "Coupon cannot be used";

      if (coupon.isExpired) {
        reason = "Coupon has expired";
      } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        reason = "Coupon usage limit reached";
      } else if (!coupon.isActive) {
        reason = "Coupon is inactive";
      }

      return res.status(400).json({
        success: false,
        message: reason,
      });
    }

    // Check if coupon applies to this event
    if (
      coupon.applicableEventIds &&
      coupon.applicableEventIds.length > 0 &&
      !coupon.applicableEventIds.includes(eventId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not applicable to this event",
      });
    }

    // Check minimum order amount
    if (subtotal && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      });
    }

    // Calculate discount
    const discountAmount = subtotal ? coupon.calculateDiscount(subtotal) : 0;

    res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        currency: coupon.currency,
        description: coupon.description || `Get ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '₹'} off`,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};

/**
 * Apply coupon to booking (called after successful payment)
 */
export const applyCoupon = async (req, res) => {
  try {
    const { couponId, bookingId } = req.body;

    if (!couponId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID and booking ID are required",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Use coupon
    await coupon.use(req.user._id, bookingId);

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        couponId: coupon._id,
        code: coupon.code,
        usageCount: coupon.usageCount,
        remainingUsages:
          coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : "Unlimited",
      },
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: error.message,
    });
  }
};

/**
 * Get coupon statistics (Admin only)
 */
export const getCouponStatistics = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon statistics retrieved successfully",
      data: {
        code: coupon.code,
        totalUsages: coupon.usageCount,
        usageLimit: coupon.usageLimit || "Unlimited",
        remainingUsages: coupon.usageLimit
          ? coupon.usageLimit - coupon.usageCount
          : "Unlimited",
        isValid: coupon.isValid,
        isExpired: coupon.isExpired,
        expiryDate: coupon.expiryDate,
        usedByUsers: coupon.usedByUsers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching coupon statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupon statistics",
      error: error.message,
    });
  }
};

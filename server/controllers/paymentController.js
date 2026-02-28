import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import OrganizerSubscription from "../models/OrganizerSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order for payment
 * Supports both event booking and subscription payments
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, paymentType, referenceId, metadata, coupon } = req.body;

    // Validate required fields
    if (!amount || !paymentType || !referenceId) {
      return res.status(400).json({
        success: false,
        message: "Amount, payment type, and reference ID are required",
      });
    }

    // Validate payment type
    if (!["event", "subscription"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type. Must be 'event' or 'subscription'",
      });
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least ₹1",
      });
    }

    // Verify the reference exists
    if (paymentType === "event") {
      const event = await Event.findById(metadata?.eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }
    } else if (paymentType === "subscription") {
      const plan = await SubscriptionPlan.findById(metadata?.planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Subscription plan not found",
        });
      }
    }

    // Create Razorpay-safe receipt (max 40 chars)
    const sanitizedReferenceId = String(referenceId)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 20);
    const shortTimestamp = Date.now().toString(36);
    const shortRandom = crypto.randomBytes(2).toString("hex");
    const receipt = `${paymentType.slice(0, 1)}_${sanitizedReferenceId}_${shortTimestamp}_${shortRandom}`.slice(0, 40);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        paymentType,
        referenceId,
        userId: req.user._id.toString(),
        ...metadata,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create payment record in database
    const payment = new Payment({
      userId: req.user._id,
      amount: amount,
      currency: "INR",
      orderId: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      status: "created",
      paymentType,
      referenceId,
      metadata: metadata || {},
      // Store coupon information if provided
      ...(coupon && {
        coupon: {
          couponId: coupon.couponId,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: coupon.discountAmount,
        },
        originalAmount: metadata?.subtotal || amount + coupon.discountAmount,
        discountedAmount: amount,
      }),
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentId: payment._id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

/**
 * Verify payment signature and update payment status
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      $or: [
        { _id: paymentId },
        { orderId: razorpay_order_id },
        { razorpayOrderId: razorpay_order_id },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Mark payment as failed
      await payment.markAsFailed("SIGNATURE_MISMATCH", "Invalid payment signature");
      
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Mark payment as paid
    await payment.markAsPaid(razorpay_payment_id, razorpay_signature);

    // Handle post-payment actions based on payment type
    let result = {};

    if (payment.paymentType === "event") {
      // Update or create booking
      result = await handleEventPaymentSuccess(payment);
    } else if (payment.paymentType === "subscription") {
      // Update or create subscription
      result = await handleSubscriptionPaymentSuccess(payment);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentId: payment._id,
        status: payment.status,
        ...result,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

/**
 * Handle successful event booking payment
 */
async function handleEventPaymentSuccess(payment) {
  try {
    // Check if booking already exists for this payment
    const existingBooking = await Booking.findOne({
      _id: payment.referenceId,
    });

    if (existingBooking) {
      // Update existing booking payment status
      existingBooking.paymentStatus = "completed";
      await existingBooking.save();

      return {
        bookingId: existingBooking._id,
        bookingNumber: existingBooking.bookingId,
      };
    }

    return {
      message: "Booking will be created after payment confirmation",
    };
  } catch (error) {
    console.error("Error handling event payment success:", error);
    throw error;
  }
}

/**
 * Handle successful subscription payment
 */
async function handleSubscriptionPaymentSuccess(payment) {
  try {
    const plan = await SubscriptionPlan.findById(payment.metadata.planId);
    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    // Check if subscription already exists
    let subscription = await OrganizerSubscription.findOne({
      organizer: payment.userId,
    });

    if (subscription) {
      // Update existing subscription
      subscription.plan = plan._id;
      subscription.status = "active";
      subscription.currentCommissionPercentage = plan.commissionPercentage;
      subscription.subscribedAt = new Date();
      subscription.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new OrganizerSubscription({
        organizer: payment.userId,
        plan: plan._id,
        status: "active",
        currentCommissionPercentage: plan.commissionPercentage,
        subscribedAt: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await subscription.save();
    }

    // Note: User role upgrade to event_admin happens when their event request is approved
    // by an admin, not automatically upon subscription payment. This ensures proper review.

    return {
      subscriptionId: subscription._id,
      planName: plan.name,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Error handling subscription payment success:", error);
    throw error;
  }
}

/**
 * Get payment details by ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("userId", "name email")
      .populate("metadata.eventId", "title")
      .populate("metadata.planId", "name");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user has access to this payment
    if (payment.userId._id.toString() !== req.user._id.toString() && !["super_admin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

/**
 * Get all payments for current user
 */
export const getMyPayments = async (req, res) => {
  try {
    const { status, paymentType, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate("metadata.eventId", "title")
      .populate("metadata.planId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

/**
 * Get all payments (Admin only)
 */
export const getAllPayments = async (req, res) => {
  try {
    const { status, paymentType, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate("userId", "name email")
      .populate("metadata.eventId", "title")
      .populate("metadata.planId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Calculate statistics
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: payments,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, errorCode, errorDescription } = req.body;

    const payment = await Payment.findOne({
      $or: [{ orderId }, { razorpayOrderId: orderId }],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    await payment.markAsFailed(errorCode, errorDescription);

    res.json({
      success: true,
      message: "Payment failure recorded",
      data: {
        paymentId: payment._id,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment failure",
      error: error.message,
    });
  }
};

/**
 * Initiate refund for a payment
 */
export const initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only successful payments can be refunded",
      });
    }

    // Initiate refund with Razorpay
    const refundAmount = amount || payment.amount;
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      notes: {
        reason: reason || "Refund requested",
      },
    });

    // Update payment record
    await payment.markAsRefunded(refund.id, refundAmount, reason);

    res.json({
      success: true,
      message: "Refund initiated successfully",
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error initiating refund:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate refund",
      error: error.message,
    });
  }
};

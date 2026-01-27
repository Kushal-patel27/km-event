import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Generate unique receipt number
function generateReceiptNumber() {
  return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID required" });
    }

    // Ensure keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment keys not configured" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate("event");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify booking belongs to authenticated user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Prevent duplicate orders
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      status: { $in: ["created", "authorized", "captured"] }
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "Active payment already exists for this booking",
        orderId: existingPayment.razorpayOrderId,
        receipt: existingPayment.orderId
      });
    }

    const receiptNumber = generateReceiptNumber();

    // Derive amount robustly
    const derivedUnitPrice = Number.isFinite(Number(booking?.ticketType?.price))
      ? Number(booking.ticketType.price)
      : Number.isFinite(Number(booking?.event?.price))
        ? Number(booking.event.price)
        : null;

    const resolvedAmount = Number.isFinite(Number(booking?.totalAmount))
      ? Number(booking.totalAmount)
      : derivedUnitPrice != null
        ? derivedUnitPrice * (booking.quantity || 1)
        : null;

    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const amountInPaise = Math.round(resolvedAmount * 100); // Razorpay expects amount in paise

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptNumber,
      notes: {
        bookingId: bookingId,
        userId: req.user._id.toString(),
        eventId: booking.event._id.toString(),
        eventTitle: booking.event.title,
        userName: booking.user.name,
        userEmail: booking.user.email
      }
    });

    // Save payment record
    const payment = new Payment({
      orderId: receiptNumber,
      razorpayOrderId: razorpayOrder.id,
      user: req.user._id,
      booking: bookingId,
      event: booking.event._id,
      amount: resolvedAmount,
      currency: "INR",
      status: "created",
      receipt: receiptNumber,
      notes: {
        eventTitle: booking.event.title,
        quantity: booking.quantity.toString()
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        sessionId: req.sessionID
      }
    });

    await payment.save();

    // Update booking with order info
    booking.payment = {
      razorpayOrderId: razorpayOrder.id,
      method: "razorpay"
    };
    await booking.save();

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      bookingId: bookingId,
      user: {
        name: booking.user.name,
        email: booking.user.email,
        contact: booking.user.phone || ""
      }
    });
  } catch (error) {
    const detail = error?.error?.description || error?.message || "Failed to create payment order";
    const isAuthFail = detail.toLowerCase().includes("authentication failed") || error?.statusCode === 401;
    if (isAuthFail) {
      console.error("[Razorpay] Authentication failed. Check RAZORPAY_KEY_ID/SECRET.", {
        keyIdPreview: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.slice(0,4)}****` : "missing"
      });
      return res.status(500).json({
        message: "Failed to create payment order",
        error: "Razorpay authentication failed. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test vs live) and restart the server."
      });
    }

    console.error("Order creation error:", error?.error || error?.message || error);
    res.status(500).json({
      message: "Failed to create payment order",
      error: detail
    });
  }
};

// Verify Payment Signature
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Verify signature
    const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      payment.status = "failed";
      payment.errorCode = "INVALID_SIGNATURE";
      payment.errorDescription = "Payment signature verification failed";
      payment.verificationAttempts += 1;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

    // Check if payment is captured/authorized
    if (razorpayPayment.status !== "captured" && razorpayPayment.status !== "authorized") {
      payment.status = "failed";
      payment.errorCode = razorpayPayment.error_code || "PAYMENT_NOT_CAPTURED";
      payment.errorDescription = razorpayPayment.error_description || "Payment not captured";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment not captured"
      });
    }

    // Update payment record
    payment.paymentId = razorpayPaymentId;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "captured";
    payment.lastVerificationAt = new Date();
    payment.verificationAttempts += 1;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate("event");

    if (booking) {
      booking.payment = {
        paymentId: payment._id,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        method: "razorpay",
        paidAt: new Date(),
        receiptNumber: payment.receipt
      };
      booking.paymentStatus = "Confirmed";
      booking.status = "Confirmed";
      await booking.save();

      // Generate QR codes and tickets
      const generateQR = (await import("../utils/generateQR.js")).default;
      
      if (!booking.ticketIds || booking.ticketIds.length === 0) {
        const ticketIds = [];
        const qrCodes = [];

        for (let i = 0; i < booking.quantity; i++) {
          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let ticketId = '';
          const randomBytes = crypto.randomBytes(4);
          for (let j = 0; j < 8; j++) {
            ticketId += chars[randomBytes[j % 4] % chars.length];
          }
          ticketIds.push(ticketId);

          // Generate QR code
          const qrImage = await generateQR(`${ticketId}-${bookingId}`);
          qrCodes.push({
            id: ticketId,
            image: qrImage
          });
        }

        booking.ticketIds = ticketIds;
        booking.qrCodes = qrCodes;
        await booking.save();
      }

      // Send confirmation email
      try {
        const emailService = await import("../utils/emailService.js");
        await emailService.sendBookingConfirmation({
          user: booking.user,
          booking,
          event: booking.event,
          paymentId: razorpayPaymentId
        });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Don't fail the payment if email fails
      }
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        razorpayPaymentId,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
};

// Webhook handler for Razorpay events
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.get("x-razorpay-signature");
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different event types
    switch (event) {
      case "payment.authorized":
      case "payment.captured":
        await handlePaymentCaptured(payload.payment);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload.payment);
        break;

      case "refund.created":
      case "refund.processed":
        await handleRefund(payload.refund);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(500).json({ error: error.message });
  }
};

async function handlePaymentCaptured(paymentData) {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: paymentData.id
    });

    if (!payment) {
      console.log(`Payment record not found for ${paymentData.id}`);
      return;
    }

    // Prevent duplicate processing
    if (payment.webhookProcessed) {
      console.log(`Webhook already processed for ${paymentData.id}`);
      return;
    }

    payment.status = "captured";
    payment.webhookProcessed = true;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = "Confirmed";
      booking.status = "Confirmed";
      await booking.save();
    }
  } catch (error) {
    console.error("Error handling payment captured webhook:", error);
  }
}

async function handlePaymentFailed(paymentData) {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: paymentData.id
    });

    if (!payment) return;

    payment.status = "failed";
    payment.errorCode = paymentData.error_code;
    payment.errorDescription = paymentData.error_description;
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = "Failed";
      await booking.save();
    }
  } catch (error) {
    console.error("Error handling payment failed webhook:", error);
  }
}

async function handleRefund(refundData) {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: refundData.payment_id
    });

    if (!payment) return;

    payment.refund = {
      refundId: refundData.id,
      amount: refundData.amount / 100,
      status: refundData.status === "processed" ? "processed" : "pending",
      processedAt: new Date()
    };
    payment.status = "refunded";
    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = "Refunded";
      booking.cancellationStatus.refundStatus = "Processed";
      booking.cancellationStatus.refundedAt = new Date();
      await booking.save();
    }
  } catch (error) {
    console.error("Error handling refund webhook:", error);
  }
}

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({
      booking: bookingId
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        razorpayPaymentId: payment.razorpayPaymentId,
        paidAt: payment.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify authorization
    if (booking.user.toString() !== req.user._id.toString() && 
        !req.user.role.includes("admin")) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const payment = await Payment.findOne({ booking: bookingId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!payment.razorpayPaymentId) {
      return res.status(400).json({ message: "No valid payment to refund" });
    }

    // Create refund
    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(payment.amount * 100),
        notes: {
          bookingId: bookingId,
          reason: "User requested refund"
        }
      });

      payment.refund = {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: "pending",
        reason: "User requested refund",
        requestedAt: new Date()
      };
      await payment.save();

      booking.paymentStatus = "Refunded";
      booking.cancellationStatus.isCancelled = true;
      booking.cancellationStatus.refundStatus = "Processed";
      await booking.save();

      res.json({
        success: true,
        message: "Refund initiated successfully",
        refundId: refund.id
      });
    } catch (razorpayError) {
      return res.status(400).json({
        message: "Refund processing failed",
        error: razorpayError.message
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

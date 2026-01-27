import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "refunded", "failed", "cancelled"],
      default: "created"
    },
    method: {
      type: String,
      default: "razorpay"
    },
    description: String,
    receipt: String,
    notes: {
      type: Map,
      of: String
    },
    // Razorpay specific fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    
    // Refund info
    refund: {
      refundId: String,
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "processed", "failed"],
        default: "pending"
      },
      reason: String,
      requestedAt: Date,
      processedAt: Date
    },

    // Webhook handling
    webhookId: String,
    webhookProcessed: {
      type: Boolean,
      default: false
    },
    webhookAttempts: {
      type: Number,
      default: 0
    },

    // Error tracking
    failureReason: String,
    errorCode: String,
    errorDescription: String,

    // Payment verification
    verificationAttempts: {
      type: Number,
      default: 0
    },
    lastVerificationAt: Date,
    nextRetryAt: Date,

    metadata: {
      ipAddress: String,
      userAgent: String,
      sessionId: String
    }
  },
  { timestamps: true, indexes: [{ orderId: 1 }, { user: 1 }, { status: 1 }] }
);

export default mongoose.model("Payment", paymentSchema);

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    paymentId: {
      type: String,
      default: null,
      index: true
    },
    signature: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true
    },
    paymentType: {
      type: String,
      enum: ["event", "subscription"],
      required: true,
      index: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    // Additional metadata
    metadata: {
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
      eventName: { type: String },
      quantity: { type: Number },
      ticketType: { type: String },
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
      planName: { type: String }
    },
    // Coupon details
    coupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      code: { type: String },
      discountType: { type: String, enum: ["percentage", "fixed"] },
      discountValue: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 }
    },
    originalAmount: {
      type: Number,
      default: null
    },
    discountedAmount: {
      type: Number,
      default: null
    },
    // Razorpay specific details
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String
    },
    razorpaySignature: {
      type: String
    },
    // Error details if payment fails
    errorCode: {
      type: String
    },
    errorDescription: {
      type: String
    },
    // Refund details
    refundId: {
      type: String
    },
    refundAmount: {
      type: Number
    },
    refundedAt: {
      type: Date
    },
    refundReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ paymentType: 1, referenceId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for checking if payment is successful
paymentSchema.virtual("isSuccessful").get(function () {
  return this.status === "paid";
});

// Method to mark payment as paid
paymentSchema.methods.markAsPaid = function (paymentId, signature) {
  this.status = "paid";
  this.paymentId = paymentId;
  this.razorpayPaymentId = paymentId;
  this.signature = signature;
  this.razorpaySignature = signature;
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function (errorCode, errorDescription) {
  this.status = "failed";
  this.errorCode = errorCode;
  this.errorDescription = errorDescription;
  return this.save();
};

// Method to mark payment as refunded
paymentSchema.methods.markAsRefunded = function (refundId, refundAmount, reason) {
  this.status = "refunded";
  this.refundId = refundId;
  this.refundAmount = refundAmount;
  this.refundedAt = new Date();
  this.refundReason = reason;
  return this.save();
};

export default mongoose.model("Payment", paymentSchema);

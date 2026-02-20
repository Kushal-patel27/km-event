import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    commissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission"
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    commissionCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "reversed"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "cheque", "wallet"],
      required: true
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountType: String
    },
    transactionId: String,
    failureReason: String,
    notes: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
payoutSchema.index({ organizer: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ status: 1 });

export default mongoose.model("Payout", payoutSchema);

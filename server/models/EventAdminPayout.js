import mongoose from "mongoose";

const eventAdminPayoutSchema = new mongoose.Schema(
  {
    eventAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eventIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event"
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    commissionCount: {
      type: Number,
      default: 0
    },
    ticketCount: {
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
    upiId: String,
    walletId: String,
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

eventAdminPayoutSchema.index({ eventAdmin: 1, status: 1 });
eventAdminPayoutSchema.index({ createdAt: -1 });
eventAdminPayoutSchema.index({ status: 1 });

export default mongoose.model("EventAdminPayout", eventAdminPayoutSchema);

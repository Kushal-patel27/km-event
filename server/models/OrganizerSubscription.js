import mongoose from "mongoose";

const organizerSubscriptionSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "cancelled"],
      default: "active"
    },
    currentCommissionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    renewalDate: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancelReason: {
      type: String
    },
    notes: {
      type: String
    },
    // Statistics
    totalTicketsSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalCommissionDeducted: {
      type: Number,
      default: 0
    },
    totalNetPayout: {
      type: Number,
      default: 0
    },
    totalPaidOut: {
      type: Number,
      default: 0
    },
    pendingPayout: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Indexes for quick lookups
// Note: 'organizer' already has unique index, no need to add another
organizerSubscriptionSchema.index({ plan: 1 });
organizerSubscriptionSchema.index({ status: 1 });

export default mongoose.model("OrganizerSubscription", organizerSubscriptionSchema);

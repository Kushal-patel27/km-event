import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    commissionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0
    },
    organizerAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["pending", "allocated", "processed", "paid"],
      default: "pending"
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout"
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "upi", "bank_transfer", "wallet"],
      default: "credit_card"
    },
    notes: String,
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

// Indexes for efficient queries
commissionSchema.index({ organizer: 1, status: 1 });
commissionSchema.index({ event: 1 });
commissionSchema.index({ booking: 1 });
commissionSchema.index({ createdAt: -1 });
commissionSchema.index({ payoutId: 1 });

// Calculate totals
commissionSchema.pre("save", function() {
  if (this.isNew || this.isModified("ticketPrice") || this.isModified("quantity") || this.isModified("commissionPercentage")) {
    this.subtotal = this.ticketPrice * this.quantity;
    this.commissionAmount = (this.subtotal * this.commissionPercentage) / 100;
    this.organizerAmount = this.subtotal - this.commissionAmount;
    this.platformAmount = this.commissionAmount;
  }
});

export default mongoose.model("Commission", commissionSchema);

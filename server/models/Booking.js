import mongoose from "mongoose";


const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketType: {
      name: { type: String },
      price: { type: Number },
      description: { type: String }
    },
    quantity: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    seats: [{ type: Number }], // Array of selected seat numbers (e.g., [1, 2, 3])
    ticketIds: [{ type: String, unique: true }], // Unique ticket IDs for each ticket in booking
    qrCode: { type: String }, // legacy single QR image (now contains booking ID)
    qrCodes: [
      {
        id: { type: String },
        image: { type: String }
      }
    ],
    status: {
      type: String,
      default: "confirmed",
    },
    scans: [
      {
        scannedAt: { type: Date, default: Date.now },
        scannedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        ticketIndex: { type: Number },
        ticketId: { type: String }, // Link to specific ticket ID
        deviceInfo: { type: String }
      }
    ],
    lastScannedAt: { type: Date },
    // Commission and Payout Fields
    commission: {
      commissionPercentage: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 },
      organizerAmount: { type: Number, default: 0 },
      platformAmount: { type: Number, default: 0 }
    },
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission"
    },
    // Coupon tracking
    coupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon"
      },
      code: String,
      discountType: {
        type: String,
        enum: ["percentage", "fixed"]
      },
      discountValue: Number,
      discountAmount: { type: Number, default: 0 },
      appliedAt: { type: Date }
    },
    originalAmount: { type: Number }, // Amount before discount
    discountAmount: { type: Number, default: 0 }, // Total discount applied
    finalAmount: { type: Number } // Final amount after discount (should equal totalAmount if coupon applied)
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);

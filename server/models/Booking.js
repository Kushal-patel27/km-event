import mongoose from "mongoose";


const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    ticketIds: [{ type: String, unique: true }], // Unique ticket IDs for each ticket in booking
    qrCode: { type: String }, // legacy single QR image
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
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);

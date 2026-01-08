import mongoose from "mongoose";

const entryLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Staff who scanned
    gate: { type: String }, // Gate/Zone name
    scanMethod: { type: String, enum: ["qr_code", "booking_id", "manual"], default: "qr_code" },
    ticketStatus: { type: String, enum: ["valid", "used", "cancelled", "invalid"], default: "valid" },
    scannedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff Admin who approved
    notes: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Index for quick lookups
entryLogSchema.index({ event: 1, scannedAt: -1 });
entryLogSchema.index({ booking: 1 });
entryLogSchema.index({ staff: 1, scannedAt: -1 });

export default mongoose.model("EntryLog", entryLogSchema);

import mongoose from "mongoose";

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["EMAIL", "PHONE", "2FA_SETUP"], required: true },
    code: { type: String, required: true }, // Hashed OTP
    newValue: { type: String }, // New email/phone being verified
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ userId: 1, type: 1 });
verificationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("VerificationRequest", verificationRequestSchema);

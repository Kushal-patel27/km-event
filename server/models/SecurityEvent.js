import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String },
    type: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model("SecurityEvent", securityEventSchema);

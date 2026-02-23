import mongoose from "mongoose";

const settingsAuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "EMAIL_CHANGED", "PASSWORD_CHANGED", "2FA_ENABLED"
    category: { type: String, required: true }, // "ACCOUNT", "SECURITY", "NOTIFICATIONS", etc.
    details: { type: mongoose.Schema.Types.Mixed }, // Additional metadata
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

settingsAuditLogSchema.index({ userId: 1, timestamp: -1 });
settingsAuditLogSchema.index({ action: 1 });

export default mongoose.model("SettingsAuditLog", settingsAuditLogSchema);

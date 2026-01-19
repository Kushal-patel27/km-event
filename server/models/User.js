import mongoose from "mongoose";

const ADMIN_ROLES = ["super_admin", "event_admin", "staff_admin", "admin"];

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for OAuth users
    googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
    role: {
      type: String,
      enum: ["user", "staff", ...ADMIN_ROLES],
      default: "user",
    },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], // Events assigned to event_admin/staff_admin/staff
    assignedGates: [{ type: String }], // Gate/Zone names for staff (e.g., ["Gate A", "Gate B"])
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff Admin who assigned this staff
    sessions: [sessionSchema],
    lastLoginAt: { type: Date },
    preferences: {
      emailUpdates: { type: Boolean, default: true },
      bookingReminders: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
    },
    passwordReset: {
      otpHash: { type: String },
      otpExpiresAt: { type: Date },
      otpAttempts: { type: Number, default: 0 },
      otpLastSentAt: { type: Date },
      otpRequestCount: { type: Number, default: 0 },
      otpWindowStartedAt: { type: Date },
      resetTokenHash: { type: String },
      resetTokenExpiresAt: { type: Date },
      lockedUntil: { type: Date },
      otpVerifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);

export default mongoose.model("User", userSchema);

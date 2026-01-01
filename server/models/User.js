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
      enum: ["user", "organizer", ...ADMIN_ROLES],
      default: "user",
    },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], // Events assigned to event_admin/staff_admin
    sessions: [sessionSchema],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);

export default mongoose.model("User", userSchema);

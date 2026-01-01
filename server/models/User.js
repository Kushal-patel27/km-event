import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    preferences: {
      emailUpdates: { type: Boolean, default: true },
      bookingReminders: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
    messageType: { type: String, enum: ["offer", "announcement", "update", "custom"], default: "custom" },
    recipientType: { type: String, enum: ["all", "registered", "participants", "staff"], required: true },
    dedupKey: { type: String, index: true },
    sentCount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    admin: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      email: { type: String }
    },
    error: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);

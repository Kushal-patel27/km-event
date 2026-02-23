import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
    messageType: { type: String, enum: ["offer", "announcement", "update", "custom"], default: "custom" },
    createdBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      email: { type: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model("NotificationTemplate", notificationTemplateSchema);

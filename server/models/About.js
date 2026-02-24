import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
  {
    mission: { type: String, required: true },
    description: { type: String, required: true },
    vision: { type: String, default: "" },
    values: [{ type: String }],
    team: [
      {
        name: { type: String },
        role: { type: String },
        image: { type: String },
      },
    ],
    stats: {
      activeUsers: { type: Number, default: 10000 },
      eventsListed: { type: Number, default: 500 },
      ticketsSold: { type: Number, default: 50000 },
      satisfactionRate: { type: Number, default: 98 },
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    contactInfo: {
      email: { type: String, default: "k.m.easyevents@gmail.com" },
      phone: { type: String, default: "+91 95686-98796" },
      address: { type: String, default: "123 Event Street, New York, NY 10001" },
      businessHours: { type: String, default: "Monday - Friday: 9:00 AM - 6:00 PM" },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("About", aboutSchema);

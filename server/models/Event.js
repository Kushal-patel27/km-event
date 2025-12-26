import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    price: { type: Number, default: 0 },
    image: { type: String },
    totalTickets: { type: Number, required: true },
    availableTickets: { type: Number, required: true },
    category: { type: String },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);

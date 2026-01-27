import mongoose from "mongoose";

const weatherSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    feelsLike: {
      type: Number,
    },
    humidity: {
      type: Number,
    },
    windSpeed: {
      type: Number,
    },
    weatherCondition: {
      type: String,
      required: true,
      enum: [
        "Clear",
        "Clouds",
        "Rain",
        "Drizzle",
        "Thunderstorm",
        "Snow",
        "Mist",
        "Smoke",
        "Haze",
        "Dust",
        "Fog",
        "Sand",
        "Ash",
        "Squall",
        "Tornado",
      ],
    },
    weatherDescription: {
      type: String,
    },
    visibility: {
      type: Number, // in meters
    },
    uvIndex: {
      type: Number,
    },
    rainfall: {
      type: Number, // in mm
    },
    snow: {
      type: Number, // in mm
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationType: {
      type: String,
      enum: ["none", "warning", "caution", "info"],
      default: "none",
    },
    notificationMessage: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    forecast: [
      {
        date: Date,
        temperature: Number,
        condition: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Weather", weatherSchema);

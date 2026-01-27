import mongoose from "mongoose";

/**
 * Weather Alert Log Schema
 * Stores history of all weather alerts sent
 */
const weatherAlertLogSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    alertType: {
      type: String,
      enum: ["warning", "caution", "info"],
      required: true,
    },
    weatherCondition: {
      type: String,
      required: true,
    },
    weatherData: {
      temperature: Number,
      feelsLike: Number,
      humidity: Number,
      windSpeed: Number,
      rainfall: Number,
      description: String,
    },
    message: {
      type: String,
      required: true,
    },
    // Notification delivery status
    notifications: {
      email: {
        sent: {
          type: Number,
          default: 0,
        },
        failed: {
          type: Number,
          default: 0,
        },
        recipients: [
          {
            email: String,
            role: String,
            status: {
              type: String,
              enum: ["sent", "failed", "pending"],
              default: "pending",
            },
            sentAt: Date,
            error: String,
          },
        ],
      },
      sms: {
        sent: {
          type: Number,
          default: 0,
        },
        failed: {
          type: Number,
          default: 0,
        },
        recipients: [
          {
            phone: String,
            role: String,
            status: {
              type: String,
              enum: ["sent", "failed", "pending"],
              default: "pending",
            },
            sentAt: Date,
            error: String,
          },
        ],
      },
      whatsapp: {
        sent: {
          type: Number,
          default: 0,
        },
        failed: {
          type: Number,
          default: 0,
        },
        recipients: [
          {
            phone: String,
            role: String,
            status: {
              type: String,
              enum: ["sent", "failed", "pending"],
              default: "pending",
            },
            sentAt: Date,
            error: String,
          },
        ],
      },
    },
    // Automation actions taken
    automationActions: [
      {
        action: {
          type: String,
          enum: ["markOnHold", "markDelayed", "markCancelled", "restrictEntry"],
        },
        executed: {
          type: Boolean,
          default: false,
        },
        executedAt: Date,
        executedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requiresApproval: {
          type: Boolean,
          default: false,
        },
        approved: {
          type: Boolean,
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        approvedAt: Date,
      },
    ],
    // Alert metadata
    triggeredBy: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    triggeredByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: Date,
  },
  { timestamps: true }
);

// Indexes
weatherAlertLogSchema.index({ event: 1, createdAt: -1 });
weatherAlertLogSchema.index({ alertType: 1 });
weatherAlertLogSchema.index({ acknowledged: 1 });
weatherAlertLogSchema.index({ createdAt: -1 });

export default mongoose.model("WeatherAlertLog", weatherAlertLogSchema);

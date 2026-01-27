import mongoose from "mongoose";

/**
 * Weather Alert Configuration Schema
 * Stores per-event weather alert rules and thresholds
 */
const weatherAlertConfigSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Alert thresholds
    thresholds: {
      temperature: {
        min: {
          type: Number,
          default: 0, // °C
          description: "Alert if temperature drops below this",
        },
        max: {
          type: Number,
          default: 40, // °C
          description: "Alert if temperature exceeds this",
        },
      },
      rainfall: {
        type: Number,
        default: 10, // mm
        description: "Alert if rainfall exceeds this",
      },
      windSpeed: {
        type: Number,
        default: 50, // km/h
        description: "Alert if wind speed exceeds this",
      },
      humidity: {
        type: Number,
        default: 90, // %
        description: "Alert if humidity exceeds this",
      },
    },
    // Weather conditions that trigger alerts
    alertConditions: {
      thunderstorm: {
        type: Boolean,
        default: true,
      },
      heavyRain: {
        type: Boolean,
        default: true,
      },
      snow: {
        type: Boolean,
        default: true,
      },
      extremeHeat: {
        type: Boolean,
        default: true,
      },
      fog: {
        type: Boolean,
        default: false,
      },
      tornado: {
        type: Boolean,
        default: true,
      },
    },
    // Notification settings
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        recipients: {
          superAdmin: {
            type: Boolean,
            default: true,
          },
          eventAdmin: {
            type: Boolean,
            default: true,
          },
          staff: {
            type: Boolean,
            default: true,
          },
          attendees: {
            type: Boolean,
            default: false, // Only enable when critical
          },
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        recipients: {
          superAdmin: {
            type: Boolean,
            default: true,
          },
          eventAdmin: {
            type: Boolean,
            default: true,
          },
          staff: {
            type: Boolean,
            default: false,
          },
          attendees: {
            type: Boolean,
            default: false,
          },
        },
      },
      whatsapp: {
        enabled: {
          type: Boolean,
          default: false,
        },
        recipients: {
          superAdmin: {
            type: Boolean,
            default: false,
          },
          eventAdmin: {
            type: Boolean,
            default: false,
          },
          staff: {
            type: Boolean,
            default: false,
          },
          attendees: {
            type: Boolean,
            default: false,
          },
        },
      },
    },
    // Alert message template
    alertTemplate: {
      type: String,
      default:
        "⚠️ Weather Alert for {eventName}: {weatherCondition}. Temperature: {temperature}°C. Please take necessary precautions.",
    },
    // Automation actions
    automation: {
      enabled: {
        type: Boolean,
        default: false,
      },
      actions: {
        markOnHold: {
          enabled: {
            type: Boolean,
            default: false,
          },
          threshold: {
            type: String,
            enum: ["warning", "caution"],
            default: "warning",
          },
        },
        markDelayed: {
          enabled: {
            type: Boolean,
            default: false,
          },
          threshold: {
            type: String,
            enum: ["warning", "caution"],
            default: "warning",
          },
        },
        markCancelled: {
          enabled: {
            type: Boolean,
            default: false,
          },
          threshold: {
            type: String,
            enum: ["warning"],
            default: "warning",
          },
          requireManualApproval: {
            type: Boolean,
            default: true,
          },
        },
        restrictEntry: {
          enabled: {
            type: Boolean,
            default: false,
          },
          threshold: {
            type: String,
            enum: ["warning", "caution"],
            default: "warning",
          },
        },
      },
    },
    // Polling settings
    pollingInterval: {
      type: Number,
      default: 60, // minutes
      min: 5,
      max: 1440,
    },
    // Last check timestamp
    lastChecked: {
      type: Date,
    },
    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
weatherAlertConfigSchema.index({ event: 1 });
weatherAlertConfigSchema.index({ enabled: 1 });

export default mongoose.model("WeatherAlertConfig", weatherAlertConfigSchema);

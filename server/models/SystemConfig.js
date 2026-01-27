import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    // Singleton document - only one config should exist
    _id: {
      type: String,
      default: "system_config",
    },
    qrCodeRules: {
      type: new mongoose.Schema({
        enabled: {
          type: Boolean,
          default: true,
        },
        allowMultipleScan: {
          type: Boolean,
          default: false,
        },
      }, { _id: false }),
      default: () => ({ enabled: true, allowMultipleScan: false }),
    },
    ticketLimits: {
      type: new mongoose.Schema({
        maxPerEvent: {
          type: Number,
          default: 1000,
          min: 1,
        },
        maxPerUser: {
          type: Number,
          default: 10,
          min: 1,
        },
      }, { _id: false }),
      default: () => ({ maxPerEvent: 1000, maxPerUser: 10 }),
    },
    security: {
      type: new mongoose.Schema({
        enableTwoFactor: {
          type: Boolean,
          default: false,
        },
        passwordMinLength: {
          type: Number,
          default: 8,
          min: 6,
          max: 32,
        },
        sessionTimeout: {
          type: Number,
          default: 3600,
          min: 300,
        },
      }, { _id: false }),
      default: () => ({ enableTwoFactor: false, passwordMinLength: 8, sessionTimeout: 3600 }),
    },
    emailNotifications: {
      type: new mongoose.Schema({
        enabled: {
          type: Boolean,
          default: true,
        },
        confirmationEmail: {
          type: Boolean,
          default: true,
        },
        reminderEmail: {
          type: Boolean,
          default: true,
        },
      }, { _id: false }),
      default: () => ({ enabled: true, confirmationEmail: true, reminderEmail: true }),
    },
    // Weather Alert Module Configuration
    weatherAlerts: {
      type: new mongoose.Schema({
        enabled: {
          type: Boolean,
          default: false,
        },
        autoPolling: {
          type: Boolean,
          default: true,
        },
        pollingInterval: {
          type: Number,
          default: 60, // minutes
          min: 5,
          max: 1440,
        },
        allowedRoles: [
          {
            type: String,
            enum: ["super_admin", "event_admin", "staff_admin"],
            default: "super_admin",
          },
        ],
        requireApproval: {
          type: Boolean,
          default: true,
        },
      }, { _id: false }),
      default: () => ({ 
        enabled: false, 
        autoPolling: true, 
        pollingInterval: 60,
        allowedRoles: ["super_admin"],
        requireApproval: true 
      }),
    },
  },
  { 
    timestamps: true,
    collection: "systemconfig"
  }
);

export default mongoose.model("SystemConfig", systemConfigSchema);

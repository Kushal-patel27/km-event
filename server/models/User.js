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
      enum: ["user", "staff", ...ADMIN_ROLES],
      default: "user",
    },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }], // Events assigned to event_admin/staff_admin/staff
    assignedGates: [{ type: String }], // Gate/Zone names for staff (e.g., ["Gate A", "Gate B"])
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff Admin who assigned this staff
    sessions: [sessionSchema],
    lastLoginAt: { type: Date },
    // Profile information
    phone: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    loginMethod: { type: String, enum: ["email", "google", "otp"], default: "email" },
    
    // Account settings
    accountSettings: {
      deactivatedAt: { type: Date },
      deactivationReason: { type: String },
      deleteRequestedAt: { type: Date },
      deletionScheduledAt: { type: Date },
    },
    
    // Security settings
    securitySettings: {
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorMethod: { type: String, enum: ["otp", "email", "none"], default: "none" },
      twoFactorSecret: { type: String },
      loginAlerts: { type: Boolean, default: true },
      suspiciousActivityAlerts: { type: Boolean, default: true },
    },
    
    // Notification preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      weatherAlerts: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      promotionalNotifications: { type: Boolean, default: false },
      emailFrequency: { type: String, enum: ["instant", "daily", "weekly"], default: "instant" },
      criticalAlertsOverride: { type: Boolean, default: true },
    },
    
    // Event & booking preferences
    eventPreferences: {
      preferredLocations: [{ type: String }],
      preferredCategories: [{ type: String }],
      autoWeatherNotify: { type: Boolean, default: true },
      autoCancelAlerts: { type: Boolean, default: true },
      refundNotifications: { type: Boolean, default: true },
      rescheduleNotifications: { type: Boolean, default: true },
    },
    
    // Privacy settings
    privacySettings: {
      dataVisibility: { type: String, enum: ["private", "public", "friends"], default: "private" },
      allowAnalytics: { type: Boolean, default: true },
      allowPersonalization: { type: Boolean, default: true },
      consentGiven: { type: Boolean, default: false },
      consentDate: { type: Date },
    },
    
    // Language & region preferences
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      currency: { type: String, default: "INR" },
      dateFormat: { type: String, enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], default: "DD/MM/YYYY" },
      timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
    },
    
    // UI settings
    uiSettings: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      fontSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
      highContrast: { type: Boolean, default: false },
      reduceAnimations: { type: Boolean, default: false },
      dashboardLayout: { type: String, default: "default" },
    },
    
    // Legacy support
    emailUpdates: { type: Boolean, default: true },
    bookingReminders: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    passwordReset: {
      otpHash: { type: String },
      otpExpiresAt: { type: Date },
      otpAttempts: { type: Number, default: 0 },
      otpLastSentAt: { type: Date },
      otpRequestCount: { type: Number, default: 0 },
      otpWindowStartedAt: { type: Date },
      resetTokenHash: { type: String },
      resetTokenExpiresAt: { type: Date },
      lockedUntil: { type: Date },
      otpVerifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);

export default mongoose.model("User", userSchema);

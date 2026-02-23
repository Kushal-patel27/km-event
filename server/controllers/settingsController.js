import User from "../models/User.js";
import SettingsAuditLog from "../models/SettingsAuditLog.js";
import VerificationRequest from "../models/VerificationRequest.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Helper function to log settings changes
async function logSettingsChange(userId, action, category, details, req) {
  try {
    await SettingsAuditLog.create({
      userId,
      action,
      category,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    });
  } catch (error) {
    console.error("Failed to log settings change:", error);
  }
}

// Helper to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to hash OTP
async function hashOTP(otp) {
  return await bcrypt.hash(otp, 10);
}

// ==================== ACCOUNT SETTINGS ====================

// Get all user settings
export const getAllSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -passwordReset -sessions");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      account: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        loginMethod: user.loginMethod,
        accountSettings: user.accountSettings,
      },
      security: {
        loginAlerts: user.securitySettings?.loginAlerts ?? true,
        suspiciousActivityAlerts: user.securitySettings?.suspiciousActivityAlerts ?? true,
        activeSessions: user.sessions?.length || 0,
      },
      notifications: user.notificationPreferences || {},
      eventPreferences: user.eventPreferences || {},
      privacy: user.privacySettings || {},
      preferences: user.preferences || {},
      uiSettings: user.uiSettings || {},
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update account information
export const updateAccountInfo = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const changes = {};
    if (name && name !== user.name) {
      user.name = name;
      changes.name = { from: user.name, to: name };
    }
    if (phone !== undefined && phone !== user.phone) {
      user.phone = phone;
      changes.phone = { from: user.phone, to: phone };
    }
    if (profileImage !== undefined && profileImage !== user.profileImage) {
      user.profileImage = profileImage;
      changes.profileImage = "updated";
    }

    await user.save();

    if (Object.keys(changes).length > 0) {
      await logSettingsChange(user._id, "ACCOUNT_INFO_UPDATED", "ACCOUNT", changes, req);
    }

    res.json({ message: "Account information updated successfully", user: { name: user.name, phone: user.phone, profileImage: user.profileImage } });
  } catch (error) {
    console.error("Update account info error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request email change (send OTP to new email)
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Save verification request
    await VerificationRequest.findOneAndUpdate(
      { userId: req.user._id, type: "EMAIL" },
      {
        userId: req.user._id,
        type: "EMAIL",
        code: hashedOTP,
        newValue: newEmail,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        verified: false,
      },
      { upsert: true, new: true }
    );

    // TODO: Send OTP email to newEmail
    console.log(`OTP for email change: ${otp} (to ${newEmail})`);

    res.json({ message: "Verification code sent to new email address" });
  } catch (error) {
    console.error("Request email change error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify email change with OTP
export const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;

    const verificationRequest = await VerificationRequest.findOne({
      userId: req.user._id,
      type: "EMAIL",
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRequest) {
      return res.status(400).json({ message: "No pending email verification or code expired" });
    }

    if (verificationRequest.attempts >= 3) {
      return res.status(400).json({ message: "Too many failed attempts. Please request a new code." });
    }

    const isValid = await bcrypt.compare(otp, verificationRequest.code);
    if (!isValid) {
      verificationRequest.attempts += 1;
      await verificationRequest.save();
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user email
    const user = await User.findById(req.user._id);
    const oldEmail = user.email;
    user.email = verificationRequest.newValue;
    await user.save();

    // Mark verification as complete
    verificationRequest.verified = true;
    verificationRequest.verifiedAt = new Date();
    await verificationRequest.save();

    await logSettingsChange(user._id, "EMAIL_CHANGED", "ACCOUNT", { from: oldEmail, to: user.email }, req);

    res.json({ message: "Email updated successfully", email: user.email });
  } catch (error) {
    console.error("Verify email change error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request phone change
export const requestPhoneChange = async (req, res) => {
  try {
    const { newPhone } = req.body;

    if (!newPhone || !/^\d{10}$/.test(newPhone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    await VerificationRequest.findOneAndUpdate(
      { userId: req.user._id, type: "PHONE" },
      {
        userId: req.user._id,
        type: "PHONE",
        code: hashedOTP,
        newValue: newPhone,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        verified: false,
      },
      { upsert: true, new: true }
    );

    // TODO: Send OTP via SMS
    console.log(`OTP for phone change: ${otp} (to ${newPhone})`);

    res.json({ message: "Verification code sent to new phone number" });
  } catch (error) {
    console.error("Request phone change error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify phone change
export const verifyPhoneChange = async (req, res) => {
  try {
    const { otp } = req.body;

    const verificationRequest = await VerificationRequest.findOne({
      userId: req.user._id,
      type: "PHONE",
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRequest) {
      return res.status(400).json({ message: "No pending phone verification or code expired" });
    }

    if (verificationRequest.attempts >= 3) {
      return res.status(400).json({ message: "Too many failed attempts. Please request a new code." });
    }

    const isValid = await bcrypt.compare(otp, verificationRequest.code);
    if (!isValid) {
      verificationRequest.attempts += 1;
      await verificationRequest.save();
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const user = await User.findById(req.user._id);
    const oldPhone = user.phone;
    user.phone = verificationRequest.newValue;
    await user.save();

    verificationRequest.verified = true;
    verificationRequest.verifiedAt = new Date();
    await verificationRequest.save();

    await logSettingsChange(user._id, "PHONE_CHANGED", "ACCOUNT", { from: oldPhone, to: user.phone }, req);

    res.json({ message: "Phone number updated successfully", phone: user.phone });
  } catch (error) {
    console.error("Verify phone change error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deactivate account
export const deactivateAccount = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user._id);

    user.active = false;
    user.accountSettings = user.accountSettings || {};
    user.accountSettings.deactivatedAt = new Date();
    user.accountSettings.deactivationReason = reason || "User requested";
    await user.save();

    await logSettingsChange(user._id, "ACCOUNT_DEACTIVATED", "ACCOUNT", { reason }, req);

    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request account deletion (with cooldown)
export const requestAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    user.accountSettings = user.accountSettings || {};
    user.accountSettings.deleteRequestedAt = new Date();
    user.accountSettings.deletionScheduledAt = deletionDate;
    await user.save();

    await logSettingsChange(user._id, "ACCOUNT_DELETION_REQUESTED", "ACCOUNT", { scheduledFor: deletionDate }, req);

    res.json({ message: "Account deletion scheduled", deletionDate });
  } catch (error) {
    console.error("Request account deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel account deletion
export const cancelAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.accountSettings = user.accountSettings || {};
    user.accountSettings.deleteRequestedAt = null;
    user.accountSettings.deletionScheduledAt = null;
    await user.save();

    await logSettingsChange(user._id, "ACCOUNT_DELETION_CANCELLED", "ACCOUNT", {}, req);

    res.json({ message: "Account deletion cancelled" });
  } catch (error) {
    console.error("Cancel account deletion error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== SECURITY SETTINGS ====================

// Enable 2FA
// Get active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("sessions");
    
    const sessions = (user.sessions || []).map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ip: s.ip,
      lastSeenAt: s.lastSeenAt,
      createdAt: s.createdAt,
    }));

    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout from specific session
export const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);

    user.sessions = user.sessions.filter((s) => s._id.toString() !== sessionId);
    await user.save();

    await logSettingsChange(user._id, "SESSION_TERMINATED", "SECURITY", { sessionId }, req);

    res.json({ message: "Session terminated successfully" });
  } catch (error) {
    console.error("Logout session error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout from all devices
export const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const sessionCount = user.sessions.length;
    user.sessions = [];
    user.tokenVersion += 1;
    await user.save();

    await logSettingsChange(user._id, "ALL_SESSIONS_TERMINATED", "SECURITY", { count: sessionCount }, req);

    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all devices error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update security preferences
export const updateSecurityPreferences = async (req, res) => {
  try {
    const { loginAlerts, suspiciousActivityAlerts } = req.body;
    const user = await User.findById(req.user._id);

    user.securitySettings = user.securitySettings || {};
    if (loginAlerts !== undefined) user.securitySettings.loginAlerts = loginAlerts;
    if (suspiciousActivityAlerts !== undefined) user.securitySettings.suspiciousActivityAlerts = suspiciousActivityAlerts;

    await user.save();

    await logSettingsChange(user._id, "SECURITY_PREFERENCES_UPDATED", "SECURITY", { loginAlerts, suspiciousActivityAlerts }, req);

    res.json({ message: "Security preferences updated", securitySettings: user.securitySettings });
  } catch (error) {
    console.error("Update security preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== NOTIFICATION SETTINGS ====================

export const updateNotificationPreferences = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    user.notificationPreferences = { ...user.notificationPreferences, ...updates };
    await user.save();

    await logSettingsChange(user._id, "NOTIFICATION_PREFERENCES_UPDATED", "NOTIFICATIONS", updates, req);

    res.json({ message: "Notification preferences updated", notificationPreferences: user.notificationPreferences });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== EVENT & BOOKING PREFERENCES ====================

export const updateEventPreferences = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    user.eventPreferences = { ...user.eventPreferences, ...updates };
    await user.save();

    await logSettingsChange(user._id, "EVENT_PREFERENCES_UPDATED", "EVENT_PREFERENCES", updates, req);

    res.json({ message: "Event preferences updated", eventPreferences: user.eventPreferences });
  } catch (error) {
    console.error("Update event preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== PRIVACY SETTINGS ====================

export const updatePrivacySettings = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    user.privacySettings = { ...user.privacySettings, ...updates };
    
    if (updates.consentGiven !== undefined && updates.consentGiven) {
      user.privacySettings.consentDate = new Date();
    }

    await user.save();

    await logSettingsChange(user._id, "PRIVACY_SETTINGS_UPDATED", "PRIVACY", updates, req);

    res.json({ message: "Privacy settings updated", privacySettings: user.privacySettings });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Download personal data
export const downloadPersonalData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -passwordReset -sessions");
    
    // TODO: Include booking history, payment history, etc.
    const personalData = {
      user: user.toObject(),
      exportedAt: new Date(),
    };

    await logSettingsChange(user._id, "DATA_DOWNLOADED", "PRIVACY", {}, req);

    res.json(personalData);
  } catch (error) {
    console.error("Download personal data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== LANGUAGE & REGION PREFERENCES ====================

export const updateLanguageRegionPreferences = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    user.preferences = { ...user.preferences, ...updates };
    await user.save();

    await logSettingsChange(user._id, "LANGUAGE_REGION_UPDATED", "PREFERENCES", updates, req);

    res.json({ message: "Language and region preferences updated", preferences: user.preferences });
  } catch (error) {
    console.error("Update language/region preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== UI SETTINGS ====================

export const updateUISettings = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    user.uiSettings = { ...user.uiSettings, ...updates };
    await user.save();

    await logSettingsChange(user._id, "UI_SETTINGS_UPDATED", "UI", updates, req);

    res.json({ message: "UI settings updated", uiSettings: user.uiSettings });
  } catch (error) {
    console.error("Update UI settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== AUDIT LOG ====================

export const getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await SettingsAuditLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await SettingsAuditLog.countDocuments({ userId: req.user._id });

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get audit log error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset all settings to default
export const resetAllSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Reset to defaults
    user.notificationPreferences = {
      email: true,
      sms: false,
      push: true,
      weatherAlerts: true,
      eventReminders: true,
      promotionalNotifications: false,
      emailFrequency: "instant",
      criticalAlertsOverride: true,
    };
    user.eventPreferences = {
      preferredLocations: [],
      preferredCategories: [],
      autoWeatherNotify: true,
      autoCancelAlerts: true,
      refundNotifications: true,
      rescheduleNotifications: true,
    };
    user.privacySettings = {
      dataVisibility: "private",
      allowAnalytics: true,
      allowPersonalization: true,
      consentGiven: false,
    };
    user.preferences = {
      language: "en",
      timezone: "UTC",
      currency: "INR",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
    };
    user.uiSettings = {
      theme: "system",
      fontSize: "medium",
      highContrast: false,
      reduceAnimations: false,
      dashboardLayout: "default",
    };

    await user.save();

    await logSettingsChange(user._id, "ALL_SETTINGS_RESET", "SYSTEM", {}, req);

    res.json({ message: "All settings reset to default" });
  } catch (error) {
    console.error("Reset settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

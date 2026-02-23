import express from "express";
import {
  getAllSettings,
  updateAccountInfo,
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
  deactivateAccount,
  requestAccountDeletion,
  cancelAccountDeletion,
  getActiveSessions,
  logoutSession,
  logoutAllDevices,
  updateSecurityPreferences,
  updateNotificationPreferences,
  updateEventPreferences,
  updatePrivacySettings,
  downloadPersonalData,
  updateLanguageRegionPreferences,
  updateUISettings,
  getAuditLog,
  resetAllSettings,
} from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiters for sensitive operations
const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: "Too many email change requests. Please try again later." },
});

const phoneChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many phone change requests. Please try again later." },
});

const accountDeletionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2,
  message: { message: "Too many account deletion requests. Please contact support." },
});

// ==================== GET ALL SETTINGS ====================
router.get("/", protect, getAllSettings);

// ==================== ACCOUNT SETTINGS ====================
router.put("/account/info", protect, updateAccountInfo);
router.post("/account/email/request", protect, emailChangeLimiter, requestEmailChange);
router.post("/account/email/verify", protect, verifyEmailChange);
router.post("/account/phone/request", protect, phoneChangeLimiter, requestPhoneChange);
router.post("/account/phone/verify", protect, verifyPhoneChange);
router.post("/account/deactivate", protect, deactivateAccount);
router.post("/account/delete/request", protect, accountDeletionLimiter, requestAccountDeletion);
router.post("/account/delete/cancel", protect, cancelAccountDeletion);

// ==================== SECURITY SETTINGS ====================
router.get("/security/sessions", protect, getActiveSessions);
router.delete("/security/sessions/:sessionId", protect, logoutSession);
router.post("/security/logout-all", protect, logoutAllDevices);
router.put("/security/preferences", protect, updateSecurityPreferences);

// ==================== NOTIFICATION SETTINGS ====================
router.put("/notifications", protect, updateNotificationPreferences);

// ==================== EVENT & BOOKING PREFERENCES ====================
router.put("/event-preferences", protect, updateEventPreferences);

// ==================== PRIVACY SETTINGS ====================
router.put("/privacy", protect, updatePrivacySettings);
router.get("/privacy/download-data", protect, downloadPersonalData);

// ==================== LANGUAGE & REGION ====================
router.put("/preferences", protect, updateLanguageRegionPreferences);

// ==================== UI SETTINGS ====================
router.put("/ui", protect, updateUISettings);

// ==================== AUDIT LOG ====================
router.get("/audit-log", protect, getAuditLog);

// ==================== RESET ALL SETTINGS ====================
router.post("/reset-all", protect, resetAllSettings);

export default router;

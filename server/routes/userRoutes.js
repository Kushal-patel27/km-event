import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Limit FCM token saves to 10 per 15 minutes per IP (tokens refresh infrequently)
const saveFcmTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many token save requests. Please try again later." },
});

/**
 * Save or update the FCM device token for the authenticated user.
 * Called by the Flutter app after obtaining a fresh FCM token.
 *
 * POST /api/users/save-fcm-token
 * Headers: Authorization: Bearer <jwt>
 * Body:    { "fcmToken": "<device-token-string>" }
 */
router.post("/save-fcm-token", saveFcmTokenLimiter, protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== "string") {
      return res.status(400).json({ message: "fcmToken is required and must be a string" });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { fcmToken } },
      { new: true }
    );

    return res.json({ success: true, message: "FCM token saved successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

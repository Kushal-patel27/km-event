import mongoose from "mongoose";
import User from "../models/User.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";

// Error codes returned by FCM for stale / invalid tokens
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

const MAX_TOKENS_PER_BATCH = 500;

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Send FCM push notifications to all users or a specific user.
 *
 * POST /api/admin/send-notification
 * Body:
 *   { "title": "Hello", "message": "World", "target": "all" }
 *   { "title": "Hi", "message": "There", "target": "user", "userId": "<mongoId>" }
 */
export const sendPushNotification = async (req, res) => {
  try {
    const { title, message, target = "all", userId } = req.body || {};

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    if (!normalizedTitle || !normalizedMessage) {
      return res.status(400).json({ message: "title and message are required" });
    }

    if (normalizedTitle.length > 100) {
      return res.status(400).json({ message: "title must be 100 characters or fewer" });
    }

    if (normalizedMessage.length > 500) {
      return res.status(400).json({ message: "message must be 500 characters or fewer" });
    }

    if (!["all", "user"].includes(target)) {
      return res.status(400).json({ message: "target must be 'all' or 'user'" });
    }

    if (target === "user") {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ message: "A valid userId is required when target is 'user'" });
      }
    }

    // Build the MongoDB filter to find users with a valid FCM token
    const filter =
      target === "all"
        ? { fcmToken: { $ne: null } }
        : { _id: userId, fcmToken: { $ne: null } };

    const users = await User.find(filter).select("_id fcmToken").lean();
    const tokens = [...new Set(users.map((u) => u.fcmToken).filter(Boolean))];

    if (!tokens.length) {
      return res.status(200).json({
        success: true,
        sent: 0,
        failed: 0,
        message: "No registered FCM tokens found for the selected target",
      });
    }

    let firebase;
    try {
      firebase = getFirebaseAdmin();
    } catch (firebaseInitError) {
      return res.status(503).json({
        message: "Push notifications are not configured on the server.",
        detail: firebaseInitError.message,
      });
    }

    // sendEachForMulticast supports up to 500 tokens per call.
    const tokenChunks = chunkArray(tokens, MAX_TOKENS_PER_BATCH);
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (const tokenChunk of tokenChunks) {
      const response = await firebase.messaging().sendEachForMulticast({
        tokens: tokenChunk,
        notification: { title: normalizedTitle, body: normalizedMessage },
        data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((r, idx) => {
        if (!r.success && INVALID_TOKEN_CODES.has(r.error?.code)) {
          invalidTokens.push(tokenChunk[idx]);
        }
      });
    }

    if (invalidTokens.length) {
      await User.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { fcmToken: null } }
      );
    }

    return res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      batches: tokenChunks.length,
      cleanedInvalidTokens: invalidTokens.length,
    });
  } catch (error) {
    const code = error?.code;

    if (code === "messaging/authentication-error" || code === "app/invalid-credential") {
      return res.status(503).json({
        message: "Firebase credentials are invalid or expired.",
      });
    }

    if (code === "messaging/invalid-argument") {
      return res.status(400).json({
        message: "Invalid push notification payload sent to Firebase.",
      });
    }

    return res.status(500).json({
      message: "Failed to send push notification. Please try again.",
      detail: error?.message,
    });
  }
};

/**
 * Check whether push notifications are ready to send.
 * GET /api/admin/push-notification/health
 */
export const getPushNotificationHealth = async (req, res) => {
  try {
    const registeredDevices = await User.countDocuments({ fcmToken: { $ne: null } });

    try {
      getFirebaseAdmin();
      return res.json({
        success: true,
        configured: true,
        registeredDevices,
      });
    } catch (firebaseInitError) {
      return res.json({
        success: false,
        configured: false,
        registeredDevices,
        message: "Push notifications are not configured on the server.",
        detail: firebaseInitError.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to check push notification health.",
      detail: error?.message,
    });
  }
};

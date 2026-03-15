import mongoose from "mongoose";
import User from "../models/User.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";

// Error codes returned by FCM for stale / invalid tokens
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

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
    const { title, message, target = "all", userId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "title and message are required" });
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
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);

    if (!tokens.length) {
      return res.status(200).json({
        success: true,
        sent: 0,
        failed: 0,
        message: "No registered FCM tokens found for the selected target",
      });
    }

    const admin = getFirebaseAdmin();

    // sendEachForMulticast supports up to 500 tokens per call
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: message },
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
    });

    // Collect stale / invalid tokens and null them out in the DB
    const invalidTokens = [];
    response.responses.forEach((r, idx) => {
      if (!r.success && INVALID_TOKEN_CODES.has(r.error?.code)) {
        invalidTokens.push(tokens[idx]);
      }
    });

    if (invalidTokens.length) {
      await User.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { $set: { fcmToken: null } }
      );
    }

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      cleanedInvalidTokens: invalidTokens.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

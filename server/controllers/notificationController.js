import crypto from "crypto";
import Notification from "../models/Notification.js";
import NotificationTemplate from "../models/NotificationTemplate.js";
import User, { ADMIN_ROLE_SET } from "../models/User.js";
import Booking from "../models/Booking.js";
import { ensureEmailConfigured, sendNotificationEmail } from "../utils/emailService.js";

const MESSAGE_TYPES = ["offer", "announcement", "update", "custom"];
const RECIPIENT_TYPES = ["all", "registered", "participants", "staff"];

function buildDedupKey({ subject, title, html, recipientType }) {
  const hash = crypto.createHash("sha256");
  hash.update(`${subject}::${title}::${recipientType}::${html}`);
  return hash.digest("hex");
}

async function getRecipients(recipientType) {
  switch (recipientType) {
    case "all":
      return User.find({ active: true }).select("name email role").lean();
    case "registered":
      return User.find({ active: true, role: "user" }).select("name email role").lean();
    case "participants": {
      const userIds = await Booking.distinct("user");
      return User.find({ _id: { $in: userIds }, active: true }).select("name email role").lean();
    }
    case "staff":
      return User.find({ active: true, role: { $in: ["staff", "staff_admin", "event_admin", "admin", "super_admin"] } })
        .select("name email role")
        .lean();
    default:
      return [];
  }
}

export const sendNotification = async (req, res) => {
  try {
    ensureEmailConfigured();
    const { subject, title, html, messageType = "custom", recipientType = "all" } = req.body;

    if (!subject || !title || !html) {
      return res.status(400).json({ message: "Subject, title, and message body are required" });
    }
    if (!MESSAGE_TYPES.includes(messageType)) {
      return res.status(400).json({ message: "Invalid message type" });
    }
    if (!RECIPIENT_TYPES.includes(recipientType)) {
      return res.status(400).json({ message: "Invalid recipient type" });
    }

    const dedupKey = buildDedupKey({ subject, title, html, recipientType });
    const recentDuplicate = await Notification.findOne({ dedupKey, createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } });
    if (recentDuplicate) {
      return res.status(409).json({ message: "This notification was already sent recently." });
    }

    const notification = await Notification.create({
      subject,
      title,
      html,
      messageType,
      recipientType,
      dedupKey,
      status: "pending",
      admin: {
        id: req.user?._id,
        name: req.user?.name,
        email: req.user?.email,
      },
    });

    const recipients = await getRecipients(recipientType);
    const uniqueEmails = new Map();
    recipients.forEach((r) => {
      if (r.email) {
        uniqueEmails.set(r.email, r);
      }
    });

    let sent = 0;
    let failed = 0;
    const sendPromises = Array.from(uniqueEmails.values()).map(async (recipient) => {
      const ok = await sendNotificationEmail({
        to: recipient.email,
        subject,
        title,
        htmlContent: html,
        messageType,
        recipientName: recipient.name || "there",
      });
      if (ok) sent += 1; else failed += 1;
    });

    await Promise.all(sendPromises);

    notification.sentCount = sent;
    notification.status = failed === 0 ? "sent" : "failed";
    notification.error = failed > 0 ? `${failed} failures` : undefined;
    await notification.save();

    return res.json({ success: true, sent, failed, notification });
  } catch (err) {
    console.error("sendNotification failed", err);
    return res.status(500).json({ message: err.message || "Failed to send notification" });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ notifications });
  } catch (err) {
    console.error("listNotifications failed", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ createdAt: -1 }).lean();
    return res.json({ templates });
  } catch (err) {
    console.error("listTemplates failed", err);
    return res.status(500).json({ message: "Failed to load templates" });
  }
};

export const saveTemplate = async (req, res) => {
  try {
    const { name, subject, title, html, messageType = "custom" } = req.body;
    if (!name || !subject || !title || !html) {
      return res.status(400).json({ message: "Name, subject, title, and body are required" });
    }
    if (!MESSAGE_TYPES.includes(messageType)) {
      return res.status(400).json({ message: "Invalid message type" });
    }

    const template = await NotificationTemplate.create({
      name,
      subject,
      title,
      html,
      messageType,
      createdBy: {
        id: req.user?._id,
        name: req.user?.name,
        email: req.user?.email,
      },
    });

    return res.json({ success: true, template });
  } catch (err) {
    console.error("saveTemplate failed", err);
    return res.status(500).json({ message: "Failed to save template" });
  }
};

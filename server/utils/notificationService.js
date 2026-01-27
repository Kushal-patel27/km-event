/**
 * Notification Orchestrator
 * Handles multi-channel notifications (Email, SMS, WhatsApp, Push)
 */
import { sendWeatherAlertEmail } from "./emailService.js";
import { sendSMS, sendWhatsApp } from "./smsService.js";
import WeatherAlertLog from "../models/WeatherAlertLog.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

/**
 * Send weather alert to all configured channels
 * @param {Object} params - Notification parameters
 */
export const sendWeatherNotification = async ({
  event,
  weatherAlert,
  alertConfig,
  recipients = {
    superAdmin: true,
    eventAdmin: true,
    staff: false,
    attendees: false,
  },
}) => {
  try {
    const notificationLog = {
      email: { sent: 0, failed: 0, recipients: [] },
      sms: { sent: 0, failed: 0, recipients: [] },
      whatsapp: { sent: 0, failed: 0, recipients: [] },
    };

    // Get all recipient users based on roles
    const recipientUsers = await getRecipients(event, recipients);

    // Prepare notification message
    const message = buildNotificationMessage(
      event,
      weatherAlert,
      alertConfig?.alertTemplate
    );

    // Send Email notifications
    if (alertConfig?.notifications?.email?.enabled) {
      const emailResults = await sendEmailNotifications(
        recipientUsers,
        event,
        weatherAlert,
        message,
        alertConfig.notifications.email.recipients
      );
      notificationLog.email = emailResults;
    }

    // Send SMS notifications
    if (alertConfig?.notifications?.sms?.enabled) {
      const smsResults = await sendSMSNotifications(
        recipientUsers,
        message,
        alertConfig.notifications.sms.recipients
      );
      notificationLog.sms = smsResults;
    }

    // Send WhatsApp notifications
    if (alertConfig?.notifications?.whatsapp?.enabled) {
      const whatsappResults = await sendWhatsAppNotifications(
        recipientUsers,
        message,
        alertConfig.notifications.whatsapp.recipients
      );
      notificationLog.whatsapp = whatsappResults;
    }

    return {
      success: true,
      notificationLog,
    };
  } catch (error) {
    console.error("Error in sendWeatherNotification:", error);
    return {
      success: false,
      error: error.message,
      notificationLog: {
        email: { sent: 0, failed: 0, recipients: [] },
        sms: { sent: 0, failed: 0, recipients: [] },
        whatsapp: { sent: 0, failed: 0, recipients: [] },
      },
    };
  }
};

/**
 * Get recipients based on role configuration
 */
async function getRecipients(event, recipientConfig) {
  const users = [];

  // Super Admins
  if (recipientConfig.superAdmin) {
    const superAdmins = await User.find({
      role: "super_admin",
      active: true,
    }).select("name email phone notificationPreferences");
    users.push(
      ...superAdmins.map((u) => ({ ...u.toObject(), recipientRole: "super_admin" }))
    );
  }

  // Event Admins
  if (recipientConfig.eventAdmin) {
    const eventAdmins = await User.find({
      role: { $in: ["event_admin", "admin"] },
      active: true,
      $or: [{ assignedEvents: event._id }, { role: "admin" }],
    }).select("name email phone notificationPreferences");
    users.push(
      ...eventAdmins.map((u) => ({ ...u.toObject(), recipientRole: "event_admin" }))
    );
  }

  // Staff
  if (recipientConfig.staff) {
    const staff = await User.find({
      role: { $in: ["staff", "staff_admin"] },
      active: true,
      assignedEvents: event._id,
    }).select("name email phone notificationPreferences");
    users.push(...staff.map((u) => ({ ...u.toObject(), recipientRole: "staff" })));
  }

  // Attendees (users who booked tickets)
  if (recipientConfig.attendees) {
    const bookings = await Booking.find({
      event: event._id,
      status: { $in: ["confirmed", "paid"] },
    }).populate("user", "name email phone notificationPreferences");

    const attendees = bookings
      .map((b) => b.user)
      .filter((u) => u && u.notificationPreferences?.weatherAlerts !== false);

    users.push(
      ...attendees.map((u) => ({ ...u.toObject(), recipientRole: "attendee" }))
    );
  }

  // Remove duplicates by email
  const uniqueUsers = Array.from(
    new Map(users.map((u) => [u.email, u])).values()
  );

  return uniqueUsers;
}

/**
 * Build notification message from template
 */
function buildNotificationMessage(event, weatherAlert, template) {
  const defaultTemplate =
    "⚠️ Weather Alert for {eventName}: {weatherCondition}. Temperature: {temperature}°C, Wind: {windSpeed} km/h. Please take necessary precautions.";

  const messageTemplate = template || defaultTemplate;

  return messageTemplate
    .replace("{eventName}", event.title || event.name)
    .replace("{weatherCondition}", weatherAlert.condition || "Severe Weather")
    .replace("{temperature}", weatherAlert.temperature || "N/A")
    .replace("{windSpeed}", weatherAlert.windSpeed || "N/A")
    .replace("{humidity}", weatherAlert.humidity || "N/A")
    .replace("{rainfall}", weatherAlert.rainfall || "0");
}

/**
 * Send email notifications to recipients
 */
async function sendEmailNotifications(
  recipientUsers,
  event,
  weatherAlert,
  message,
  recipientConfig
) {
  const results = { sent: 0, failed: 0, recipients: [] };

  for (const user of recipientUsers) {
    // Check if this role should receive emails
    if (!recipientConfig[user.recipientRole]) {
      continue;
    }

    // Check user's email preference
    if (user.notificationPreferences?.email === false) {
      continue;
    }

    try {
      const emailSent = await sendWeatherAlertEmail(
        {
          user: {
            name: user.name,
            email: user.email,
          },
          event: {
            name: event.title || event.name,
            location: event.location,
            date: event.date,
            time: event.time || "TBD",
          },
          quantity: 1,
        },
        weatherAlert
      );

      if (emailSent) {
        results.sent++;
        results.recipients.push({
          email: user.email,
          role: user.recipientRole,
          status: "sent",
          sentAt: new Date(),
        });
      } else {
        results.failed++;
        results.recipients.push({
          email: user.email,
          role: user.recipientRole,
          status: "failed",
          error: "Email service failed",
        });
      }
    } catch (error) {
      results.failed++;
      results.recipients.push({
        email: user.email,
        role: user.recipientRole,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Send SMS notifications to recipients
 */
async function sendSMSNotifications(recipientUsers, message, recipientConfig) {
  const results = { sent: 0, failed: 0, recipients: [] };

  for (const user of recipientUsers) {
    // Check if this role should receive SMS
    if (!recipientConfig[user.recipientRole]) {
      continue;
    }

    // Check user's SMS preference
    if (user.notificationPreferences?.sms === false || !user.phone) {
      continue;
    }

    try {
      const smsResult = await sendSMS(user.phone, message);

      if (smsResult.success) {
        results.sent++;
        results.recipients.push({
          phone: user.phone,
          role: user.recipientRole,
          status: "sent",
          sentAt: new Date(),
        });
      } else {
        results.failed++;
        results.recipients.push({
          phone: user.phone,
          role: user.recipientRole,
          status: "failed",
          error: smsResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.recipients.push({
        phone: user.phone,
        role: user.recipientRole,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Send WhatsApp notifications to recipients
 */
async function sendWhatsAppNotifications(
  recipientUsers,
  message,
  recipientConfig
) {
  const results = { sent: 0, failed: 0, recipients: [] };

  for (const user of recipientUsers) {
    // Check if this role should receive WhatsApp
    if (!recipientConfig[user.recipientRole]) {
      continue;
    }

    // Check user's WhatsApp preference
    if (user.notificationPreferences?.whatsapp === false || !user.phone) {
      continue;
    }

    try {
      const waResult = await sendWhatsApp(user.phone, message);

      if (waResult.success) {
        results.sent++;
        results.recipients.push({
          phone: user.phone,
          role: user.recipientRole,
          status: "sent",
          sentAt: new Date(),
        });
      } else {
        results.failed++;
        results.recipients.push({
          phone: user.phone,
          role: user.recipientRole,
          status: "failed",
          error: waResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.recipients.push({
        phone: user.phone,
        role: user.recipientRole,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
}

export default {
  sendWeatherNotification,
};

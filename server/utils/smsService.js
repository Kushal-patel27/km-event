import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;

// Only initialize Twilio if credentials are properly set
if (accountSid && authToken && accountSid.startsWith("AC")) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log("✅ Twilio SMS/WhatsApp service initialized");
  } catch (error) {
    console.warn("⚠️  Twilio initialization failed:", error.message);
  }
} else {
  console.warn(
    "⚠️  Twilio credentials not found or invalid. SMS/WhatsApp notifications disabled."
  );
}

/**
 * Send SMS notification
 * @param {String} phone - Phone number in E.164 format (+1234567890)
 * @param {String} message - Message content
 */
export const sendSMS = async (phone, message) => {
  if (!twilioClient) {
    console.warn("SMS service not configured");
    return { success: false, error: "SMS service not configured" };
  }

  if (!twilioPhoneNumber) {
    console.warn("TWILIO_PHONE_NUMBER not set");
    return { success: false, error: "Twilio phone number not configured" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phone,
    });

    console.log(`✅ SMS sent to ${phone}, SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp notification
 * @param {String} phone - Phone number in E.164 format (+1234567890)
 * @param {String} message - Message content
 */
export const sendWhatsApp = async (phone, message) => {
  if (!twilioClient) {
    console.warn("WhatsApp service not configured");
    return { success: false, error: "WhatsApp service not configured" };
  }

  if (!whatsappNumber) {
    console.warn("TWILIO_WHATSAPP_NUMBER not set");
    return { success: false, error: "WhatsApp number not configured" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${phone}`,
    });

    console.log(`✅ WhatsApp sent to ${phone}, SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp to ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk SMS notifications
 */
export const sendBulkSMS = async (recipients) => {
  if (!twilioClient) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      results: [],
    };
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message);
    results.push({
      phone: recipient.phone,
      ...result,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    success: true,
    sent,
    failed,
    results,
  };
};

/**
 * Send bulk WhatsApp notifications
 */
export const sendBulkWhatsApp = async (recipients) => {
  if (!twilioClient) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      results: [],
    };
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendWhatsApp(recipient.phone, recipient.message);
    results.push({
      phone: recipient.phone,
      ...result,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    success: true,
    sent,
    failed,
    results,
  };
};

/**
 * Format phone number to E.164 format
 * @param {String} phone - Phone number
 * @param {String} countryCode - Default country code (e.g., '+91' for India)
 */
export const formatPhoneNumber = (phone, countryCode = "+91") => {
  if (!phone) return null;

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // If already starts with country code
  if (phone.startsWith("+")) {
    return phone.replace(/\D/g, "").replace(/^/, "+");
  }

  // Add country code
  return `${countryCode}${cleaned}`;
};

export default {
  sendSMS,
  sendWhatsApp,
  sendBulkSMS,
  sendBulkWhatsApp,
  formatPhoneNumber,
};

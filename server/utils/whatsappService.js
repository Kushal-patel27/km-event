import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

/**
 * Normalize phone number to international format with + prefix
 * For Indian numbers: adds +91 if missing
 * For international numbers: ensures + prefix
 */
function normalizeRecipientNumber(rawNumber) {
  if (!rawNumber) return null;
  
  const cleaned = String(rawNumber).trim().replace(/[^\d+]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) return null;
  
  // If number already has + prefix, return as is
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // If it's a 10-digit number (likely Indian), add +91
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  
  // If it's 12 digits starting with 91 (Indian number with country code), add +
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }
  
  // For other numbers with country code, add + prefix
  return `+${digitsOnly}`;
}

/**
 * Send WhatsApp message using Meta WhatsApp Cloud API
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - Message text to send
 * @returns {Promise<boolean>} Success status
 */
async function sendWhatsAppMessage({ to, message }) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("[WHATSAPP] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured. Skipping WhatsApp message.");
    return false;
  }

  const normalizedNumber = normalizeRecipientNumber(to);
  if (!normalizedNumber) {
    console.warn("[WHATSAPP] Invalid recipient number. Skipping WhatsApp message.");
    return false;
  }

  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    console.log(`[WHATSAPP] Sending to: ${normalizedNumber}`);

    const response = await axios.post(
      apiUrl,
      {
        messaging_product: "whatsapp",
        to: normalizedNumber,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[WHATSAPP] Message sent successfully. Message ID: ${response.data.messages[0].id}`);
    return true;

  } catch (error) {
    if (error.response) {
      // WhatsApp API returned an error response
      console.error(`[WHATSAPP] API Error (${error.response.status}):`, error.response.data);
      throw new Error(`WhatsApp API failed: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error("[WHATSAPP] No response from WhatsApp API:", error.message);
      throw new Error(`WhatsApp API no response: ${error.message}`);
    } else {
      // Something else went wrong
      console.error("[WHATSAPP] Request setup error:", error.message);
      throw new Error(`WhatsApp request error: ${error.message}`);
    }
  }
}

/**
 * Send booking confirmation via WhatsApp
 */
export const sendBookingConfirmationWhatsApp = async ({
  whatsappNumber,
  recipientName,
  eventName,
  eventDate,
  venue,
  bookingId,
  ticketIds = [],
  ticketLinks = [],
}) => {
  try {
    const formattedDate = new Date(eventDate).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const ticketIdText = ticketIds.length > 0 ? ticketIds.join(", ") : "N/A";

    const message = `🎟 *K&M Events - Ticket Confirmed*

Hi ${recipientName || "there"}! 🎉

Your booking is confirmed!

📅 *Event:* ${eventName}
🗓 *Date:* ${formattedDate}
📍 *Venue:* ${venue}

🎫 *Booking ID:* ${bookingId}
🎟 *Ticket ID(s):* ${ticketIdText}

📧 Your ticket(s) have been sent to your registered email address.

Thank you for choosing K&M Events! 
See you at the event! 🙌`;

    await sendWhatsAppMessage({
      to: whatsappNumber,
      message,
    });

    console.log(`[WHATSAPP] Booking confirmation sent to ${whatsappNumber}`);
    return true;
  } catch (error) {
    console.error("[WHATSAPP] Booking confirmation failed:", error.message);
    return false;
  }
};

export { normalizeRecipientNumber };

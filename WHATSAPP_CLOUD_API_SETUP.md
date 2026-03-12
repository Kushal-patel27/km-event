# WhatsApp Cloud API Setup Guide

Your event booking system now uses the official **WhatsApp Cloud API** from Meta (Facebook) for sending booking confirmations.

## Why WhatsApp Cloud API?

- ✅ Official Meta/Facebook API
- ✅ More reliable than third-party services
- ✅ No recipient registration required
- ✅ Professional business messaging
- ✅ Free tier includes 1,000 conversations/month

## Setup Steps

### 1. Create a Facebook Developer Account

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Get Started"** and create a developer account
3. Complete the registration process

### 2. Create a Meta App

1. Go to [Meta Apps Dashboard](https://developers.facebook.com/apps/)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in:
   - **App Name**: K&M Events Booking
   - **App Contact Email**: Your email
   - **Business Account**: Create or select one
5. Click **"Create App"**

### 3. Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** product
2. Click **"Set Up"** on WhatsApp
3. This will add WhatsApp to your app

### 4. Get Your Credentials

#### Get Phone Number ID:
1. Go to **WhatsApp > Getting Started** in your app dashboard
2. Under **"Send and receive messages"**, find the test phone number
3. Copy the **Phone Number ID** (starts with numbers like `123456789012345`)

#### Get Access Token:
1. In the same **Getting Started** page, find **"Temporary access token"**
2. Copy the token (starts with `EAA...`)
3. ⚠️ **Note**: This is temporary. For production, generate a permanent token:
   - Go to **System Users** in Business Settings
   - Create a system user
   - Assign WhatsApp permissions
   - Generate a permanent token

### 5. Update Your .env File

Replace the placeholder values in `server/.env`:

```env
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

### 6. Test Your Setup

#### Add Test Recipients:
1. In **WhatsApp > Getting Started**
2. Under **"Step 3: Send a test message"**
3. Add phone numbers that should receive test messages
4. Format: Include country code (e.g., `919876543210` for India)

#### Test the Integration:
1. Restart your Node.js server
2. Make a test booking on your website
3. Check the server console for WhatsApp logs
4. The recipient should receive the booking confirmation

### 7. Production Setup (Important!)

Before going live:

1. **Register Your Business**:
   - Complete **Meta Business Verification**
   - Provide business documents

2. **Get a Real Phone Number**:
   - Current test number only works with authorized test recipients
   - Add a real WhatsApp Business phone number
   - Verify it with an SMS code

3. **Generate Permanent Token**:
   - Temporary tokens expire in 24-90 days
   - Create a permanent system user token
   - Store it securely

4. **Set Up Webhooks** (Optional):
   - Receive delivery status notifications
   - Handle incoming messages from users

## Message Format

Your booking confirmations will look like this:

```
🎟 K&M Events - Ticket Confirmed

Hi John! 🎉

Your booking is confirmed!

📅 Event: Tech Conference 2026
🗓 Date: 15 Mar, 2026, 6:00 pm
📍 Venue: Convention Center

🎫 Booking ID: KM-2024-001234
🎟 Ticket ID(s): TKT-001, TKT-002

📥 Download Your Tickets:
Ticket 1: https://yoursite.com/ticket/1
Ticket 2: https://yoursite.com/ticket/2

Thank you for choosing K&M Events!
See you at the event! 🙌
```

## Troubleshooting

### Error: "Invalid access token"
- Token expired (temporary tokens are short-lived)
- Generate a new token from the dashboard
- For production, use a permanent system user token

### Error: "Phone number not registered"
- Add the recipient as a test number in the dashboard
- Or use a verified WhatsApp Business number

### Error: "Rate limit exceeded"
- Free tier has limits (1,000 conversations/month)
- Upgrade to a paid tier if needed
- Check [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

### No message received
- Check server console for error logs
- Verify phone number format (country code + number)
- Ensure WhatsApp is installed on recipient's phone
- Check that recipient's number is in international format

## API Limits

### Free Tier:
- 1,000 business-initiated conversations/month
- User-initiated conversations are free
- Tier 1: 1,000 conversations
- Additional conversations: $0.005 - $0.09 per conversation (varies by country)

### Rate Limits:
- 80 messages per second (per phone number)
- 100,000 messages per day (per phone number)

## Useful Links

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Get Started Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [WhatsApp Business Platform](https://business.whatsapp.com/)
- [Meta Business Suite](https://business.facebook.com/)

## Support

If you encounter issues:
1. Check the [WhatsApp Cloud API Status Page](https://status.fb.com/)
2. Review error logs in your server console
3. Visit [Meta Developer Community](https://developers.facebook.com/community/)
4. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/whatsapp-cloud-api)

---

**Note**: Always protect your access token. Never commit it to version control or share it publicly.

# Gmail SMTP Setup Guide for Weather Alerts & Booking Emails

## Problem
You're seeing this error:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## Solution: Use Gmail App Password

Gmail no longer accepts regular passwords for third-party apps. You need to generate an **App Password**.

---

## Step-by-Step Setup

### 1️⃣ Enable 2-Factor Authentication (2FA)

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup wizard to enable 2FA

---

### 2️⃣ Generate App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords (at bottom)

2. You might need to sign in again

3. Click **Select app** dropdown → Choose **Mail**

4. Click **Select device** dropdown → Choose **Other (Custom name)**
   - Type: `K&M Events Server`

5. Click **Generate**

6. Google will show a 16-character password like:
   ```
   abcd efgh ijkl mnop
   ```

7. **Copy this password** (you won't see it again)

---

### 3️⃣ Update Your .env File

Open `server/.env` and update:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop    # Remove all spaces from the app password!
```

**⚠️ IMPORTANT:** Remove all spaces from the password. If Gmail shows `abcd efgh ijkl mnop`, you should enter `abcdefghijklmnop`.

---

### 4️⃣ Restart Your Server

```powershell
# Stop nodemon (Ctrl+C)
# Start again
npm run dev
```

---

## Testing the Email Setup

### Option 1: Test with Booking
Book a ticket through the frontend - you should receive a confirmation email.

### Option 2: Test Weather Alerts
Run the test script with an event ID:

```powershell
cd server
node test-weather-notifications.js YOUR_EVENT_ID_HERE
```

### Option 3: Test Route via Curl
```powershell
curl -X POST http://localhost:5000/api/weather/test/notify/YOUR_EVENT_ID `
  -H "Content-Type: application/json" `
  -d "{\"type\":\"warning\",\"message\":\"Test alert\",\"condition\":\"Rain\",\"temperature\":25,\"humidity\":80,\"windSpeed\":30,\"rainfall\":10}"
```

---

## Troubleshooting

### Still getting authentication errors?

1. **Check 2FA is enabled:**
   - https://myaccount.google.com/security
   - Look for "2-Step Verification" - should say "On"

2. **Regenerate App Password:**
   - Go back to https://myaccount.google.com/apppasswords
   - Delete old app password
   - Create a new one
   - Update `.env` immediately

3. **Verify .env format:**
   ```env
   EMAIL_USER=k.m.easyevents@gmail.com
   EMAIL_PASS=abcdefghijklmnop    # NO SPACES, exactly 16 characters
   ```

4. **Check for spaces:**
   - App password should be exactly 16 lowercase letters (no spaces, no dashes)
   - Gmail shows it with spaces, but you must remove them

5. **Less Secure Apps:**
   - Google removed "Less Secure Apps" option in May 2022
   - You MUST use App Passwords now (no workaround)

---

## Alternative: Using Different Email Provider

If you don't want to use Gmail, you can use other SMTP providers:

### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

Update `emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});
```

### SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com/
2. Generate API Key
3. Update `emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

---

## Security Best Practices

1. **Never commit `.env` to git:**
   - Already in `.gitignore` ✅
   
2. **Rotate App Passwords regularly:**
   - Delete and regenerate every 3-6 months

3. **Use different App Passwords for different apps:**
   - Create separate ones for dev/staging/production

4. **For production:**
   - Use environment variables in hosting platform
   - Consider using SendGrid, AWS SES, or Mailgun

---

## What Happens After Setup?

Once email is configured, your system will:

### Automatic Weather Alerts
- **Every 60 minutes**, the scheduler checks upcoming events (next 3 days)
- If bad weather detected (warning/caution level)
- **Automatically emails all ticket holders** for that event

### Manual Notifications
- Booking confirmations (instant)
- Password reset OTPs
- Contact form replies
- Admin notifications

---

## Environment Variables Reference

```env
# Email settings
EMAIL_USER=k.m.easyevents@gmail.com    # Your Gmail address
EMAIL_PASS=abcdefghijklmnop            # 16-char App Password (no spaces)

# Weather alerts (optional)
WEATHER_ALERTS_ENABLED=true                    # Enable/disable scheduler
WEATHER_ALERTS_INTERVAL_MINUTES=60            # Check every X minutes
WEATHER_ALERTS_LOOKAHEAD_DAYS=3               # Check events in next X days

# OpenWeather API (for live weather data)
OPENWEATHER_API_KEY=your_api_key_here         # Get from openweathermap.org
```

---

## Quick Checklist

- [ ] 2FA enabled on Gmail
- [ ] App Password generated
- [ ] App Password copied (no spaces)
- [ ] `.env` updated with `EMAIL_USER` and `EMAIL_PASS`
- [ ] Server restarted
- [ ] Test email sent successfully

---

## Need Help?

If you're still having issues:

1. Double-check the App Password has **no spaces** and is exactly **16 characters**
2. Make sure 2FA is fully enabled (not just started)
3. Try generating a new App Password
4. Check Gmail security page for any alerts: https://myaccount.google.com/security

---

✅ **Once setup is complete, you'll see:**
```
✅ Weather alert email sent to: user@example.com
Booking confirmation email sent to user@example.com with 2 PDF ticket(s)
```

❌ **If you see errors:**
```
❌ Error sending weather alert email: Invalid login
Booking confirmation email failed: Error: Invalid login
```
→ Go back to Step 2 and regenerate your App Password.

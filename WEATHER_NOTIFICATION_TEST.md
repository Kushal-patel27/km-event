# Weather Notification Testing Guide

## Quick Test

### Option 1: Using the Test Script (Easiest)

```bash
# Terminal in server folder
node test-weather-notifications.js <EVENT_ID>
```

**Example:**
```bash
node test-weather-notifications.js 6789abc123def456789abc12
```

This will automatically send 4 different weather alert emails to all users who booked tickets for that event:
- 🌧️ Heavy Rain Warning
- ☀️ Extreme Heat Caution  
- 💨 Strong Wind Warning
- ⚡ Thunderstorm Warning

---

### Option 2: Using cURL (Manual Testing)

```bash
# Heavy Rain Test
curl -X POST http://localhost:5000/api/weather/test/notify/6789abc123def456789abc12 \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "message": "🌧️ Heavy rainfall expected",
    "condition": "Heavy Rain",
    "temperature": 22,
    "humidity": 92,
    "windSpeed": 35,
    "rainfall": 15.5
  }'
```

---

### Option 3: Using Postman

**Endpoint:** `POST http://localhost:5000/api/weather/test/notify/{eventId}`

**Body (JSON):**
```json
{
  "type": "warning",
  "message": "Test weather alert message",
  "condition": "Heavy Rain",
  "temperature": 25,
  "humidity": 80,
  "windSpeed": 45,
  "rainfall": 10
}
```

**Parameters:**
- `type` - "warning" | "caution" | "info"
- `message` - Alert message for users
- `condition` - Weather condition (e.g., "Heavy Rain", "Thunderstorm", "Clear")
- `temperature` - Temperature in Celsius
- `humidity` - Humidity percentage (0-100)
- `windSpeed` - Wind speed in km/h
- `rainfall` - Rainfall in mm

---

## How to Get Event ID

### From MongoDB:
```javascript
// In MongoDB shell
db.events.find({}, { _id: 1, name: 1 }).limit(5)
```

### From Frontend:
1. Go to admin dashboard: `/admin`
2. Click Events section
3. Copy event ID from URL or table

### From Admin Weather Dashboard:
1. Go to: `/admin/weather-alerts`
2. Event IDs are shown in each alert card

---

## Expected Results

**Success Response:**
```json
{
  "success": true,
  "test": true,
  "message": "Test notification triggered",
  "result": {
    "success": true,
    "notified": 5,
    "failed": 0,
    "total": 5
  }
}
```

**What This Means:**
- `notified: 5` = 5 emails sent successfully
- `failed: 0` = No errors
- `total: 5` = 5 bookings found for the event

---

## Verify Emails

### Gmail Account
1. Check inbox for emails from `k.m.easyevents@gmail.com`
2. Look for subject like: `⚠️ Weather Alert for Your Event: Event Name`

### Email Service Logs
Watch server console:
```
✅ Weather alert email sent to: user@example.com
✅ Weather notifications sent: 5 successful, 0 failed
```

---

## Troubleshooting

### "Event not found" Error
- Make sure the event ID is correct
- Event must exist in the database

### "No bookings found for event"
- Event has no bookings yet
- Create a booking first, then test

### Emails not received
1. Check `.env` file has EMAIL_USER and EMAIL_PASS set correctly
2. Gmail requires "App Passwords" (not regular password)
3. Check spam/trash folder
4. Server console should show success message

### Server shows "Error sending weather alert email"
- Check email credentials in `.env`
- Gmail might need 2-factor authentication setup
- App password should be used instead of account password

---

## Quick Setup Checklist

- [ ] Backend running: `npm run dev` (in server folder)
- [ ] Event exists in database
- [ ] At least 1 booking exists for that event
- [ ] `.env` has EMAIL_USER and EMAIL_PASS
- [ ] Gmail/Email service is configured

---

## Test Commands

**Run test script:**
```bash
cd server
node test-weather-notifications.js <EVENT_ID>
```

**Check server logs:**
```
[nodemon] restarting due to changes...
[dotenv@17.2.3] injecting env (15) from .env
Server running on port 5000
MongoDB connected 🚀
✅ Weather alert email sent to: user1@example.com
✅ Weather alert email sent to: user2@example.com
✅ Weather notifications sent: 2 successful, 0 failed
```

---

## Success Indicators

✅ Test script runs without errors  
✅ Server shows "Weather notifications sent: X successful"  
✅ Users receive emails from your email address  
✅ Email contains event details + weather data  
✅ Admin dashboard shows correct notification info  

**Everything working? Notifications are LIVE!** 🎉

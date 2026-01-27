# Weather Alert Module - Quick Test Guide

## ✅ Module Successfully Installed!

All components are now running:
- ✅ Email notifications (Gmail SMTP)
- ✅ SMS notifications (Twilio - requires setup)
- ✅ WhatsApp notifications (Twilio - requires setup)
- ✅ Background weather scheduler
- ✅ Alert history & logging
- ✅ Automation with approvals
- ✅ Role-based access control

---

## 🚀 Quick Start - Testing Without Additional Setup

### Prerequisites
You already have:
- ✅ Server running on port 5000
- ✅ MongoDB connected
- ✅ Email configured (Gmail App Password)

### Still Need (Optional for Full Features):
- OpenWeather API key (FREE) - for live weather data
- Twilio credentials (FREE trial) - for SMS/WhatsApp

---

## 🧪 Test 1: Enable Weather Alerts (Super Admin)

### Step 1: Login as Super Admin
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local",
    "password": "admin123"
  }'
```

Copy the `accessToken` from response.

### Step 2: Enable Weather Alerts Feature
```bash
curl -X POST http://localhost:5000/api/super-admin/weather/toggle \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

Expected Response:
```json
{
  "success": true,
  "message": "Weather alerts enabled system-wide",
  "enabled": true
}
```

### Step 3: Configure System Settings
```bash
curl -X PUT http://localhost:5000/api/super-admin/weather/system-config \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "autoPolling": true,
    "pollingInterval": 60,
    "allowedRoles": ["super_admin", "event_admin"],
    "requireApproval": false
  }'
```

---

## 🧪 Test 2: Configure Weather Alerts for an Event

### Prerequisites
- Have an event ID
- Event must have `latitude` and `longitude` set

### Create Event with Coordinates (if needed)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Outdoor Music Festival",
    "description": "Summer concert",
    "date": "2026-01-25",
    "location": "Mumbai, India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "price": 500,
    "totalTickets": 1000,
    "availableTickets": 1000
  }'
```

### Configure Weather Alerts for Event
```bash
curl -X POST http://localhost:5000/api/weather-alerts/config/EVENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "thresholds": {
      "temperature": {
        "min": 5,
        "max": 38
      },
      "rainfall": 10,
      "windSpeed": 50,
      "humidity": 85
    },
    "alertConditions": {
      "thunderstorm": true,
      "heavyRain": true,
      "snow": true,
      "extremeHeat": true,
      "fog": false,
      "tornado": true
    },
    "notifications": {
      "email": {
        "enabled": true,
        "recipients": {
          "superAdmin": true,
          "eventAdmin": true,
          "staff": false,
          "attendees": false
        }
      },
      "sms": {
        "enabled": false,
        "recipients": {
          "superAdmin": false,
          "eventAdmin": false,
          "staff": false,
          "attendees": false
        }
      }
    },
    "automation": {
      "enabled": true,
      "actions": {
        "markOnHold": {
          "enabled": true,
          "threshold": "caution"
        },
        "markDelayed": {
          "enabled": false,
          "threshold": "warning"
        },
        "markCancelled": {
          "enabled": false,
          "threshold": "warning",
          "requireManualApproval": true
        }
      }
    },
    "pollingInterval": 60
  }'
```

---

## 🧪 Test 3: Manually Trigger Weather Alert

This tests the complete flow WITHOUT needing OpenWeather API:

```bash
curl -X POST http://localhost:5000/api/weather-alerts/trigger/EVENT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"forceNotify": true}'
```

This will:
1. ✅ Fetch current weather for the event location
2. ✅ Check against configured thresholds
3. ✅ Send email notifications to configured recipients
4. ✅ Log the alert in database
5. ✅ Execute automation actions (if configured)

Expected Response:
```json
{
  "success": true,
  "message": "Weather alert triggered successfully",
  "weatherData": {
    "temperature": 28,
    "humidity": 65,
    "windSpeed": 15,
    "weatherCondition": "Clear"
  },
  "notification": {
    "type": "info",
    "hasAlert": false,
    "message": "Weather conditions are normal"
  },
  "notificationResult": {
    "success": true,
    "notificationLog": {
      "email": {
        "sent": 2,
        "failed": 0
      }
    }
  }
}
```

---

## 🧪 Test 4: View Alert History

```bash
curl -X GET "http://localhost:5000/api/weather-alerts/history/EVENT_ID_HERE?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Test 5: View Statistics

```bash
curl -X GET "http://localhost:5000/api/weather-alerts/stats/EVENT_ID_HERE?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Test 6: View System-wide Stats (Super Admin)

```bash
curl -X GET "http://localhost:5000/api/super-admin/weather/stats?days=30" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

---

## 📧 Setting Up OpenWeather API (FREE - Recommended)

### Why You Need This
- Get real weather data for events
- Automatic weather monitoring
- Forecast data for planning

### Steps:
1. Go to: https://openweathermap.org/api
2. Click "Sign Up" (FREE tier available)
3. Verify your email
4. Go to "API Keys" section
5. Copy your API key
6. Add to `.env`:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```
7. Restart server

---

## 📱 Setting Up Twilio (Optional - for SMS/WhatsApp)

### Why You Need This
- Send SMS alerts to admins
- Send WhatsApp notifications
- Multi-channel emergency alerts

### Steps:
1. Go to: https://www.twilio.com/try-twilio
2. Sign up (FREE $15 credit)
3. Get phone number from Twilio
4. Find Account SID and Auth Token in dashboard
5. Add to `.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
6. For WhatsApp: Enable WhatsApp Sandbox
7. Restart server

---

## 🎯 Common Test Scenarios

### Scenario 1: Extreme Heat Alert
```bash
# Simulated extreme heat weather
curl -X POST http://localhost:5000/api/weather/test/notify/EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "message": "☀️ Extreme heat warning! Temperature above 40°C. Stay hydrated!",
    "condition": "Clear",
    "temperature": 42,
    "humidity": 35,
    "windSpeed": 10,
    "rainfall": 0
  }'
```

### Scenario 2: Heavy Rain Alert
```bash
curl -X POST http://localhost:5000/api/weather/test/notify/EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "message": "🌧️ Heavy rainfall expected! Carry umbrellas and rain gear.",
    "condition": "Rain",
    "temperature": 25,
    "humidity": 95,
    "windSpeed": 35,
    "rainfall": 20
  }'
```

### Scenario 3: Thunderstorm Warning
```bash
curl -X POST http://localhost:5000/api/weather/test/notify/EVENT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "message": "⚡ Severe thunderstorm! Seek shelter immediately.",
    "condition": "Thunderstorm",
    "temperature": 28,
    "humidity": 85,
    "windSpeed": 65,
    "rainfall": 30
  }'
```

---

## 🔍 Troubleshooting

### Issue: "Weather alerts feature is disabled"
**Fix**: Run the toggle API to enable it:
```bash
curl -X POST http://localhost:5000/api/super-admin/weather/toggle \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"enabled": true}'
```

### Issue: "Event location coordinates not available"
**Fix**: Update event with latitude/longitude:
```bash
curl -X PUT http://localhost:5000/api/events/EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777
  }'
```

### Issue: "You don't have permission"
**Fix**: Check:
1. You're logged in as Super Admin or Event Admin
2. Feature is enabled system-wide
3. Your role is in `allowedRoles` array

### Issue: No weather data
**Fix**: Add OpenWeather API key to `.env` file

---

## ✅ Success Indicators

You'll know it's working when you see:

1. **Server logs**:
   ```
   Weather alerts scheduler started: every 60 min, lookahead 3 day(s).
   ✅ Weather alert email sent to: admin@example.com
   ```

2. **Email received** with weather alert (check spam folder)

3. **Alert log created** in database (check via history API)

4. **Event status updated** (if automation enabled)

---

## 📊 What to Test

- [ ] Enable feature as Super Admin
- [ ] Configure alert for event
- [ ] Manually trigger alert
- [ ] Check alert history
- [ ] View statistics
- [ ] Acknowledge alert
- [ ] Test automation actions
- [ ] Test with real OpenWeather data
- [ ] Test SMS (if Twilio configured)
- [ ] Test role-based permissions

---

## 🎉 Next Steps

1. **Get OpenWeather API key** (5 minutes, FREE)
2. **Create test event** with coordinates
3. **Book test tickets** for the event
4. **Trigger weather alert** and verify emails
5. **Monitor logs** for automated checks
6. **Configure thresholds** for your use case

---

## 📚 Full Documentation

See [WEATHER_ALERT_MODULE.md](WEATHER_ALERT_MODULE.md) for:
- Complete API reference
- Frontend integration examples
- Production deployment guide
- Security best practices
- Advanced configuration

---

## 🆘 Need Help?

Check the logs in terminal for detailed error messages. Most issues are:
1. Missing API keys (.env file)
2. Feature not enabled
3. Event missing coordinates
4. Wrong authentication token

**Happy Testing! 🌦️**

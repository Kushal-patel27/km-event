# Weather Alert Module - Complete Implementation Guide

## 📋 Overview

Comprehensive weather monitoring and alert system for event management platform with real-time notifications, configurable thresholds, automation, and role-based access control.

---

## 🎯 Features Implemented

### ✅ Core Features
- ✅ Real-time weather data fetching (OpenWeather API)
- ✅ Forecast-based monitoring (3-day lookahead)
- ✅ Configurable alert thresholds per event
- ✅ Multi-channel notifications (Email, SMS, WhatsApp)
- ✅ Role-based notification delivery
- ✅ Alert history & logs with delivery status
- ✅ Dashboard statistics & analytics
- ✅ Feature toggle by Super Admin
- ✅ Background cron scheduler
- ✅ Manual alert triggers
- ✅ Automation actions (mark on hold, delayed, cancelled)
- ✅ Approval workflow for critical actions

### ✅ Security & Access Control
- ✅ Feature-based middleware enforcement
- ✅ Role-based permissions (Super Admin, Event Admin, Staff)
- ✅ Event-specific access control
- ✅ Notification preference management

---

## 📁 File Structure

```
server/
├── models/
│   ├── WeatherAlertConfig.js      # Per-event alert configuration
│   ├── WeatherAlertLog.js         # Alert history & delivery logs
│   ├── SystemConfig.js            # System-wide feature toggles (updated)
│   ├── User.js                    # User notification preferences (updated)
│   └── Event.js                   # Weather status field (updated)
│
├── controllers/
│   ├── weatherAlertController.js        # Alert management APIs
│   └── superAdminWeatherController.js   # System-wide control APIs
│
├── middleware/
│   └── weatherMiddleware.js       # Feature & permission checks
│
├── utils/
│   ├── smsService.js              # Twilio SMS/WhatsApp integration
│   ├── notificationService.js     # Multi-channel orchestrator
│   └── weatherNotifier.js         # Enhanced scheduler (updated)
│
└── routes/
    ├── weatherAlertRoutes.js            # Alert management routes
    └── superAdminWeatherRoutes.js       # Super Admin routes
```

---

## 🗄️ Database Schemas

### WeatherAlertConfig
Stores per-event alert configuration:
- **Thresholds**: temperature (min/max), rainfall, windSpeed, humidity
- **Alert Conditions**: thunderstorm, heavyRain, snow, extremeHeat, fog, tornado
- **Notifications**: Email, SMS, WhatsApp settings per role
- **Automation**: on_hold, delayed, cancelled, entry_restricted
- **Polling Interval**: Custom check frequency

### WeatherAlertLog
Tracks all alerts sent:
- Weather data snapshot
- Notification delivery status (sent/failed per channel)
- Automation actions taken
- Approval status
- Acknowledged status

### SystemConfig (Updated)
System-wide weather alerts configuration:
```javascript
weatherAlerts: {
  enabled: Boolean,           // Global on/off toggle
  autoPolling: Boolean,       // Background scheduler
  pollingInterval: Number,    // Minutes (5-1440)
  allowedRoles: [String],     // Who can manage alerts
  requireApproval: Boolean    // Automation approval required
}
```

### Event (Updated)
Added weather status field:
```javascript
weatherStatus: {
  type: String,
  enum: ['normal', 'on_hold', 'delayed', 'entry_restricted', 'cancelled_weather']
}
```

### User (Updated)
Added notification preferences:
```javascript
notificationPreferences: {
  email: Boolean,
  sms: Boolean,
  whatsapp: Boolean,
  push: Boolean,
  weatherAlerts: Boolean
},
phone: String  // For SMS/WhatsApp
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```powershell
cd server
npm install twilio
```

### 2. Configure Environment Variables

Update `server/.env`:

```env
# Email (Gmail App Password) - Already configured
EMAIL_USER=k.m.easyevents@gmail.com
EMAIL_PASS=pxkbsxmqhfhamjmw

# OpenWeather API (Required for weather data)
OPENWEATHER_API_KEY=your_api_key_here

# Twilio (Optional - for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886

# Weather Alerts Settings
WEATHER_ALERTS_ENABLED=true
WEATHER_ALERTS_INTERVAL_MINUTES=60
WEATHER_ALERTS_LOOKAHEAD_DAYS=3
```

#### Getting OpenWeather API Key (FREE):
1. Visit: https://openweathermap.org/api
2. Sign up for free account
3. Go to API Keys section
4. Copy your API key
5. Paste in `.env` file

#### Getting Twilio Credentials (Optional - for SMS/WhatsApp):
1. Visit: https://www.twilio.com/try-twilio
2. Sign up for free trial ($15 credit)
3. Get Account SID and Auth Token from dashboard
4. Get a phone number for SMS
5. Enable WhatsApp sandbox for testing

### 3. Run Server

```powershell
cd server
npm run dev
```

The weather alerts scheduler will start automatically!

---

## 📡 API Endpoints

### Super Admin APIs

#### Toggle Feature On/Off
```http
POST /api/super-admin/weather/toggle
Authorization: Bearer <super_admin_token>

{
  "enabled": true
}
```

#### Get System Configuration
```http
GET /api/super-admin/weather/system-config
Authorization: Bearer <super_admin_token>
```

#### Update System Configuration
```http
PUT /api/super-admin/weather/system-config
Authorization: Bearer <super_admin_token>

{
  "enabled": true,
  "autoPolling": true,
  "pollingInterval": 60,
  "allowedRoles": ["super_admin", "event_admin"],
  "requireApproval": true
}
```

#### Get System-wide Statistics
```http
GET /api/super-admin/weather/stats?days=30
Authorization: Bearer <super_admin_token>
```

#### Get All Event Configurations
```http
GET /api/super-admin/weather/configs?page=1&limit=20&enabled=true
Authorization: Bearer <super_admin_token>
```

#### Get Pending Approvals
```http
GET /api/super-admin/weather/pending-approvals
Authorization: Bearer <super_admin_token>
```

#### Bulk Toggle Alerts
```http
POST /api/super-admin/weather/bulk-toggle
Authorization: Bearer <super_admin_token>

{
  "eventIds": ["event_id_1", "event_id_2"],
  "enabled": true
}
```

### Event Admin/Weather Management APIs

#### Create/Update Alert Configuration
```http
POST /api/weather-alerts/config/:eventId
Authorization: Bearer <token>

{
  "enabled": true,
  "thresholds": {
    "temperature": { "min": 0, "max": 40 },
    "rainfall": 10,
    "windSpeed": 50,
    "humidity": 90
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
        "staff": true,
        "attendees": false
      }
    },
    "sms": {
      "enabled": false,
      "recipients": {
        "superAdmin": true,
        "eventAdmin": false,
        "staff": false,
        "attendees": false
      }
    }
  },
  "automation": {
    "enabled": true,
    "actions": {
      "markOnHold": { "enabled": true, "threshold": "caution" },
      "markDelayed": { "enabled": false, "threshold": "warning" },
      "markCancelled": {
        "enabled": false,
        "threshold": "warning",
        "requireManualApproval": true
      }
    }
  },
  "pollingInterval": 60,
  "alertTemplate": "⚠️ Weather Alert for {eventName}: {weatherCondition}. Temperature: {temperature}°C. Take precautions!"
}
```

#### Get Alert Configuration
```http
GET /api/weather-alerts/config/:eventId
Authorization: Bearer <token>
```

#### Manually Trigger Alert
```http
POST /api/weather-alerts/trigger/:eventId
Authorization: Bearer <token>

{
  "forceNotify": false  // true to send even if thresholds not exceeded
}
```

#### Get Alert History
```http
GET /api/weather-alerts/history/:eventId?page=1&limit=20&alertType=warning&acknowledged=false
Authorization: Bearer <token>
```

#### Acknowledge Alert
```http
PATCH /api/weather-alerts/acknowledge/:alertId
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/weather-alerts/stats/:eventId?days=30
Authorization: Bearer <token>
```

#### Approve Automation Action
```http
POST /api/weather-alerts/approve/:alertId/:actionIndex
Authorization: Bearer <super_admin_token>
```

---

## 🔄 Workflow Examples

### Example 1: Enable Weather Alerts for an Event

**Step 1**: Super Admin enables feature system-wide
```bash
curl -X POST http://localhost:5000/api/super-admin/weather/toggle \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

**Step 2**: Event Admin configures alerts for their event
```bash
curl -X POST http://localhost:5000/api/weather-alerts/config/EVENT_ID \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "thresholds": {
      "temperature": {"min": 5, "max": 38},
      "rainfall": 15,
      "windSpeed": 50
    },
    "notifications": {
      "email": {
        "enabled": true,
        "recipients": {
          "superAdmin": true,
          "eventAdmin": true,
          "attendees": true
        }
      }
    }
  }'
```

**Step 3**: System automatically checks weather every hour and sends alerts if thresholds exceeded

### Example 2: Manual Alert Trigger

```bash
curl -X POST http://localhost:5000/api/weather-alerts/trigger/EVENT_ID \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"forceNotify": true}'
```

### Example 3: View Alert History

```bash
curl -X GET http://localhost:5000/api/weather-alerts/history/EVENT_ID?page=1&limit=10 \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Response Examples

### Alert Log Response
```json
{
  "success": true,
  "weatherData": {
    "temperature": 42,
    "feelsLike": 45,
    "humidity": 35,
    "windSpeed": 15,
    "rainfall": 0,
    "weatherCondition": "Clear",
    "weatherDescription": "clear sky"
  },
  "notification": {
    "type": "warning",
    "hasAlert": true,
    "message": "⚠️ Extreme heat warning! Temperature above 40°C"
  },
  "notificationResult": {
    "success": true,
    "notificationLog": {
      "email": {
        "sent": 15,
        "failed": 0,
        "recipients": [...]
      },
      "sms": {
        "sent": 3,
        "failed": 0,
        "recipients": [...]
      }
    }
  },
  "alertLog": {
    "_id": "...",
    "event": "...",
    "alertType": "warning",
    "weatherCondition": "Clear",
    "message": "⚠️ Extreme heat warning!",
    "triggeredBy": "manual",
    "createdAt": "2026-01-20T10:00:00Z",
    "automationActions": [
      {
        "action": "markOnHold",
        "executed": true,
        "executedAt": "2026-01-20T10:00:01Z",
        "requiresApproval": false
      }
    ]
  }
}
```

### Statistics Response
```json
{
  "success": true,
  "stats": {
    "period": "Last 30 days",
    "totalAlerts": 25,
    "acknowledgedAlerts": 20,
    "unacknowledgedAlerts": 5,
    "byType": [
      { "_id": "warning", "count": 10 },
      { "_id": "caution", "count": 15 }
    ],
    "notifications": {
      "totalEmailSent": 350,
      "totalEmailFailed": 5,
      "totalSmsSent": 45,
      "totalSmsFailed": 2
    }
  }
}
```

---

## ⚙️ Configuration Guide

### Alert Thresholds

Configure per-event thresholds:

```javascript
{
  "thresholds": {
    "temperature": {
      "min": 0,    // Alert if below 0°C
      "max": 40    // Alert if above 40°C
    },
    "rainfall": 10,      // Alert if > 10mm
    "windSpeed": 50,     // Alert if > 50 km/h
    "humidity": 90       // Alert if > 90%
  }
}
```

### Alert Conditions

Enable/disable specific weather conditions:

```javascript
{
  "alertConditions": {
    "thunderstorm": true,   // Trigger on thunderstorm
    "heavyRain": true,      // Trigger on heavy rain
    "snow": true,           // Trigger on snow
    "extremeHeat": true,    // Trigger on extreme heat
    "fog": false,           // Don't trigger on fog
    "tornado": true         // Trigger on tornado warning
  }
}
```

### Notification Recipients

Configure who receives notifications:

```javascript
{
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": {
        "superAdmin": true,     // Always notify super admins
        "eventAdmin": true,     // Notify event organizers
        "staff": true,          // Notify assigned staff
        "attendees": false      // Don't notify ticket holders (unless critical)
      }
    },
    "sms": {
      "enabled": true,
      "recipients": {
        "superAdmin": true,     // SMS to super admins
        "eventAdmin": false,    // No SMS to event admins
        "staff": false,
        "attendees": false
      }
    }
  }
}
```

### Automation Actions

Configure automatic event status changes:

```javascript
{
  "automation": {
    "enabled": true,
    "actions": {
      "markOnHold": {
        "enabled": true,
        "threshold": "caution"   // Trigger on caution or warning
      },
      "markDelayed": {
        "enabled": true,
        "threshold": "warning"   // Only on warning
      },
      "markCancelled": {
        "enabled": false,
        "threshold": "warning",
        "requireManualApproval": true  // Super Admin must approve
      },
      "restrictEntry": {
        "enabled": true,
        "threshold": "warning"
      }
    }
  }
}
```

---

## 🎨 Frontend Integration Guide

### Dashboard Widget Example

```javascript
// Fetch weather status for event
async function getWeatherStatus(eventId) {
  const response = await fetch(`/api/weather/${eventId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Display weather widget
function WeatherWidget({ eventId }) {
  const [weather, setWeather] = useState(null);
  
  useEffect(() => {
    getWeatherStatus(eventId).then(setWeather);
  }, [eventId]);
  
  return (
    <div className="weather-widget">
      {weather?.notification?.hasAlert && (
        <div className={`alert alert-${weather.notification.type}`}>
          {weather.notification.message}
        </div>
      )}
      <div className="weather-stats">
        <p>🌡️ {weather?.currentWeather?.temperature}°C</p>
        <p>💨 {weather?.currentWeather?.windSpeed} km/h</p>
        <p>💧 {weather?.currentWeather?.humidity}%</p>
      </div>
    </div>
  );
}
```

### Super Admin Toggle Example

```javascript
// Toggle weather alerts feature
async function toggleWeatherAlerts(enabled) {
  const response = await fetch('/api/super-admin/weather/toggle', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled })
  });
  return response.json();
}

// Super Admin Settings Component
function WeatherSettings() {
  const [enabled, setEnabled] = useState(false);
  
  const handleToggle = async () => {
    const result = await toggleWeatherAlerts(!enabled);
    if (result.success) {
      setEnabled(!enabled);
      toast.success(`Weather alerts ${!enabled ? 'enabled' : 'disabled'}`);
    }
  };
  
  return (
    <div className="settings-card">
      <h3>Weather Alerts Module</h3>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
        />
        <span>Enable Weather Alerts</span>
      </label>
    </div>
  );
}
```

---

## 🧪 Testing

### Test 1: Manual Alert Trigger
```bash
curl -X POST http://localhost:5000/api/weather-alerts/trigger/EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"forceNotify": true}'
```

### Test 2: Check Alert History
```bash
curl -X GET http://localhost:5000/api/weather-alerts/history/EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: View System Stats
```bash
curl -X GET http://localhost:5000/api/super-admin/weather/stats \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 🔐 Security Features

1. **Feature Toggle**: Super Admin can enable/disable entire module
2. **Role-Based Access**: Only authorized roles can manage alerts
3. **Event-Specific Access**: Event Admins can only configure their events
4. **Approval Workflow**: Critical actions require Super Admin approval
5. **Audit Trail**: All alerts and actions logged with timestamps
6. **User Preferences**: Users can opt-out of notifications

---

## 📈 Monitoring & Logs

All alerts are logged to `WeatherAlertLog` collection with:
- Weather data snapshot
- Notification delivery status
- Automation actions executed
- Timestamps and user attribution
- Acknowledgement status

View logs via:
```bash
curl -X GET http://localhost:5000/api/weather-alerts/history/EVENT_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 🚀 Production Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
EMAIL_USER=production@email.com
EMAIL_PASS=app_password
OPENWEATHER_API_KEY=prod_api_key
TWILIO_ACCOUNT_SID=prod_account_sid
TWILIO_AUTH_TOKEN=prod_auth_token
WEATHER_ALERTS_ENABLED=true
WEATHER_ALERTS_INTERVAL_MINUTES=30
```

### Recommended Settings
- Polling Interval: 30-60 minutes
- Lookahead: 3 days
- Enable approval for cancellation actions
- SMS only for critical alerts (warning level)
- Email for all alert levels

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Email authentication fails
- **Fix**: Check Gmail App Password setup in [GMAIL_SMTP_SETUP.md](GMAIL_SMTP_SETUP.md)

**Issue**: SMS not sending
- **Fix**: Verify Twilio credentials, ensure phone numbers in E.164 format (+1234567890)

**Issue**: Weather data not updating
- **Fix**: Check OpenWeather API key, verify event has latitude/longitude

**Issue**: Alerts not triggering
- **Fix**: Ensure feature is enabled in system config, check event configuration is enabled

---

## ✨ Summary

You now have a **production-ready Weather Alert Module** with:
- ✅ Real-time monitoring
- ✅ Multi-channel notifications
- ✅ Configurable thresholds
- ✅ Automation with approval workflow
- ✅ Role-based access control
- ✅ Comprehensive logging & analytics
- ✅ Super Admin control panel
- ✅ Event-level customization

**Start the server and begin monitoring weather for your events!** 🌦️

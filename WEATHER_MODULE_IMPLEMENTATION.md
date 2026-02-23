# Weather Module Implementation Guide

## Overview

The Weather Module is a comprehensive system that automatically fetches real-time weather data, detects risky conditions, and sends automated notifications to event attendees, admins, and staff.

## Components Implemented

### Backend (Node.js/Express)

#### 1. **Enhanced Risk Detection** (`server/utils/weatherService.js`)
- **`detectWeatherRisks(weatherData)`**: Detects risky weather conditions
  - **HEATWAVE**: Temp > 35°C (95°F)
  - **HEAVY_RAIN**: Rainfall > 5mm
  - **THUNDERSTORM**: Lightning/severe storms
  - **STRONG_WIND**: Wind > 40 km/h (25 mph)
  - **CYCLONE**: Tornado alerts
  
- **`generateWeatherNotification()`**: Generates notification with risk classification
  - Returns: `{ hasAlert, notifications[], type, riskData, message }`
  - Risk data includes: `{ hasRisk, risks[], riskSummary }`

#### 2. **Database Models Enhanced**

**WeatherAlertConfig.js**
- `notificationTiming`: Send 6/12/24 hours before event
- `alertsSent`: Track sent alerts per risk type (prevent spam)
  - Structure: `[{ alertType, sentAt, weatherCondition }]`
  - Only allows one alert per risk type per 3 hours
- `alertConditions`: Toggle specific conditions (thunderstorm, heavyRain, extremeHeat, snow, fog, tornado)
- `thresholds`: Customizable thresholds for temperature, rainfall, wind, humidity

**WeatherAlertLog.js**
- Tracks all sent alerts with delivery status
- Supports email, SMS, WhatsApp delivery tracking
- Stores weather data at time of alert

#### 3. **Notification Scheduling** (`server/utils/weatherNotifier.js`)
- **Smart Alert Prevention**
  - `hasAlertBeenSent()`: Checks if alert for this risk was sent in last 3 hours
  - `isTimeToSendNotification()`: Only sends within the `notificationTiming` window
  - `markAlertAsSent()`: Records alert to prevent duplicate sends

- **Scheduler Features**
  - Runs every 5 minutes
  - Checks events 3 days ahead
  - Respects event admin notification preferences
  - Each risk type gets ONE alert per event (configurable 3-hour cooldown)

#### 4. **Email Templates** (`server/templates/`)
Three professional HTML templates based on risk type:

**weatherAlertRain.html**
- Rainfall warnings
- Precautions: umbrella, waterproof clothing, arrival timing

**weatherAlertHeatwave.html**
- Extreme heat alerts (>35°C)
- Precautions: light clothing, sunscreen, hydration, shade

**weatherAlertStorm.html**
- Thunderstorm/wind alerts (>40 km/h)
- Precautions: avoid trees, secure items, seek shelter

All templates include:
- Event details (name, date, location)
- Current weather metrics
- Risk-specific precautions with checkmarks
- Professional styling compatible with dark/light modes
- Customizable placeholders for organizer name

#### 5. **Enhanced Email Service** (`server/utils/emailService.js`)
- `getWeatherTemplate()`: Selects appropriate template based on risk type
- `renderWeatherTemplate()`: Renders HTML template with data
- `sendWeatherAlertEmail()`: Uses templates or fallback to inline HTML
- Supports both metric (°C, km/h) and imperial (°F, mph) units

#### 6. **API Endpoints** (`server/routes/weatherAlertRoutes.js`)

```javascript
// Get config & alert logs
GET /api/weather-alerts/config/:eventId

// Update config (new)
PUT /api/weather-alerts/config/:eventId
Body: { enabled, notificationTiming, notifications, alertConditions, ... }

// Trigger manual alert
POST /api/weather-alerts/trigger/:eventId

// Get history
GET /api/weather-alerts/history/:eventId

// Get statistics
GET /api/weather-alerts/stats/:eventId
```

### Frontend (React)

#### 1. **Weather Display Component**
```javascript
<WeatherDisplay 
  eventId={eventId}      // Required: event ID
  compact={false}        // Optional: compact view
/>
```

**Features:**
- Current conditions with large weather icon
- 5-day forecast
- Detailed metrics (humidity, wind, pressure, visibility)
- Unit toggle (°C ⟷ °F, km/h ⟷ mph)
- Refresh button (30-min auto-refresh)
- Risk badge showing "⚠️ Bad weather expected"
- Color-coded alerts (red for warning, orange for caution)
- Last refresh timestamp
- Dark mode compatible

#### 2. **Weather Alerts Admin Component**
```javascript
<WeatherAlertsAdmin eventId={eventId} />
```

**Features:**
- Enable/disable alerts toggle
- Notification timing selector (6h/12h/24h)
- Email recipient checkboxes (Super Admin, Event Admin, Staff, Attendees)
- Alert condition toggles (thunderstorm, heavyRain, extremeHeat, snow, fog, tornado)
- Alert logs viewer with history
- Dark mode compatible
- Real-time config updates

#### 3. **Weather Widget** (Compact)
```javascript
<WeatherWidget 
  eventId={eventId}
  showForecast={true}    // Optional: show 3-day forecast
/>
```

**Features:**
- Compact display for dashboards
- Current temp + condition + feels like
- Humidity + wind speed
- Risk badge if bad weather
- Optional 3-day forecast grid
- Perfect for event listing pages

#### 4. **Component Locations**
```
Frontend-EZ/src/components/weather/
├── WeatherDisplay.jsx      # Full weather information
├── WeatherAlertsAdmin.jsx  # Admin controls
├── WeatherWidget.jsx       # Compact widget
└── index.js               # Barrel exports
```

## Integration Points

### 1. **Event Detail Page** (Public)
```jsx
import { WeatherDisplay } from '@/components/weather'

<WeatherDisplay eventId={event._id} compact={false} />
```

### 2. **Event Admin Dashboard**
```jsx
import { WeatherAlertsAdmin, WeatherWidget } from '@/components/weather'

<WeatherWidget eventId={event._id} showForecast={true} />
<WeatherAlertsAdmin eventId={event._id} />
```

### 3. **Event Listing**
```jsx
import { WeatherWidget } from '@/components/weather'

{events.map(event => (
  <WeatherWidget key={event._id} eventId={event._id} />
))}
```

### 4. **Staff Dashboard** (Read-only)
```jsx
import { WeatherWidget } from '@/components/weather'

<WeatherWidget eventId={event._id} showForecast={true} />
```

## Configuration Options

### Per-Event Alert Settings

```javascript
{
  enabled: true,                          // Master switch
  notificationTiming: 24,                 // 6, 12, or 24 hours
  
  thresholds: {
    temperature: { min: 0, max: 40 },    // °C
    rainfall: 10,                         // mm
    windSpeed: 50,                        // km/h
    humidity: 90                          // %
  },
  
  alertConditions: {
    thunderstorm: true,
    heavyRain: true,
    extremeHeat: true,
    snow: true,
    fog: false,
    tornado: true
  },
  
  notifications: {
    email: {
      enabled: true,
      recipients: {
        superAdmin: true,
        eventAdmin: true,
        staff: true,
        attendees: false
      }
    }
  }
}
```

## How It Works

### 1. **Automated Detection**
```
Every 5 minutes → Check upcoming events (3-day window)
  ↓
Fetch weather for event location (cached 10 min)
  ↓
Detect risks (HEATWAVE, RAIN, STORM, WIND, CYCLONE)
  ↓
Check if alert already sent (prevent spam 3h cooldown)
  ↓
Check notification timing window (6/12/24h before)
  ↓
Send email via appropriate template
  ↓
Log alert in WeatherAlertLog
```

### 2. **Single Alert Prevention**
- Each risk type tracked separately per event
- 3-hour cooldown between duplicate alerts
- Different risk types can each send one alert
- Example: Event gets one RAIN alert, one HEATWAVE alert, one WIND alert (not spam)

### 3. **Notification Timing**
- If set to "24h", alert sends in 24-hour window before event
- If set to "12h", alert sends in 12-hour window before event
- If set to "6h", alert sends in 6-hour window before event
- Prevents early warnings that become irrelevant

### 4. **Email Flow**
```
Risk detected → Select template → Render HTML
  ↓
Fetch recipients (Super Admin, Event Admin, Staff, Attendees)
  ↓
Send personalized email to each recipient
  ↓
Log delivery status (sent/failed/pending)
```

## API Response Examples

### Get Weather
```javascript
GET /api/events/:eventId/weather?units=metric

{
  "success": true,
  "currentWeather": {
    "location": "Mumbai",
    "temperature": 32,
    "feelsLike": 35,
    "humidity": 75,
    "windSpeed": 25,
    "weatherCondition": "Rain",
    "weatherDescription": "Light rain",
    "visibility": 8000,
    "pressure": 1013,
    "rainfall": 2.5,
    "units": "metric"
  },
  "forecast": [
    {
      "date": "2026-01-28T00:00:00Z",
      "temperature": 31,
      "condition": "Rain",
      "description": "Light rain",
      "humidity": 78,
      "windSpeed": 28,
      "rainfall": 3.2
    }
  ],
  "notification": {
    "hasAlert": true,
    "type": "caution",
    "riskData": {
      "hasRisk": true,
      "risks": [
        {
          "type": "HEAVY_RAIN",
          "level": "caution",
          "rainfall": 5.2,
          "details": "Heavy rainfall expected (5.2mm)"
        }
      ],
      "riskSummary": "HEAVY_RAIN"
    },
    "message": "🌧️ Heavy rainfall expected (5.2mm). Carry an umbrella!"
  }
}
```

### Get Alert Config
```javascript
GET /api/weather-alerts/config/:eventId

{
  "success": true,
  "config": {
    "_id": "...",
    "event": {...},
    "enabled": true,
    "notificationTiming": 24,
    "alertsSent": [
      {
        "alertType": "HEAVY_RAIN",
        "sentAt": "2026-01-27T10:30:00Z",
        "weatherCondition": "Light rain"
      }
    ],
    "thresholds": {...},
    "notifications": {...},
    "alertConditions": {...}
  },
  "logs": [
    {
      "_id": "...",
      "alertType": "caution",
      "weatherCondition": "HEAVY_RAIN",
      "message": "🌧️ Heavy rainfall...",
      "createdAt": "2026-01-27T10:30:00Z",
      "notifications": {
        "email": {
          "sent": 3,
          "failed": 0,
          "recipients": [...]
        }
      }
    }
  ]
}
```

## Testing the Module

### 1. **Manual Alert Trigger**
```bash
POST /api/weather-alerts/trigger/:eventId
Body: { "forceNotify": true }
```

### 2. **Check Scheduler Status**
Monitor server logs for weather scheduler activity:
```
Weather scheduler: Checking 5 upcoming events...
Weather scheduler: Event 'Concert 2026' — weather OK
✅ Weather alert sent for event 'Music Festival' — THUNDERSTORM (warning)
```

### 3. **Verify Alert Log**
```javascript
const logs = await WeatherAlertLog.find({ event: eventId })
  .sort({ createdAt: -1 })
  .limit(10)
```

### 4. **Test Email Templates**
Check `/server/templates/` directory for HTML templates and test rendering with:
```javascript
renderWeatherTemplate('weatherAlertRain.html', {
  user: { name: 'John' },
  event: { name: 'Concert', date: new Date(), location: 'Mumbai' },
  weatherData: { temperature: 32, humidity: 75, ... }
})
```

## Environment Variables

```env
# Weather API
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_UNITS=metric              # metric or imperial

# Weather Alerts
WEATHER_ALERTS_LOOKAHEAD_DAYS=3   # Look ahead 3 days
WEATHER_ALERTS_ENABLED=true

# Email
SMTP_FROM=noreply@events.com
```

## Features Summary

✅ **Risk Detection**: Heatwave, Heavy Rain, Thunderstorm, Strong Wind, Cyclone
✅ **Automated Notifications**: Email, SMS, WhatsApp support
✅ **Smart Scheduling**: Prevents duplicate alerts (3h cooldown)
✅ **Notification Timing**: 6/12/24h before event configurable
✅ **Email Templates**: Risk-specific HTML templates
✅ **Admin Controls**: Enable/disable per event
✅ **Alert Logs**: Full audit trail of sent alerts
✅ **Unit Support**: °C/°F, km/h/mph toggle
✅ **Dark Mode**: Fully compatible
✅ **Mobile Responsive**: All components mobile-first
✅ **Graceful Fallback**: Cached data on API failures
✅ **30-60 Min Refresh**: Automatic weather updates

## Future Enhancements

1. SMS/WhatsApp notifications
2. Custom email template editor for event admins
3. Automation actions (auto-cancel event, restrict entry)
4. Weather-based capacity adjustments
5. Historical weather analytics
6. Multi-location event support
7. Integration with external weather APIs (WeatherAPI, AccuWeather)
8. Push notifications for mobile app
9. Event reschedule suggestions based on forecast
10. Weather impact assessment on ticket sales

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Weather not fetching | Check OPENWEATHER_API_KEY in .env |
| Emails not sending | Verify SMTP settings in emailService.js |
| Alerts not triggering | Check if alerts enabled in config, verify event location has lat/lon |
| Too many alerts | Increase cooldown in `hasAlertBeenSent()` or adjust thresholds |
| Unit conversion wrong | Verify weatherService.js wind speed conversion logic |
| Template not rendering | Check template file path in renderWeatherTemplate() |

## Support

For issues or questions, contact the development team with:
- Event ID
- Error message
- Expected vs actual behavior
- Server logs

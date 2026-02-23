# Weather Module - Quick Reference

## Import & Use

### Display Current Weather
```jsx
import { WeatherDisplay } from '@/components/weather'

<WeatherDisplay eventId={event._id} compact={false} />
```

### Compact Weather Widget
```jsx
import { WeatherWidget } from '@/components/weather'

<WeatherWidget eventId={event._id} showForecast={true} />
```

### Admin Weather Controls
```jsx
import { WeatherAlertsAdmin } from '@/components/weather'

<WeatherAlertsAdmin eventId={event._id} />
```

## Backend APIs

### Get Current Weather & Forecast
```javascript
GET /api/events/:eventId/weather?units=metric

Response: {
  success: true,
  currentWeather: { temp, humidity, windSpeed, ... },
  forecast: [ { date, temp, condition, ... }, ... ],
  notification: { hasAlert, type, riskData, message }
}
```

### Get/Update Alert Config
```javascript
GET /api/weather-alerts/config/:eventId
PUT /api/weather-alerts/config/:eventId

PUT Body:
{
  enabled: true,
  notificationTiming: 24,    // 6, 12, or 24
  notifications: { email: { recipients: { ... } } },
  alertConditions: { thunderstorm, heavyRain, ... }
}
```

### Trigger Manual Alert
```javascript
POST /api/weather-alerts/trigger/:eventId
{ "forceNotify": true }
```

## Risk Types Detected

| Type | Condition | Alert Level |
|------|-----------|-------------|
| HEATWAVE | Temp > 35°C (95°F) | Warning/Caution |
| HEAVY_RAIN | Rainfall > 5mm | Warning/Caution |
| THUNDERSTORM | Lightning detected | Warning |
| STRONG_WIND | Wind > 40 km/h | Warning/Caution |
| CYCLONE | Tornado alert | Warning |

## Configuration

### Default Thresholds
- Temperature: 0–40°C
- Rainfall: 10mm
- Wind Speed: 50 km/h
- Humidity: 90%

### Per-Event Settings
- **Enable/Disable**: Master switch
- **Timing**: Send 6/12/24 hours before
- **Recipients**: Super Admin, Event Admin, Staff, Attendees
- **Conditions**: Toggle each risk type

## Email Templates

| Template | Triggered By | Precautions |
|----------|--------------|-------------|
| weatherAlertRain.html | Heavy rain | Umbrella, waterproof shoes |
| weatherAlertHeatwave.html | Extreme heat (>35°C) | Light clothes, sunscreen |
| weatherAlertStorm.html | Thunderstorm/wind | Shelter, avoid trees |

## Smart Features

✅ **Single Alert Per Risk**: Only one email per risk type per event (3h cooldown)
✅ **Notification Timing**: Respects event admin's preferred time window
✅ **Risk Classification**: Each risk gets its own template & precautions
✅ **Unit Toggle**: Users can switch °C ↔ °F, km/h ↔ mph
✅ **Auto Refresh**: Weather updates every 30 minutes
✅ **Dark Mode**: Full dark mode support
✅ **Mobile Responsive**: Fully responsive design

## Testing

### Check Alerts via Frontend
1. Go to event detail page
2. Scroll to Weather Information section
3. Click "Refresh" button
4. Risk badge appears if bad weather detected

### Check Alert Logs
1. Go to Event Admin Dashboard
2. Open Weather Alerts Admin section
3. Click "Alert Logs" to see history

### Manual Trigger
```bash
curl -X POST https://api.example.com/api/weather-alerts/trigger/:eventId \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"forceNotify": true}'
```

## Customization

### Change Risk Thresholds
```javascript
// Update WeatherAlertConfig
{
  thresholds: {
    temperature: { min: 5, max: 45 },  // Custom range
    rainfall: 15,                        // More tolerant
    windSpeed: 60,                       // Higher threshold
    humidity: 95                         // More tolerant
  }
}
```

### Customize Email Templates
Edit HTML templates in `/server/templates/`:
- `weatherAlertRain.html`
- `weatherAlertHeatwave.html`
- `weatherAlertStorm.html`

Use placeholders:
- `{{eventName}}`
- `{{eventDate}}`
- `{{eventLocation}}`
- `{{temperature}}`
- `{{humidity}}`
- `{{windSpeed}}`
- `{{rainfall}}`
- `{{userName}}`
- `{{organizerName}}`

### Change Notification Timing
```javascript
// Options: 6, 12, or 24 hours
const config = { notificationTiming: 12 }  // 12 hours before
```

## Troubleshooting

### Weather Not Showing
1. Check event has latitude/longitude
2. Verify OPENWEATHER_API_KEY in .env
3. Check API rate limits

### No Alerts Sent
1. Check alert `enabled: true`
2. Verify alert conditions are enabled
3. Check recipient email preferences
4. Look at WeatherAlertLog

### Wrong Units
- Frontend: Unit toggle button (°C/°F)
- Backend: Pass `?units=imperial` to API

### Too Many Emails
- Increase 3-hour cooldown in `hasAlertBeenSent()`
- Adjust risk thresholds
- Disable specific alert conditions

## File Locations

**Backend**
- Risk detection: `/server/utils/weatherService.js`
- Scheduling: `/server/utils/weatherNotifier.js`
- Email service: `/server/utils/emailService.js`
- API routes: `/server/routes/weatherAlertRoutes.js`
- Controllers: `/server/controllers/weatherAlertController.js`
- Models: `/server/models/Weather*.js`
- Templates: `/server/templates/weatherAlert*.html`

**Frontend**
- Display: `/Frontend-EZ/src/components/weather/WeatherDisplay.jsx`
- Widget: `/Frontend-EZ/src/components/weather/WeatherWidget.jsx`
- Admin: `/Frontend-EZ/src/components/weather/WeatherAlertsAdmin.jsx`

## Next Steps

1. **Integration**: Add components to event pages
2. **Testing**: Test with real events and weather data
3. **Customization**: Adjust thresholds per location/event type
4. **Monitoring**: Track alert delivery and effectiveness
5. **Enhancement**: Add SMS/WhatsApp notifications

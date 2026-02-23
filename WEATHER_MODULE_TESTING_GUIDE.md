# Weather Module Testing Guide

## Testing Overview
This guide covers end-to-end testing of the Weather Module including API, database, notifications, and email delivery.

## Prerequisites
- ✅ OPENWEATHER_API_KEY configured in `.env` (already set to: `2c9031977cdda5b13a7ea67bfed96304`)
- ✅ Email service configured (Gmail SMTP with app password)
- ✅ MongoDB connected
- ✅ Backend server running on port 5000
- ✅ Frontend running on port 5173

## Test 1: Verify Weather API Integration

### Step 1: Test OpenWeather API Connection
```bash
# In your terminal, test the API directly
curl "https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&units=metric&appid=2c9031977cdda5b13a7ea67bfed96304"
```

Expected response: JSON with `main`, `weather`, `wind` objects containing temperature, weather conditions, wind speed, etc.

### Step 2: Test Weather Endpoint from Backend
1. Create a test event in the database with:
   - `title`: "Test Weather Event"
   - `location`: "New York"
   - `latitude`: 40.7128
   - `longitude`: -74.0060
   - `date`: Any future date

2. Call the weather endpoint:
```bash
GET http://localhost:5000/api/weather/event/{eventId}
```

Expected response:
```json
{
  "success": true,
  "data": {
    "eventId": "...",
    "location": "New York",
    "current": {
      "temp": 25,
      "feelsLike": 24,
      "condition": "Partly Cloudy",
      "humidity": 65,
      "windSpeed": 12,
      "pressure": 1013,
      "visibility": 10000,
      "uvIndex": 5
    },
    "forecast": [
      { "date": "2024-01-15", "high": 28, "low": 18, "condition": "Sunny", "windSpeed": 10 },
      ...
    ],
    "risks": []
  }
}
```

### Step 3: Test Event Detail Page
1. Navigate to an event detail page: `http://localhost:5173/event/{eventId}`
2. Verify:
   - ✅ WeatherDisplay component loads below the event description
   - ✅ Current weather shows (temperature, feels-like, humidity, wind, pressure, visibility)
   - ✅ 5-day forecast grid displays with weather icons
   - ✅ Unit toggle (°C↔°F, km/h↔mph) works correctly
   - ✅ Refresh button works and fetches latest data
   - ✅ Auto-refresh happens every 30 minutes
   - ✅ Component respects dark mode styling
   - ✅ Mobile responsive layout works

### Step 4: Test Event Listing Page
1. Navigate to events listing: `http://localhost:5173/events`
2. Verify:
   - ✅ WeatherWidget appears on each event card
   - ✅ Shows current weather with icon
   - ✅ Shows risk alert badge if bad weather detected
   - ✅ Compact widget doesn't break card layout
   - ✅ Dark mode styling applied

### Step 5: Test My Bookings Page
1. Navigate to: `http://localhost:5173/my-bookings`
2. Expand an event section
3. Verify:
   - ✅ WeatherWidget displays after event details
   - ✅ Shows weather for booked event locations
   - ✅ Mobile responsive layout

## Test 2: Weather Risk Detection

### Test Different Weather Conditions
Create test events in different locations with different weather conditions:

**Test Location 1: Hot Climate (Heatwave Risk)**
- Location: Phoenix, Arizona (or any hot city)
- Latitude: 33.4484
- Longitude: -112.0742
- Expected risk: HEATWAVE (if temp > 35°C)

**Test Location 2: Rainy Climate (Heavy Rain Risk)**
- Location: Seattle, Washington
- Latitude: 47.6062
- Longitude: -122.3321
- Expected risk: HEAVY_RAIN (if precipitation > 5mm)

**Test Location 3: Stormy Climate (Thunderstorm Risk)**
- Location: Miami, Florida
- Latitude: 25.7617
- Longitude: -80.1918
- Expected risk: THUNDERSTORM (if thunderstorm detected)

**Test Location 4: Windy Climate (Strong Wind Risk)**
- Location: Chicago, Illinois
- Latitude: 41.8781
- Longitude: -87.6298
- Expected risk: STRONG_WIND (if wind > 40 km/h)

### Verify Risk Detection
1. Go to EventAdminDashboard: `http://localhost:5173/event-admin/dashboard`
2. Check Weather Alerts section
3. Verify risks are correctly identified based on conditions

## Test 3: Email Notification Testing

### Step 1: Configure Test Event
Create an event with:
- Date: Within next 3 days
- Location: A real city (for weather data)
- Add contact email for notifications

### Step 2: Manually Trigger Weather Alert
```bash
# Make a POST request to trigger a weather alert
curl -X POST http://localhost:5000/api/weather-alerts/trigger/{eventId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {auth_token}" \
  -d '{
    "alertType": "HEATWAVE",
    "riskLevel": "high",
    "details": "Temperature exceeding 35°C with no relief expected"
  }'
```

### Step 3: Verify Email Delivery
1. Check the admin email address configured (k.m.easyevents@gmail.com)
2. Look for email with subject matching the alert type:
   - "⚠️ Weather Alert: Heatwave" for HEATWAVE
   - "⚠️ Weather Alert: Heavy Rain" for HEAVY_RAIN
   - "⚠️ Weather Alert: Thunderstorm" for THUNDERSTORM
   - etc.

3. Verify email contains:
   - ✅ Correct HTML template applied
   - ✅ Event name and date
   - ✅ Location and coordinates
   - ✅ Weather condition details
   - ✅ Risk level and precautions
   - ✅ Current temperature/conditions
   - ✅ 5-day forecast summary
   - ✅ Action buttons (View Event, Manage Alerts)

### Step 4: Check Email Templates
Email templates should be in `/server/templates/`:
- `weatherAlertRain.html` - for HEAVY_RAIN
- `weatherAlertHeatwave.html` - for HEATWAVE
- `weatherAlertStorm.html` - for THUNDERSTORM

Verify each template:
- ✅ Has proper HTML structure
- ✅ Uses placeholder syntax `{placeholderName}`
- ✅ Includes event and weather information
- ✅ Has call-to-action buttons
- ✅ Is mobile-friendly

## Test 4: Admin Weather Configuration

### Step 1: Test WeatherAlertsAdmin Component
1. Go to EventAdminDashboard: `http://localhost:5173/event-admin/dashboard`
2. Find "Weather Alerts" section
3. Verify UI elements:
   - ✅ Enable/Disable toggle works
   - ✅ Notification timing dropdown (6h, 12h, 24h)
   - ✅ Recipient checkboxes (Super Admin, Event Admin, Staff, Attendees)
   - ✅ Alert condition toggles:
     - Thunderstorm
     - Heavy Rain
     - Extreme Heat
     - Snow
     - Fog
     - Tornado
   - ✅ Alert logs viewer (collapsible)
   - ✅ Delivery status shown for each alert

### Step 2: Test Configuration Updates
1. Change notification timing to 12h
2. Toggle some alert conditions on/off
3. Select recipient groups
4. Verify settings are saved to database
5. Reload page and verify settings persist

## Test 5: Notification Scheduling & Cooldown

### Test 1: Prevent Duplicate Alerts
1. Manually trigger the same alert twice within 3 hours
2. Verify:
   - ✅ First alert sent successfully
   - ✅ Second alert is blocked (cooldown active)
   - ✅ Log shows "blocked due to cooldown"

### Test 2: Notification Timing
1. Configure alert timing to 12h
2. Set event date to tomorrow
3. Run the scheduler:
```bash
# Backend automatically runs every 5 minutes
# Or manually trigger: curl http://localhost:5000/api/weather-alerts/run-scheduler
```

4. Verify:
   - ✅ Alert sent within the configured timing window
   - ✅ Not sent outside window
   - ✅ Respects event date (3 days ahead)

## Test 6: Unit Conversion

### Test Metric Units (°C, km/h)
1. Set `WEATHER_UNITS=metric` in `.env`
2. Load event detail page
3. Verify:
   - ✅ Temperature in Celsius (e.g., 25°C)
   - ✅ Wind speed in km/h (e.g., 15 km/h)
   - ✅ Visibility in meters
   - ✅ Pressure in mb (hectopascals)

### Test Imperial Units (°F, mph)
1. Set `WEATHER_UNITS=imperial` in `.env`
2. Reload event detail page
3. Verify:
   - ✅ Temperature in Fahrenheit (e.g., 77°F)
   - ✅ Wind speed in mph (e.g., 9 mph)
   - ✅ Visibility in feet
   - ✅ Pressure in inHg

### Test Unit Toggle in UI
1. On EventDetail page with WeatherDisplay
2. Click unit toggle button
3. Verify:
   - ✅ Temp changes: 25°C ↔ 77°F
   - ✅ Wind speed changes: 15 km/h ↔ 9 mph
   - ✅ State persists during session
   - ✅ Toggle button shows current unit

## Test 7: Error Handling

### Test Missing API Key
1. Comment out OPENWEATHER_API_KEY in .env
2. Try to load weather: 
3. Verify friendly error message shown to user

### Test Invalid Event Location
1. Create event with `latitude: null, longitude: null`
2. Try to load weather
3. Verify error handling and fallback UI

### Test Network Failure
1. Temporarily block weather API (or use offline mode)
2. Try to load weather component
3. Verify:
   - ✅ Graceful error message
   - ✅ Retry button functional
   - ✅ Page doesn't break

### Test Invalid Alert Configuration
1. Try to update config with invalid timing value
2. Verify validation error returned
3. Verify existing config not overwritten

## Test 8: Dark Mode Integration

1. Navigate to any page with weather components
2. Toggle dark mode via Navbar
3. Verify all weather components:
   - ✅ WeatherDisplay styling in dark mode
   - ✅ WeatherWidget styling in dark mode
   - ✅ WeatherAlertsAdmin styling in dark mode
   - ✅ Text readable in both modes
   - ✅ Icons visible in both modes
   - ✅ Smooth transition between modes

## Test 9: Mobile Responsiveness

Test on mobile viewport (320px - 480px):
1. Event detail page with WeatherDisplay:
   - ✅ Weather cards stack vertically
   - ✅ Forecast grid responsive
   - ✅ Unit toggle accessible
   - ✅ No horizontal scroll

2. Events listing with WeatherWidget:
   - ✅ Widget fits in card
   - ✅ No layout breaking
   - ✅ Touch-friendly buttons

3. MyBookings page:
   - ✅ Weather section readable
   - ✅ All info accessible

## Test 10: Integration with Events

### Test Integrated Workflow
1. Log in to account
2. Browse events list - see WeatherWidget on cards
3. Click event - see full WeatherDisplay
4. Book an event
5. Go to MyBookings - see weather for booked events
6. (As admin) Go to EventAdminDashboard - configure alerts
7. Verify weather alerts can be sent for all booked events

## Debugging Checklist

If tests fail, check:

- [ ] `.env` file has all required variables:
  - `OPENWEATHER_API_KEY` set correctly
  - `EMAIL_USER` and `EMAIL_PASS` valid
  - `MONGO_URI` connects to database
  - `FRONTEND_URL` is correct

- [ ] Backend is running: `npm run dev` from `/server`
- [ ] Frontend is running: `npm run dev` from `/Frontend-EZ`
- [ ] MongoDB connection is active
- [ ] Email SMTP credentials are valid (Gmail app password)
- [ ] Event locations have valid coordinates
- [ ] OpenWeather API key is not rate-limited

- [ ] Browser console shows no errors:
  - Check Network tab for API calls
  - Check weatherService logs
  - Check weatherNotifier logs
  - Check emailService logs

## Database Verification

### Check Weather Config in MongoDB
```javascript
// In MongoDB console
db.weatheralertconfigs.find({ eventId: ObjectId("...") }).pretty()
// Should return:
{
  eventId: ObjectId("..."),
  enabled: true,
  notificationTiming: 12,
  recipients: ["Super Admin", "Event Admin", "Staff", "Attendees"],
  alertConditions: {
    thunderstorm: true,
    heavyRain: true,
    extremeHeat: true,
    snow: false,
    fog: false,
    tornado: true
  },
  alertsSent: [
    {
      alertType: "HEATWAVE",
      sentAt: ISODate("2024-01-15T10:30:00Z"),
      weatherCondition: { temp: 36.5, condition: "Clear" }
    }
  ]
}
```

### Check Alert Logs
```javascript
db.weatheralertlogs.find({ eventId: ObjectId("...") }).pretty()
// Should show all alerts sent for event
```

## Performance Testing

- [ ] Load event with weather: should load in < 2s
- [ ] Refresh weather: should load in < 1s
- [ ] Switch units: should update instantly (client-side)
- [ ] Toggle dark mode: should switch instantly
- [ ] Load events page: should show widgets without lag
- [ ] Admin config page: should save changes in < 1s

## Security Testing

- [ ] Verify API key not exposed in frontend code
- [ ] Email addresses not logged in plaintext
- [ ] Alert endpoints require authentication
- [ ] Configuration only accessible to event admin
- [ ] Verify CORS headers correct
- [ ] Verify JWT tokens required for protected endpoints

## Final Checklist

After all tests pass:

- [ ] All weather components render correctly
- [ ] API integration working with real OpenWeather data
- [ ] Risk detection working (identifies 5 risk types)
- [ ] Email notifications sending with correct templates
- [ ] Admin dashboard allows configuration
- [ ] Dark mode fully integrated
- [ ] Mobile responsive across all components
- [ ] Error handling graceful for all edge cases
- [ ] Documentation complete and accurate

## Troubleshooting

### Weather not showing
1. Check browser console for errors
2. Verify event has valid coordinates
3. Check OPENWEATHER_API_KEY in .env
4. Check API rate limits (free tier = 1000 calls/day)
5. Try refreshing page

### Email not received
1. Check Gmail settings - verify app password not regular password
2. Check email spam folder
3. Verify recipient email in alert config
4. Check server logs for email sending errors
5. Verify SMTP credentials valid

### Risk not detected
1. Check actual weather conditions in location
2. Verify risk thresholds:
   - HEATWAVE: temp > 35°C
   - HEAVY_RAIN: precipitation > 5mm
   - STRONG_WIND: wind > 40 km/h
   - etc.
3. Check weatherService.js risk detection logic
4. Verify API returning correct weather data

## Performance Optimization

To improve performance in production:

1. Implement caching (Redis) for weather data
2. Reduce API call frequency
3. Batch notification emails
4. Use CDN for static assets
5. Implement database indexing on eventId, userId, createdAt
6. Use pagination for alert logs
7. Implement rate limiting on weather endpoints

---

**Last Updated**: January 2024
**Version**: 1.0
**Status**: Complete & Ready for Testing

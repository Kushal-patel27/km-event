# Weather Module - Complete Implementation Guide

## Overview

The Weather Module provides real-time weather data and intelligent notifications for your KM-Event application. It tracks weather conditions for events, generates alerts, and provides forecasts and impact assessments.

## Features

### ✨ Core Features
- **Real-time Weather Data**: Fetch current weather conditions for any event location
- **Weather Forecasting**: 5-day forecast for event planning
- **Intelligent Notifications**: Auto-generated alerts based on weather conditions
- **Weather Alerts**: Warnings for extreme conditions (temperature, wind, rain, etc.)
- **Impact Assessment**: Risk evaluation for events based on weather
- **Weather Comparison**: Compare weather between multiple event locations
- **Caching System**: Optimized API calls with 10-minute cache
- **Dashboard View**: Visual overview of all events' weather status

### 🎯 Alert Types

1. **WARNING** (🔴 Critical)
   - Extreme heat (>40°C) or cold (<-5°C)
   - Thunderstorms, tornadoes, squalls
   - Strong winds (>50 km/h)

2. **CAUTION** (🟠 Moderate)
   - High temperature (>35°C)
   - Heavy rainfall (>5mm)
   - Moderate wind (>30 km/h)
   - Snow expected

3. **INFO** (🔵 Informational)
   - Light rain
   - High humidity
   - Fog/Mist visibility issues

## Installation

### Backend Setup

1. **Install Required Package**
   ```bash
   cd server
   npm install axios
   ```

2. **Add OpenWeather API Key to .env**
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```
   
   Get your free API key from: https://openweathermap.org/api

3. **Backend Components Already Added**
   - ✅ Model: `server/models/Weather.js`
   - ✅ Controller: `server/controllers/weatherController.js`
   - ✅ Routes: `server/routes/weatherRoutes.js`
   - ✅ Utility: `server/utils/weatherService.js`
   - ✅ Server integration in `server/server.js`

### Frontend Setup

1. **Frontend Components Already Created**
   - ✅ `Frontend-EZ/src/components/common/Weather.jsx` - Main weather component
   - ✅ `Frontend-EZ/src/components/common/WeatherNotification.jsx` - Notification component
   - ✅ `Frontend-EZ/src/components/common/WeatherDashboard.jsx` - Dashboard view
   - ✅ `Frontend-EZ/src/context/WeatherContext.jsx` - Global state management
   - ✅ `Frontend-EZ/src/services/weatherAPI.js` - API service layer
   - ✅ CSS files for all components

## API Endpoints

### Get Current Weather
```
GET /api/weather/:eventId
```
Returns current weather, forecast, and notifications for an event.

**Response:**
```json
{
  "success": true,
  "currentWeather": {
    "location": "Mumbai",
    "temperature": 28,
    "feelsLike": 32,
    "humidity": 75,
    "windSpeed": 15,
    "weatherCondition": "Clouds",
    "weatherDescription": "overcast clouds",
    "visibility": 10000,
    "rainfall": 0,
    "uvIndex": 7
  },
  "forecast": [
    {
      "date": "2026-01-20",
      "temperature": 29,
      "condition": "Rain",
      "description": "light rain",
      "humidity": 80,
      "windSpeed": 18,
      "rainfall": 2
    }
  ],
  "notification": {
    "hasAlert": true,
    "type": "info",
    "message": "Weather conditions are normal. Enjoy the event!",
    "notifications": []
  }
}
```

### Get Weather Alerts
```
GET /api/weather/:eventId/alerts
```
Returns weather alerts and notifications for an event.

### Get Weather History
```
GET /api/weather/:eventId/history
```
Returns stored weather history for an event.

### Get Multiple Events Weather
```
POST /api/weather/multiple/events
Body: { eventIds: ["id1", "id2", ...] }
```
Fetch weather for multiple events in one request.

### Get Weather Impact Assessment
```
GET /api/weather/:eventId/impact
```
Returns risk assessment and recommendations for an event.

**Response:**
```json
{
  "success": true,
  "impactAssessment": {
    "impactScore": 25,
    "riskLevel": "MEDIUM",
    "currentConditions": {...},
    "forecast": [...],
    "recommendations": [
      "Prepare heating/cooling arrangements",
      "Monitor wind conditions throughout event"
    ]
  }
}
```

### Compare Weather Between Locations
```
POST /api/weather/compare/locations
Body: {
  locations: [
    { name: "Venue A", latitude: 19.0760, longitude: 72.8777 },
    { name: "Venue B", latitude: 28.7041, longitude: 77.1025 }
  ]
}
```

### Update Weather Settings
```
PUT /api/weather/:eventId/settings
Body: { notificationEnabled: true, alertThreshold: 20 }
```

## Usage Examples

### 1. Add Weather Component to Event Detail Page

```jsx
import Weather from "../components/common/Weather";
import { useWeather } from "../context/WeatherContext";

function EventDetail({ eventId, event }) {
  return (
    <div>
      <h1>{event.title}</h1>
      {event.latitude && event.longitude && (
        <Weather 
          eventId={eventId}
          latitude={event.latitude}
          longitude={event.longitude}
        />
      )}
    </div>
  );
}
```

### 2. Use Weather Context in Components

```jsx
import { useWeather } from "../context/WeatherContext";

function MyComponent() {
  const { 
    weatherData, 
    loading, 
    error, 
    fetchWeather,
    notifications
  } = useWeather();

  const handleGetWeather = async () => {
    await fetchWeather("eventId");
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {weatherData.eventId && (
        <p>Temperature: {weatherData.eventId.temperature}°C</p>
      )}
      <button onClick={handleGetWeather}>Get Weather</button>
    </div>
  );
}
```

### 3. Use Weather API Service

```jsx
import weatherAPI from "../services/weatherAPI";

// Get current weather
const weather = await weatherAPI.getCurrentWeather("eventId");

// Get weather alerts
const alerts = await weatherAPI.getWeatherAlerts("eventId");

// Get impact assessment
const impact = await weatherAPI.getWeatherImpactAssessment("eventId");

// Compare multiple locations
const comparison = await weatherAPI.compareWeather([
  { name: "Location A", latitude: 19.0760, longitude: 72.8777 },
  { name: "Location B", latitude: 28.7041, longitude: 77.1025 }
]);
```

### 4. Add Weather Dashboard to Admin Panel

```jsx
import WeatherDashboard from "../components/common/WeatherDashboard";

function AdminDashboard({ events }) {
  return (
    <div>
      <h1>Event Management</h1>
      <WeatherDashboard events={events} />
    </div>
  );
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Weather API Configuration
OPENWEATHER_API_KEY=your_api_key_from_openweathermap

# Frontend Configuration (if using frontend weather)
REACT_APP_API_URL=http://localhost:5000
```

## Data Model

### Weather Schema

```javascript
{
  eventId: ObjectId,           // Reference to Event
  location: String,            // City/Location name
  latitude: Number,            // Event latitude
  longitude: Number,           // Event longitude
  temperature: Number,         // Current temp in °C
  feelsLike: Number,          // "Feels like" temperature
  humidity: Number,           // Humidity percentage
  windSpeed: Number,          // Wind speed in km/h
  weatherCondition: String,   // Weather main condition
  weatherDescription: String, // Detailed description
  visibility: Number,         // Visibility in meters
  uvIndex: Number,           // UV Index
  rainfall: Number,          // Rainfall in mm
  snow: Number,              // Snow in mm
  notificationSent: Boolean,
  notificationType: String,  // "warning", "caution", "info", "none"
  notificationMessage: String,
  lastUpdated: Date,
  forecast: Array,           // 5-day forecast
  createdAt: Date,
  updatedAt: Date
}
```

## Weather Conditions Supported

- ☀️ Clear
- ☁️ Clouds
- 🌧️ Rain
- 🌦️ Drizzle
- ⛈️ Thunderstorm
- ❄️ Snow
- 🌫️ Mist/Fog
- 💨 Smoke/Squall
- 🏜️ Sand/Dust
- 🌪️ Tornado

## Customization

### 1. Modify Alert Thresholds

Edit `server/utils/weatherService.js` in the `generateWeatherNotification` function:

```javascript
// Change these thresholds
if (temp > 40) {  // Extreme heat threshold
  // ...
}
```

### 2. Add Custom Weather Conditions

Add new conditions to the Weather model enum:

```javascript
weatherCondition: {
  type: String,
  enum: [
    "Clear", "Clouds", "Rain", 
    "CustomCondition" // Add here
  ]
}
```

### 3. Customize Notification Messages

Edit the notification generation in `weatherService.js`:

```javascript
alerts.push("Your custom message here");
```

### 4. Change Cache Duration

Edit `server/utils/weatherService.js`:

```javascript
const CACHE_DURATION = 10 * 60 * 1000; // Change from 10 minutes
```

## Frontend Provider Setup

Wrap your app with the Weather Provider:

```jsx
import { WeatherProvider } from "./context/WeatherContext";

function App() {
  return (
    <WeatherProvider>
      {/* Your components */}
    </WeatherProvider>
  );
}
```

## Error Handling

The module includes comprehensive error handling:

- API failures return descriptive error messages
- Missing API key detection with helpful error
- Network error handling with retry options
- Graceful fallbacks if weather data unavailable

## Performance Optimization

1. **Caching**: 10-minute cache reduces API calls
2. **Auto-cleanup**: Old cache entries removed every 30 minutes
3. **Efficient Queries**: Indexed MongoDB queries for fast retrieval
4. **Batch Requests**: Multiple events weather in single request
5. **Lazy Loading**: Weather component loads only when needed

## Testing the Module

### 1. Test Backend Endpoints

```bash
# Get weather for an event
curl http://localhost:5000/api/weather/:eventId

# Get weather alerts
curl http://localhost:5000/api/weather/:eventId/alerts

# Get multiple events weather
curl -X POST http://localhost:5000/api/weather/multiple/events \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["id1", "id2"]}'
```

### 2. Test Frontend Components

Create a test page:

```jsx
import Weather from "./components/common/Weather";
import WeatherDashboard from "./components/common/WeatherDashboard";

function WeatherTest() {
  const testEventId = "your-test-event-id";
  const testEvents = [
    { _id: "id1", venue: "Venue 1", city: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
    { _id: "id2", venue: "Venue 2", city: "Delhi", latitude: 28.7041, longitude: 77.1025 }
  ];

  return (
    <div>
      <Weather eventId={testEventId} latitude={19.0760} longitude={72.8777} />
      <WeatherDashboard events={testEvents} />
    </div>
  );
}
```

## Troubleshooting

### Issue: "OPENWEATHER_API_KEY is not set"
- **Solution**: Add your API key to `.env` file and restart the server

### Issue: Weather component shows "Failed to fetch"
- **Solution**: Check network tab, verify API endpoint is correct, ensure event has valid coordinates

### Issue: Notifications not appearing
- **Solution**: Verify `notificationEnabled` is true in database, check notification type filter

### Issue: High API usage
- **Solution**: Cache is working but ensure API key quotas aren't exceeded, consider adjusting cache duration

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Historical weather analysis
- [ ] Weather-based booking restrictions
- [ ] SMS/Email alerts for critical weather
- [ ] Integration with weather data visualization library
- [ ] Machine learning for weather impact prediction
- [ ] Geolocation-based event suggestions

## Support

For issues or questions about the weather module, check:
1. Browser console for client-side errors
2. Server logs for API errors
3. Network tab for request/response details
4. Database for weather records storage

## License

This module is part of the KM-Event application.

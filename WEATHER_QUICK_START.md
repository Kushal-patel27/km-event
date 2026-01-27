# Weather Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Add OpenWeather API Key

1. Go to https://openweathermap.org/api
2. Sign up (free tier available)
3. Get your API key from the dashboard
4. Add to `server/.env`:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```

### Step 2: Update Your Event Model

Make sure your Event model has latitude and longitude:

```javascript
// In server/models/Event.js
const eventSchema = new Schema({
  // ... existing fields
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  // ... rest of schema
});
```

### Step 3: Use Weather in Event Detail Page

```jsx
import Weather from "../components/common/Weather";

function EventDetailPage({ event }) {
  return (
    <div>
      <h1>{event.title}</h1>
      
      {/* Add weather component */}
      {event.latitude && event.longitude && (
        <Weather 
          eventId={event._id}
          latitude={event.latitude}
          longitude={event.longitude}
        />
      )}
      
      {/* Rest of your event details */}
    </div>
  );
}
```

### Step 4: Add Weather Dashboard to Admin

```jsx
import WeatherDashboard from "../components/common/WeatherDashboard";

function AdminPage({ events }) {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <WeatherDashboard events={events} />
    </div>
  );
}
```

### Step 5: Wrap App with Weather Provider

```jsx
import { WeatherProvider } from "./context/WeatherContext";

function App() {
  return (
    <WeatherProvider>
      {/* Your routes and components */}
    </WeatherProvider>
  );
}
```

## 📍 API Endpoints Available

### Get Current Weather
```
GET /api/weather/:eventId
```
Returns weather data, forecast, and notifications.

### Get Weather Alerts
```
GET /api/weather/:eventId/alerts
```
Returns current weather alerts for an event.

### Get Multiple Events Weather
```
POST /api/weather/multiple/events
```
Body: `{ eventIds: ["id1", "id2", ...] }`

### Get Weather Impact
```
GET /api/weather/:eventId/impact
```
Returns risk assessment and recommendations.

## 🎯 What You Get

✅ Real-time weather data for events
✅ Automatic weather alerts and warnings
✅ 5-day forecast
✅ Risk assessment for outdoor events
✅ Weather comparison tool
✅ Beautiful weather dashboard
✅ Caching for performance
✅ Mobile responsive design

## 🔥 Features Highlight

### Notification Types

🔴 **WARNING** - Critical conditions
- Extreme temperatures (>40°C or <-5°C)
- Thunderstorms/Tornadoes
- Strong winds (>50 km/h)

🟠 **CAUTION** - Moderate issues
- High temperature (>35°C)
- Heavy rain (>5mm)
- Moderate wind (>30 km/h)

🔵 **INFO** - Informational
- Light rain
- High humidity
- Fog/Mist

### Smart Alerts Generated

The system auto-generates helpful alerts like:
- "🌡️ Extreme heat warning! Stay hydrated and seek shade."
- "🌧️ Heavy rainfall expected. Carry an umbrella!"
- "⚡ Severe weather warning! Thunderstorm expected."
- "💨 Strong wind warning! Be cautious during the event."

## 💡 Usage Examples

### Example 1: Get Weather for Event

```javascript
const weatherAPI = require('../services/weatherAPI');

const weather = await weatherAPI.getCurrentWeather('event123');
console.log(weather.currentWeather.temperature); // 28°C
console.log(weather.notification.message);        // Alert message
```

### Example 2: Compare Multiple Locations

```javascript
const comparison = await weatherAPI.compareWeather([
  { name: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
  { name: "Delhi", latitude: 28.7041, longitude: 77.1025 }
]);

comparison.forEach(location => {
  console.log(`${location.location}: ${location.temperature}°C`);
});
```

### Example 3: Check Event Risk

```javascript
const impact = await weatherAPI.getWeatherImpactAssessment('event123');
console.log(impact.riskLevel);        // LOW, MEDIUM, HIGH
console.log(impact.recommendations);  // Array of suggestions
```

## 📊 Database Storage

Weather data is automatically stored in MongoDB:

- Current weather conditions
- 5-day forecast
- Notifications sent
- Weather history for analytics

Query historical weather:
```javascript
const Weather = require('../models/Weather');
const eventWeather = await Weather.findOne({ eventId: 'event123' });
```

## 🛠️ Common Tasks

### Get Weather for Current User's Events

```jsx
import { useWeather } from "../context/WeatherContext";

function MyEvents({ events }) {
  const { fetchMultipleWeather, weatherData } = useWeather();

  useEffect(() => {
    fetchMultipleWeather(events.map(e => e._id));
  }, [events]);

  return (
    <div>
      {events.map(event => (
        <div key={event._id}>
          <h3>{event.title}</h3>
          {weatherData[event._id] && (
            <p>Temp: {weatherData[event._id].temperature}°C</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Custom Notification Handler

```jsx
import { useWeather } from "../context/WeatherContext";

function EventCard({ event }) {
  const { notifications } = useWeather();
  const alert = notifications[event._id];

  if (!alert) return null;

  return (
    <div className={`alert alert-${alert.type}`}>
      <strong>{alert.type.toUpperCase()}</strong>
      <p>{alert.message}</p>
    </div>
  );
}
```

### Refresh Weather Manually

```jsx
import weatherAPI from "../services/weatherAPI";

async function refreshWeather(eventId) {
  try {
    const weather = await weatherAPI.getCurrentWeather(eventId);
    console.log("Weather updated:", weather);
  } catch (error) {
    console.error("Failed to refresh:", error);
  }
}
```

## 📱 Mobile Responsive

All weather components are fully responsive:
- Desktop: Multi-column layout
- Tablet: Adjusted grid
- Mobile: Single column, touch-optimized

## ⚡ Performance Tips

1. **Use caching**: Data is cached for 10 minutes by default
2. **Batch requests**: Use `/multiple/events` for multiple events
3. **Lazy load**: Only fetch weather when needed
4. **Minimize re-renders**: Use Context to avoid prop drilling

## 🔒 Security

- API key stored in server environment variables
- No sensitive data exposed to frontend
- CORS enabled for your domain
- Rate limiting available (add to routes as needed)

## 🐛 Debug Mode

Enable console logs:

```javascript
// In weatherService.js
console.log('Fetching weather for:', latitude, longitude);
console.log('Cache hit for:', cacheKey);
console.log('Weather data received:', weatherData);
```

## Next Steps

1. ✅ Add API key to .env
2. ✅ Import components in your pages
3. ✅ Wrap app with WeatherProvider
4. ✅ Add weather to event details
5. ✅ Test with real event data
6. ✅ Customize alerts and thresholds as needed

## Need Help?

Check the full documentation in `WEATHER_MODULE_GUIDE.md`

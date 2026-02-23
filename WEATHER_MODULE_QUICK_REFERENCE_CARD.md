# 🌦️ Weather Module - Quick Reference Card

## ⚡ Quick Start (5 minutes)

### 1. Verify Configuration
```bash
# Check environment variables
cat server/.env | grep -E "OPENWEATHER|EMAIL_"
# Should show:
# OPENWEATHER_API_KEY=2c9031977cdda5b13a7ea67bfed96304
# EMAIL_USER=k.m.easyevents@gmail.com
# EMAIL_PASS=pxkbsxmqhfhamjmw
```

### 2. Start Services
```bash
# Terminal 1: Backend
cd server && npm run dev
# Server running on http://localhost:5000

# Terminal 2: Frontend  
cd Frontend-EZ && npm run dev
# Frontend running on http://localhost:5173
```

### 3. Run Tests
```bash
# Terminal 3: Tests
cd server && node test-weather-e2e.js
# Should show: ✓ All 10 tests passed (100%)
```

### 4. Verify in Browser
1. Go to http://localhost:5173
2. Check Events page - WeatherWidget on cards
3. Click event - see WeatherDisplay
4. Toggle dark mode - components update
5. Go to Dashboard (admin) - configure WeatherAlertsAdmin

---

## 📚 Documentation Map

| Need | File |
|------|------|
| **Setup & Config** | WEATHER_MODULE_QUICK_REFERENCE.md |
| **How It Works** | WEATHER_MODULE_IMPLEMENTATION.md |
| **Testing Guide** | WEATHER_MODULE_TESTING_GUIDE.md |
| **Complete Overview** | WEATHER_MODULE_COMPLETE_REPORT.md |
| **Launch Checklist** | WEATHER_MODULE_VERIFICATION_CHECKLIST.md |
| **This Card** | WEATHER_MODULE_QUICK_REFERENCE_CARD.md |

---

## 🔑 Key Features

### Backend (Server-Side)
```
✅ OpenWeatherMap API Integration
✅ 5 Risk Types: HEATWAVE, HEAVY_RAIN, THUNDERSTORM, STRONG_WIND, CYCLONE
✅ Smart Scheduling: Every 5 minutes, 3-day lookahead
✅ 3-Hour Cooldown: Prevents alert fatigue
✅ Email Templates: HTML emails with weather data
✅ Admin API: Full CRUD for alert configuration
```

### Frontend (Client-Side)
```
✅ WeatherDisplay: Full weather info + 5-day forecast
✅ WeatherWidget: Compact widget for listings
✅ WeatherAlertsAdmin: Admin configuration interface
✅ Dark Mode: All components fully styled
✅ Mobile Responsive: Works on all devices
✅ Unit Toggle: °C↔°F, km/h↔mph
```

### Page Integration
```
✅ EventDetail: Full WeatherDisplay below description
✅ Events Listing: WeatherWidget on each card
✅ MyBookings: WeatherWidget for booked events
✅ Admin Dashboard: WeatherAlertsAdmin configuration
✅ EventCard: WeatherWidget inline
```

---

## 🧪 Testing Checklist

### Unit Tests (Automated)
```bash
cd server && node test-weather-e2e.js
```

- ✅ OpenWeather API Configuration
- ✅ Email Configuration
- ✅ Email Templates
- ✅ Database Connection
- ✅ Weather Service
- ✅ Weather Notifier
- ✅ Weather Routes
- ✅ React Components
- ✅ Component Integration
- ✅ Dark Mode Support

**Expected Result**: 10/10 tests pass (100%)

### Manual Testing (Critical Paths)
```
1. [ ] Can I see weather on event listing?
2. [ ] Can I see full forecast on event detail?
3. [ ] Can I toggle units (°C/°F)?
4. [ ] Can I configure alerts as admin?
5. [ ] Do I receive email on weather risk?
6. [ ] Does dark mode apply to all components?
7. [ ] Is layout mobile responsive?
8. [ ] Do alerts prevent duplicate emails?
```

---

## 🔧 Common Tasks

### Test Weather API Directly
```bash
curl "https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&units=metric&appid=2c9031977cdda5b13a7ea67bfed96304"
```
Expected: JSON with `main`, `weather`, `wind` objects

### Test Backend Weather Endpoint
```bash
curl http://localhost:5000/api/weather/event/{eventId}
```
Expected: 200 OK with weather data

### Check Email Config
```javascript
// In server console
const emailService = require('./services/emailService');
console.log({
  user: process.env.EMAIL_USER,
  hasPassword: !!process.env.EMAIL_PASS
});
```

### View Alert Logs
```bash
# In MongoDB
db.weatheralertlogs.find({ eventId: ObjectId("...") }).pretty()
```

### Reset Alert Cooldown
```javascript
// In MongoDB - remove alert history to reset cooldown
db.weatheralertconfigs.updateOne(
  { eventId: ObjectId("...") },
  { $set: { alertsSent: [] } }
);
```

---

## 🐛 Troubleshooting

### Issue: Weather not showing on page
**Solution**:
1. Check browser console (F12) for errors
2. Verify OPENWEATHER_API_KEY in .env
3. Check event has valid coordinates (latitude, longitude)
4. Check API rate limit (1000/day free tier)
5. Try refreshing page

### Issue: Email not received
**Solution**:
1. Verify Gmail 2FA is enabled
2. Use Gmail **app password**, not regular password
3. Check email spam folder
4. Verify EMAIL_USER and EMAIL_PASS in .env
5. Check server logs for email error messages

### Issue: Alerts not triggering
**Solution**:
1. Verify alerts are **enabled** in WeatherAlertsAdmin
2. Check event is within **3 days** from now
3. Check notification timing **window** matches time
4. Verify **recipients** list is not empty
5. Check **alert conditions** are enabled for current weather
6. Check 3-hour **cooldown** hasn't blocked alert

### Issue: Tests failing
**Solution**:
```bash
# 1. Check all files exist
ls -la server/services/weatherService.js
ls -la Frontend-EZ/src/components/weather/WeatherDisplay.jsx

# 2. Check .env variables
cat server/.env | grep -E "OPENWEATHER|EMAIL_|MONGO_"

# 3. Check database connection
# Verify MONGO_URI connects

# 4. Reinstall dependencies
cd server && npm install
cd Frontend-EZ && npm install

# 5. Run tests again
node test-weather-e2e.js
```

### Issue: Dark mode not applying
**Solution**:
1. Check DarkModeContext is imported
2. Verify `isDarkMode` hook used in component
3. Toggle dark mode in navbar to test
4. Check CSS classes in component (dark:bg-gray-900, etc.)
5. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Mobile layout broken
**Solution**:
1. Check responsive classes (sm:, md:, lg:)
2. Verify grid cols responsive (grid-cols-1 md:grid-cols-2)
3. Check width utilities responsive
4. Test at actual mobile widths (375px, 768px)
5. Check no fixed widths preventing responsive layout

---

## 📊 Performance Tips

### Optimize API Calls
```javascript
// Good: Cache weather for 30 minutes
const cachedWeather = useRef(null);
const cacheTime = useRef(null);

if (Date.now() - cacheTime.current < 30 * 60 * 1000) {
  setWeather(cachedWeather.current);
  return;
}
```

### Optimize Re-renders
```javascript
// Use React.memo for WeatherWidget
export default React.memo(WeatherWidget);

// Use useCallback for event handlers
const handleRefresh = useCallback(() => { ... }, []);
```

### Optimize Database
```javascript
// Add indexes
db.weatheralertconfigs.createIndex({ eventId: 1 });
db.weatheralertlogs.createIndex({ eventId: 1, createdAt: -1 });
```

---

## 🔐 Security Checklist

- [ ] API keys in .env (not hardcoded)
- [ ] Email password is app password (not main password)
- [ ] Gmail 2FA enabled
- [ ] Authentication required for admin endpoints
- [ ] Authorization checks on all protected routes
- [ ] Input validation on all forms
- [ ] CORS configured correctly
- [ ] HTTPS enabled in production
- [ ] Database credentials in environment
- [ ] No sensitive data logged to console

---

## 📈 Monitoring Checklist

### Server Logs to Watch
```bash
npm run dev  # Watch for:

✅ "Fetching weather for event..."
✅ "Risk detected: HEATWAVE"
✅ "Sending alert email..."
✅ "Email sent successfully"
✅ "Alert logged to database"

❌ "API error"
❌ "SMTP error"
❌ "Database connection failed"
```

### Browser Console to Check
```javascript
// Open DevTools (F12) → Console tab

✅ No red error messages
✅ No yellow warnings
✅ No undefined variable references
✅ "Fetching weather..." logs appear
```

### Email Verification
```
✅ Email receives in inbox (not spam)
✅ HTML renders correctly
✅ Event name visible
✅ Weather data visible
✅ Action buttons working
✅ Mobile friendly display
```

---

## 🚀 Deployment

### Production Checklist
```bash
# 1. Verify all tests pass
cd server && node test-weather-e2e.js
# Should show: 10/10 tests passed ✅

# 2. Build frontend
cd Frontend-EZ && npm run build
# Creates optimized dist/ folder

# 3. Check build size
ls -lh Frontend-EZ/dist/
# Should be < 1MB for JS chunks

# 4. Verify .env has production values
cat server/.env | grep OPENWEATHER
cat server/.env | grep EMAIL_
cat server/.env | grep MONGO_

# 5. Deploy backend
# Copy server/ to production
# Ensure .env configured for production

# 6. Deploy frontend
# Copy Frontend-EZ/dist/ to web server
# Configure web server to serve index.html for all routes

# 7. Verify in production
curl https://your-domain.com/api/weather/event/{eventId}
# Should return weather data
```

---

## 💬 Common Questions

**Q: Why 3-hour cooldown?**
A: Prevents email fatigue from same alert repeated multiple times

**Q: Why check 3 days ahead?**
A: Gives attendees time to plan and reschedule

**Q: Why 5-minute scheduler interval?**
A: Good balance between responsiveness and server load

**Q: Can I change alert thresholds?**
A: Yes, edit `weatherService.js` HEATWAVE_TEMP, HEAVY_RAIN_MM, etc.

**Q: Can I add more risk types?**
A: Yes, add to `detectWeatherRisks()` function and create template

**Q: Can I use different email provider?**
A: Yes, modify `emailService.js` to use different SMTP provider

**Q: Can I send SMS instead of email?**
A: Yes, add Twilio integration to notification system

**Q: Can I customize email template?**
A: Yes, edit HTML files in `/server/templates/`

---

## 📞 Quick Links

- **GitHub**: [km-event weather module]
- **Documentation**: See `/docs/` folder
- **Issues**: Create issue on GitHub
- **Tests**: `node test-weather-e2e.js`
- **Monitoring**: Check server logs with `npm run dev`

---

## ✅ Final Verification

Before going live:
```bash
# 1. Tests
cd server && node test-weather-e2e.js
# Must show: 10/10 passed ✅

# 2. Manual checks
# - Weather shows on Events page ✅
# - Full forecast shows on Event Detail ✅
# - Dark mode works everywhere ✅
# - Mobile layout responsive ✅
# - Admin config saves ✅
# - Email sends with template ✅

# 3. Production ready
# - No console errors ✅
# - No network errors ✅
# - All tests passing ✅
# - Documentation complete ✅
```

**Status**: ✅ **READY FOR PRODUCTION**

---

*Weather Module v1.0*
*Last Updated: January 2024*
*Status: Production Ready ✅*

## 🧪 SETTINGS PAGE - QUICK START & TESTING GUIDE

### 🚀 Quick Start

**Settings Page URL:** `http://localhost:5173/settings`

**Requirements:**
- ✅ User must be logged in (JWT token in headers)
- ✅ Backend server running (`npm start` in `/server` folder)
- ✅ Frontend running (`npm run dev` in `/Frontend-EZ` folder)

---

## 📱 Tab-by-Tab Testing

### **1. Account Settings** (👤)
**Test These Features:**

```
✅ Update Profile
   - Enter name: "John Doe"
   - Enter Profile Image: any image URL
   - Click "Save Profile Information"
   - Expected: Success message, data persists on page refresh

✅ Request Email Change
   - Enter new email: "newemail@example.com"
   - Click "Send Code"
   - Expected: OTP sent to email
   - Enter received OTP
   - Click "Verify Email Change"
   - Expected: Email updated successfully

✅ Request Phone Change
   - Enter new phone: "+91 8888888888"
   - Click "Send Code"
   - Enter received OTP
   - Click "Verify Phone Change"
   - Expected: Phone updated successfully

✅ Account Deletion
   - Click "Delete Account"
   - Expected: Modal shows deletion will happen in 30 days
   - If cancellation button shown: Account is scheduled for deletion
   - Click "Cancel Deletion": Cancels the scheduled deletion
```

**Backend Calls:**
```
GET  /settings                              - Load settings
PUT  /settings/account/info                 - Save profile
POST /settings/account/email/request        - Request email change
POST /settings/account/email/verify         - Verify OTP
POST /settings/account/phone/request        - Request phone change
POST /settings/account/phone/verify         - Verify OTP
POST /settings/account/delete/request       - Schedule deletion
POST /settings/account/delete/cancel        - Cancel deletion
```

---

### **2. Security Settings** (🔒)
**Test These Features:**

```
✅ View Active Sessions
   - Tab automatically loads all active sessions
   - Shows: Device, IP Address, Last Activity
   - Expected: Current session always visible

✅ Terminate Session
   - Click "Terminate" button on any session
   - Expected: Session removed from list

✅ Logout All Devices
   - Click "Logout All"
   - Expected: All sessions cleared except current
   - User redirected to login

✅ Edit Alert Preferences
   - Toggle "Login Alerts"
   - Toggle "Suspicious Activity Alerts"
   - Expected: Changes save immediately
```

**Backend Calls:**
```
GET  /settings/security/sessions            - Get active sessions
DELETE /settings/security/sessions/{id}     - Terminate session
POST /settings/security/logout-all          - Logout all devices
PUT  /settings/security/preferences         - Update alert preferences
```

---

### **3. Notifications Settings** (🔔)
**Test These Features:**

```
✅ Toggle Notification Channels
   - Toggle "Email Notifications"
   - Toggle "SMS Notifications"
   - Toggle "Push Notifications"
   - Expected: Each saves independently

✅ Toggle Alert Types
   - Toggle "Weather Alerts"
   - Toggle "Event Reminders"
   - Toggle "Promotional Notifications"
   - Toggle "Critical Alerts Override"
   - Expected: Each saves independently

✅ Email Frequency Selection
   - Select "Instant" → Should save
   - Select "Daily Digest" → Should save
   - Select "Weekly Digest" → Should save
   - Expected: Dropdown closes, success message

✅ Enable All Notifications
   - Click "Enable All Notifications"
   - Expected: All toggles turn ON except emailFrequency
```

**Backend Calls:**
```
PUT /settings/notifications                 - Update all notification settings
```

---

### **4. Event Preferences** (🎫)
**Test These Features:**

```
✅ Add Preferred Locations
   - Type: "Mumbai, Delhi, Bangalore"
   - Click "Save Locations"
   - Expected: Success message, list parsed and saved

✅ Add Preferred Categories
   - Type: "Tech, Music, Sports"
   - Click "Save Categories"
   - Expected: Success message, list parsed and saved

✅ Event Notification Toggles
   - Toggle "Auto Weather Notifications"
   - Toggle "Cancellation Alerts"
   - Toggle "Refund Notifications"
   - Toggle "Reschedule Notifications"
   - Expected: Each saves independently
```

**Backend Calls:**
```
PUT /settings/event-preferences              - Update all event preferences
```

---

### **5. Privacy Settings** (🛡️)
**Test These Features:**

```
✅ Data Visibility
   - Select "Private"
   - Select "Public"
   - Select "Friends Only"
   - Expected: Selection saves immediately

✅ Privacy Toggles
   - Toggle "Allow Analytics"
   - Toggle "Personalized Recommendations"
   - Toggle "Consent Given"
   - Expected: Each saves independently

✅ Download Personal Data
   - Click "Download My Data"
   - Expected: JSON file downloads containing all personal data
```

**Backend Calls:**
```
PUT /settings/privacy                       - Update privacy settings
GET /settings/privacy/download-data         - Download personal data
```

---

### **6. Language & Region** (🌍)
**Test These Features:**

```
✅ Language Selection
   - Select "English"
   - Select "Hindi"
   - Select "Spanish"
   - Select "French"
   - Expected: Each saves, UI updates

✅ Timezone Selection
   - Select "UTC"
   - Select "Asia/Kolkata (IST)"
   - Select "America/New_York (EST)"
   - Select "Europe/London (GMT)"
   - Expected: Each saves immediately

✅ Currency Selection
   - Select "INR (₹)"
   - Select "USD ($)"
   - Select "EUR (€)"
   - Select "GBP (£)"
   - Expected: Each saves immediately

✅ Date Format Selection
   - Select "DD/MM/YYYY"
   - Select "MM/DD/YYYY"
   - Select "YYYY-MM-DD"
   - Expected: Each saves immediately

✅ Time Format Selection
   - Select "12-hour"
   - Select "24-hour"
   - Expected: Each saves immediately
```

**Backend Calls:**
```
PUT /settings/preferences                   - Update language/region preferences
```

---

### **7. Appearance & Accessibility** (🎨)
**Test These Features:**

```
✅ Theme Selection
   - Select "Light"
   - Expected: UI turns light mode
   - Select "Dark"
   - Expected: UI turns dark mode
   - Select "System"
   - Expected: UI follows system preference

✅ Font Size Selection
   - Select "Small"
   - Expected: Text becomes smaller
   - Select "Medium"
   - Expected: Text returns to normal
   - Select "Large"
   - Expected: Text becomes larger

✅ Dashboard Layout
   - Select "Default"
   - Select "Compact"
   - Select "Spacious"
   - Expected: Layout adjusts accordingly

✅ Accessibility Options
   - Toggle "High Contrast"
   - Expected: Colors become more distinct
   - Toggle "Reduce Animations"
   - Expected: Animations become minimal
```

**Backend Calls:**
```
PUT /settings/ui                            - Update UI settings
localStorage: Persists UI settings locally
```

---

### **8. Activity Log** (📋)
**Test These Features:**

```
✅ View Audit Log
   - Tab automatically loads activity log
   - Shows: Action, Category, Timestamp
   - Expected: All settings changes appear here

✅ Reset All Settings
   - Click "Reset All Settings to Default"
   - Expected: Confirmation modal
   - Confirm: All settings reset to defaults
```

**Backend Calls:**
```
GET /settings/audit-log                     - Fetch activity log
POST /settings/reset-all                    - Reset all settings to defaults
```

---

## 🔍 API Testing with curl/Postman

### Test a GET Request
```bash
curl -X GET "http://localhost:5000/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test a PUT Request (Update Notifications)
```bash
curl -X PUT "http://localhost:5000/settings/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "sms": false,
    "push": true,
    "weatherAlerts": true,
    "eventReminders": true,
    "promotionalNotifications": false,
    "emailFrequency": "daily",
    "criticalAlertsOverride": true
  }'
```

### Test a POST Request (Enable 2FA)
```bash
curl -X POST "http://localhost:5000/settings/security/2fa/enable" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "email"}'
```

---

## ✅ Verification Checklist

**UI Elements:**
- [ ] All 8 tabs visible and clickable
- [ ] Tab icons display correctly
- [ ] Active tab highlighted with gradient
- [ ] Content transitions smoothly between tabs
- [ ] Sidebar sticky positioning works
- [ ] Responsive layout on mobile

**Functionality:**
- [ ] Settings load on page mount
- [ ] Data persists after refresh
- [ ] All toggles work independently
- [ ] All input fields accept data
- [ ] Select dropdowns have all options
- [ ] Success/error messages appear
- [ ] Loading states work properly

**Styling:**
- [ ] Glassmorphic components visible
- [ ] Indigo-blue gradient theme applied
- [ ] Dark mode works correctly
- [ ] Buttons have hover effects
- [ ] Text is readable in all modes
- [ ] Spacing is consistent

**Backend Connection:**
- [ ] API calls include Authorization header
- [ ] Settings data structure is correct
- [ ] Token is retrieved from localStorage
- [ ] Error responses handled gracefully
- [ ] Success responses trigger UI updates
- [ ] Rate limiting respected

---

## 🐛 Troubleshooting

**Issue:** Settings not loading
```
Solution:
1. Check browser console for errors
2. Verify backend is running
3. Ensure user is logged in
4. Check token in localStorage
5. Check network tab in DevTools
```

**Issue:** Changes not saving
```
Solution:
1. Check backend server logs
2. Verify Authorization header is sent
3. Check MongoDB connection
4. Ensure user._id matches in database
5. Check request body format
```

**Issue:** Theme not applying
```
Solution:
1. Check DarkModeContext is working
2. Verify localStorage has uiSettings
3. Clear browser cache and refresh
4. Check document.documentElement for classes
5. Verify Tailwind CSS configured correctly
```

---

## 📊 Expected Response Formats

### GET /settings
```json
{
  "account": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 8888888888",
    "profileImage": "https://...",
    "loginMethod": "email"
  },
  "security": {
    "twoFactorEnabled": true,
    "twoFactorMethod": "email",
    "loginAlerts": true,
    "suspiciousActivityAlerts": true
  },
  "notifications": {
    "email": true,
    "sms": false,
    "push": true,
    "weatherAlerts": true,
    "eventReminders": true,
    "emailFrequency": "daily"
  },
  "eventPreferences": {
    "preferredLocations": ["Mumbai", "Delhi"],
    "preferredCategories": ["Tech", "Music"],
    "autoWeatherNotify": true
  },
  "privacy": {
    "dataVisibility": "private",
    "allowAnalytics": true
  },
  "preferences": {
    "language": "en",
    "timezone": "Asia/Kolkata",
    "currency": "INR"
  },
  "uiSettings": {
    "theme": "dark",
    "fontSize": "medium",
    "dashboardLayout": "default"
  }
}
```

---

**Status:** ✅ READY FOR TESTING
**Last Updated:** Current Session

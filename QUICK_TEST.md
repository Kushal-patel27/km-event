# Quick Test Instructions

## Step 1: Get an Event ID

### From MongoDB Compass or MongoDB Shell:

```javascript
// Connect to MongoDB and run:
db.events.findOne({}, { _id: 1, name: 1 })

// Returns something like:
// { _id: ObjectId("6789abc123def456789abc12"), name: "Wedding Reception" }
```

### Copy the `_id` value (without `ObjectId()` wrapper)

Example: `6789abc123def456789abc12`

---

## Step 2: Run the Test

Open terminal in `d:\km-event\server` and run:

```bash
node test-weather-notifications.js 6789abc123def456789abc12
```

Replace `6789abc123def456789abc12` with your actual event ID

---

## Step 3: Watch for Results

You should see output like:

```
🧪 Starting Weather Notification Test
========================================
API URL: http://localhost:5000
Event ID: 6789abc123def456789abc12

📧 Test 1: Sending HEAVY RAIN WARNING...
✅ Heavy Rain Test Result:
   - Status: ✅ SUCCESS
   - Notified: 3 bookers
   
... more tests ...

✅ All tests completed successfully!
```

---

## Step 4: Check Emails

Emails should arrive at the email addresses of users who booked tickets for that event.

Email will be from: `k.m.easyevents@gmail.com`
Subject will be like: `⚠️ Weather Alert for Your Event: Wedding Reception`

---

## Troubleshooting

**"Event not found" or "No bookings found":**
- Make sure event ID is correct
- Event must have at least 1 booking

**"Error: connect ECONNREFUSED":**
- Backend server is not running
- Run `npm run dev` in server folder first

**Emails not received:**
- Check spam folder
- Check `.env` has correct EMAIL_USER and EMAIL_PASS
- Gmail requires app passwords (not regular password)

---

## Manual Test with cURL

```bash
curl -X POST http://localhost:5000/api/weather/test/notify/6789abc123def456789abc12 ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"warning\",\"message\":\"Test alert\",\"condition\":\"Heavy Rain\",\"temperature\":25,\"humidity\":80,\"windSpeed\":45,\"rainfall\":10}"
```

---

**Ready to test? Copy an event ID and run the test script!** 🚀

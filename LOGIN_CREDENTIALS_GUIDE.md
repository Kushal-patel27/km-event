# Login Credentials & Testing Guide

## 🔐 Default Admin Account

When the server starts, it automatically creates a default admin account if one doesn't exist:

**Email:** `admin@local`  
**Password:** `admin123`

## 🚀 How to Test the Subscription System

### Step 1: Start the Servers
Make sure both servers are running:

**Backend (Terminal 1):**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
cd Frontend-EZ
npm run dev
# Frontend runs on http://localhost:5174
```

### Step 2: Login as Admin

1. Open http://localhost:5174 in your browser
2. Look for "Admin Login" link/button
3. Enter credentials:
   - **Email:** `admin@local`
   - **Password:** `admin123`
4. Click "Sign in"
5. You should be logged in and redirected to the admin dashboard

### Step 3: Access Subscription Pages

Once logged in, you can access:

**From the sidebar menu:**
- 🎯 **Subscription Hub** → `/admin/subscriptions`
  - View revenue stats
  - Create plans
  - Manage subscriptions
  - View analytics

**Direct URLs:**
- `/admin/subscriptions` - Main subscription dashboard
- `/admin/subscription-setup` - Setup wizard (first time)
- `/admin/organizer-subscriptions` - Manage organizers
- `/admin/commission-analytics` - View commissions

### Step 4: Verify It's Working

After logging in and visiting `/admin/subscriptions`, you should see:

✅ **Overview Tab:**
- Total Revenue card with amount
- Platform Commission card
- Organizer Payouts card
- Active Plans card
- Quick action buttons

✅ **Plans Tab:**
- Form to create new plans (left side)
- Grid of existing plans (right side)

✅ **Subscriptions Tab:**
- Table of organizers with their subscriptions
- Plan names and revenue info

✅ **Analytics Tab:**
- Top performing organizers
- Revenue metrics
- Commission breakdown

### Step 5: Check Browser Console

Open Developer Tools (F12) and go to the **Network** tab to verify:

1. API requests should show **Status: 200** (not 401)
2. Request headers should include: `Authorization: Bearer eyJhbGciOi...`
3. No errors in the Console tab

If you see:
- ❌ "401 Unauthorized" → You're not logged in
- ❌ "Failed to load resource" → Server not running
- ✅ "200 OK" → Everything working!

## 📝 Notes

- The admin account is created automatically when the server starts
- Credentials are from `.env` file or defaults to `admin@local` / `admin123`
- You only need to log in once per browser session
- If session expires, you'll see a message to log in again

## 🔧 Troubleshooting

### I see "Please log in" message on subscription pages
**Fix:** Click "Admin Login" at the top/sidebar and log in with credentials above

### I see "401 Unauthorized" in browser console
**Fix:** Make sure you're logged in. The auth token wasn't sent with the request.

### Pages show "Failed to load data" 
**Fix:** Check that the backend server is running (`npm start` in server folder)

### I don't see the Subscription Hub link in sidebar
**Fix:** Make sure you're logged in as an admin (super_admin role)

## ✅ Quick Test Workflow

```
1. Open http://localhost:5174
   ↓
2. Click "Admin Login" 
   ↓
3. Enter: admin@local / admin123
   ↓
4. Click "Sign in"
   ↓
5. Should redirect to admin dashboard
   ↓
6. Look for "Subscription Hub" in sidebar
   ↓
7. Click it → Should load /admin/subscriptions
   ↓
8. See revenue stats and plans
   ↓
9. ✅ System working!
```

## 🎯 Creating Test Data

### Create a Test Plan
1. Go to `/admin/subscriptions`
2. Click **Plans** tab
3. Fill the form:
   - Name: "Test Plan"
   - Description: "For testing"
   - Commission %: 25
   - Monthly Fee: ₹500
   - Event Limit: 10
4. Click "Add Feature" and add features
5. Click "Create Plan"
6. You should see it appear in the plans grid instantly

### Create Test Subscription
1. Go to `/admin/organizer-subscriptions`
2. Select an organizer from the dropdown
3. Select a plan
4. Click "Assign Plan"
5. Organizer now has that subscription

## 🧪 Testing with Multiple Accounts

You can also create other accounts:

**Register as Organizer:**
1. Click "Sign Up" (or "Create Account")
2. Enter email and password
3. Complete registration
4. Log in and create events

**Login as Different User:**
1. Click "Logout" in sidebar
2. Click "Sign in" again
3. Enter different email/password

## 📊 Expected API Calls

When you visit `/admin/subscriptions` while logged in, these requests should succeed:

```
GET /api/subscriptions/analytics/platform → 200 OK
GET /api/subscriptions/plans → 200 OK
GET /api/subscriptions/all-subscriptions → 200 OK
```

All requests include header:
```
Authorization: Bearer {your_jwt_token}
```

---

**Ready to test?** Start with: `admin@local` / `admin123` 🚀

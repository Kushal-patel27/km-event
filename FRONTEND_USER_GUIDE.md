# Frontend User Guide - Subscription & Commission System

**Date:** February 4, 2026  
**Status:** ✅ NO API CALLS NEEDED - Full GUI Interface

---

## 🎯 OVERVIEW

You now have a complete **GUI-based frontend** that requires **ZERO manual API calls** or URL typing. Everything is done through friendly, clickable interfaces.

---

## 🚀 QUICK START - 3 Easy Steps

### Step 1: Create Subscription Plans
**Go to:** `/admin/subscription-setup` OR Click "Subscription Hub" in admin sidebar

The setup wizard will:
- ✅ Show you the Free, Basic, and Pro plans
- ✅ Create them all with one click
- ✅ Let you customize if needed

**Time: 2 minutes**

### Step 2: Assign Plans to Organizers
**Go to:** `/admin/organizer-subscriptions` OR Click "Organizer Subscriptions" in sidebar

- ✅ Select an organizer from dropdown
- ✅ Select a plan (Free, Basic, or Pro)
- ✅ Click "Assign" 
- ✅ Done!

**Time: 1 minute per organizer**

### Step 3: Done! System Ready
- ✅ Organizers automatically get commissions on bookings
- ✅ They see their revenue in their dashboard
- ✅ They can request payouts anytime

**Time: 0 minutes - Fully automatic**

---

## 📍 COMPLETE PAGE GUIDE

### FOR ADMINS

#### 1. Subscription Hub
**Path:** `/admin/subscriptions`  
**Shortcut:** Admin Sidebar → Revenue Management → "Subscription Hub" 🎯

**What You Can Do:**
- 📊 See total revenue, commissions, payouts in one view
- 💳 Create new subscription plans with easy form
- 👥 View all organizers and their subscriptions
- 📈 See analytics and top-performing organizers
- 🔀 Switch between Overview, Plans, Subscriptions, and Analytics tabs

**Quick Actions Buttons:**
- "Create Plan" → Jump to plans section
- "Manage Subscriptions" → Jump to subscriptions
- "View Commissions" → Go to commission analytics
- "Analytics" → View detailed reports

---

#### 2. Subscription Plans Manager
**Path:** `/admin/subscription-plans`  
**Shortcut:** Admin Sidebar → Revenue Management → "Subscription Plans"

**What You Can Do:**
- ➕ Create new plans (form on left, preview on right)
- 📋 Fill in: Name, description, commission %, fee, limits, features
- 🏷️ Add multiple features with "Add" button
- 👀 See all plans instantly displayed
- ✏️ Edit or delete existing plans

**Form Fields:**
```
Plan Name: (required) e.g., "Premium"
Description: What this plan offers
Commission %: 0-100 (e.g., 20)
Monthly Fee: ₹ amount
Event Limit: Max events organizer can create
Ticket Limit: Max tickets per month
Payout Frequency: weekly / monthly / on-demand
Min Payout Amount: Minimum balance to request payout
Features: Add features one by one
```

---

#### 3. Organizer Subscriptions Manager
**Path:** `/admin/organizer-subscriptions`  
**Shortcut:** Admin Sidebar → Revenue Management → "Organizer Subscriptions"

**What You Can Do:**
- 🔍 Search organizers by name
- 🏷️ Filter by subscription status
- 📋 See all organizers with their plans and revenue
- 👤 See each organizer's total revenue and tickets sold
- 🎯 Click "Manage" to change their plan or status

---

#### 4. Commission Analytics
**Path:** `/admin/commission-analytics`  
**Shortcut:** Admin Sidebar → Revenue Management → "Commission Analytics"

**What You Can Do:**
- 📊 Set date range to filter commissions
- 📋 View all commissions in a table
- 📈 Compare organizers side-by-side
- 🔍 Filter by organizer or commission status
- 💰 See summary totals (revenue, commission, payouts)
- 📊 View detailed breakdown by status

---

### FOR ORGANIZERS

#### 1. Main Organizer Dashboard
**Path:** `/organizer/dashboard`  
**Shortcut:** Click "Organizer Dashboard" link (when logged in as organizer)

**What You See (Automatically Updated):**
- 🎯 **Your Subscription Card** - Shows plan name, commission rate, status
- 📊 **Key Metrics** - Total revenue, commission deducted, net payout, total bookings
- 🔔 **Pending Payout Alert** - Shows if you have money ready to withdraw
- ✨ **Plan Features** - List of what your plan includes
- 🚀 **Quick Actions** - Buttons to create events, view revenue, track payouts

**Three Main Tabs:**

**Tab 1: Overview**
- Total revenue earned
- Commission deducted from revenue  
- Your net payout (what you get)
- Number of bookings
- Pending payout status with "Request Payout" button (if ready)
- Your plan features
- Quick action buttons

**Tab 2: Revenue**
- Revenue by event (table showing each event's details)
- Commission breakdown (showing which commission rates you have)
- Click to see event details, revenue, commission, your payout

**Tab 3: Payouts**
- Payout status overview (pending, processing, completed)
- Complete payout history with:
  - Amount and date
  - Payment method
  - Current status
  - Transaction ID (if completed)

---

#### 2. Revenue Dashboard (Detail)
**Path:** `/organizer/revenue`  
**Shortcut:** From main dashboard → "View Revenue" button

**Shows:**
- Revenue breakdown by event
- Commission breakdown by rate
- Total revenue, commission, your payout
- Event-wise comparison

---

#### 3. Request Payout
**Path:** `/organizer/request-payout`  
**Shortcut:** From main dashboard → "Request Payout" button (shows when ready)

**How to Use:**
1. See your pending balance automatically filled in
2. Check min required amount
3. Enter the amount you want to withdraw
4. Choose payment method:
   - 🏦 Bank Transfer (most common)
   - 📱 UPI
   - 📄 Cheque
   - 💳 Wallet

5. If bank transfer, enter:
   - Account holder name
   - Bank name
   - Account number
   - IFSC code

6. Click "Request Payout"
7. Get confirmation instantly
8. See status in "Track Payouts" tab

---

## 🔄 COMPLETE WORKFLOW (No API Needed)

### Scenario 1: Setup System (Admin)
```
1. Login as Admin
2. Go to /admin/subscription-setup
3. Click "Create These Plans →"
   ✓ Free plan created (30% commission)
   ✓ Basic plan created (20% commission)
   ✓ Pro plan created (10% commission)
4. Go to /admin/organizer-subscriptions
5. Select organizer → Select plan → Click "Assign"
6. Done!
```

### Scenario 2: Organizer Books Event (Automatic)
```
1. Customer books event
2. System automatically:
   ✓ Creates booking
   ✓ Fetches organizer's subscription
   ✓ Calculates commission (e.g., 30%)
   ✓ Creates commission record
   ✓ Updates organizer's dashboard
3. Organizer sees revenue updated in real-time
```

### Scenario 3: Organizer Requests Payout
```
1. Organizer logs in
2. Goes to /organizer/dashboard
3. Clicks "Request Payout" button
4. Enters amount and bank details
5. Clicks "Request Payout"
6. Status shows as "Pending"
7. Admin gets notified
```

### Scenario 4: Admin Processes Payout
```
1. Admin goes to /admin/subscriptions
2. Views pending payouts
3. Verifies details
4. Changes status to "Processing"
5. After bank transfer, sets status to "Completed"
6. Organizer gets notification
7. Status updates in their dashboard
```

---

## 📊 REAL-TIME UPDATES

All dashboards update automatically:
- ✅ Revenue updates when booking is made
- ✅ Pending payout shows latest balance
- ✅ Payout status updates in real-time
- ✅ Admin analytics refresh every time you visit
- ✅ Commission calculations instant

---

## 🎨 NAVIGATION QUICK MAP

```
ADMIN ROUTES:
├─ /admin/subscriptions
│  └─ Main hub for all subscription management
├─ /admin/subscription-setup  
│  └─ Guided wizard to create plans (FIRST TIME)
├─ /admin/subscription-plans
│  └─ Create/edit/delete plans
├─ /admin/organizer-subscriptions
│  └─ Assign plans to organizers
└─ /admin/commission-analytics
   └─ View all commissions and analytics

ORGANIZER ROUTES:
├─ /organizer/dashboard
│  └─ Main dashboard (overview, revenue, payouts)
├─ /organizer/revenue
│  └─ Detailed revenue breakdown
└─ /organizer/request-payout
   └─ Request payout form
```

---

## 🎯 COMMON TASKS

### Task 1: Create a New Plan
```
Admin → Sidebar: "Subscription Hub"
Or directly: /admin/subscription-plans
→ Fill form on left
→ Click "Create Plan"
→ Done! See in list on right
```

### Task 2: Assign Plan to Organizer
```
Admin → Sidebar: "Organizer Subscriptions"
Or directly: /admin/organizer-subscriptions
→ Search organizer by name
→ Select plan from dropdown
→ Click "Assign Plan"
→ Done! Table updates instantly
```

### Task 3: View Revenue Breakdown
```
Organizer → Dashboard
→ Click "Revenue" tab
→ See events, commissions, payouts
→ Or click "View Revenue" button
```

### Task 4: Request Payout
```
Organizer → Dashboard
→ See pending payout alert
→ Click "Request Payout →" button
→ Fill amount and bank details
→ Click "Request Payout"
→ Done! See status in "Payouts" tab
```

### Task 5: Process Payout (Admin)
```
Admin → Subscription Hub
→ Look for pending payouts
→ Or go to /admin/commission-analytics
→ Find payout in list
→ Change status to "Processing"
→ After bank transfer, change to "Completed"
→ Done!
```

---

## 💡 TIPS & TRICKS

### For Admins:
1. **Use Subscription Hub** - It has everything in one place
2. **Check Overview tab first** - See key metrics at a glance
3. **Sort by status** - Filter subscriptions by "active" to see who's paying
4. **Export reports** - Commission analytics is exportable
5. **Compare organizers** - See who's performing best

### For Organizers:
1. **Check dashboard regularly** - Your stats update in real-time
2. **Request payout early** - Don't wait until critical
3. **Save bank details** - Fill them correctly (IFSC code is important)
4. **Track your payout** - Check status in "Payouts" tab
5. **Create more events** - More bookings = more revenue

---

## ❓ FAQ

**Q: Do I need to use API?**  
A: NO! Everything is done through the GUI buttons and forms.

**Q: How do commissions auto-calculate?**  
A: When a customer books an event, the system automatically creates a commission record based on the organizer's subscription plan.

**Q: Can I change a plan?**  
A: Yes! Go to Organizer Subscriptions → click "Manage" → change plan.

**Q: Can organizers request payout anytime?**  
A: Only when they have pending balance ≥ minimum amount (shown in alert).

**Q: How long do payouts take?**  
A: 5-7 business days (shown in payout request page).

**Q: Can I customize commission rates?**  
A: Yes! Create new plans with different rates, or edit existing plans in Subscription Plans page.

---

## 🚀 YOU'RE ALL SET!

**No more manual API calls.** Just click, fill, and submit. Everything else is automatic.

**Start here:**
1. Admin: `/admin/subscription-setup` (or click "Subscription Hub" in sidebar)
2. Organizer: `/organizer/dashboard` 

**That's it!** 🎉

---

**Questions?** Check the detailed documentation files or explore the dashboard - every button has helpful labels and explanations.

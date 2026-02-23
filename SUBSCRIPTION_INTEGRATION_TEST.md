# Subscription & Commission Module - Integration Test Guide

## ✅ System Status Checklist

### Frontend Integration
- [x] **App.jsx Routes**: All 5 routes added
  - ✅ `/admin/subscription-plans` → SubscriptionPlanManager
  - ✅ `/admin/organizer-subscriptions` → OrganizerSubscriptionManager
  - ✅ `/admin/commission-analytics` → CommissionAnalytics
  - ✅ `/organizer/dashboard` → OrganizerRevenueDashboard
  - ✅ `/organizer/request-payout` → PayoutRequest

- [x] **AdminLayout Navigation**: Revenue Management section added
  - ✅ Subscription Plans
  - ✅ Organizer Subscriptions
  - ✅ Commission Analytics

- [x] **Frontend Pages**: All 5 pages exist and ready
  - ✅ SubscriptionPlanManager.jsx
  - ✅ OrganizerSubscriptionManager.jsx
  - ✅ CommissionAnalytics.jsx
  - ✅ OrganizerRevenueDashboard.jsx
  - ✅ PayoutRequest.jsx

### Backend Integration
- [x] **Database Models**: All 4 models created
  - ✅ SubscriptionPlan.js
  - ✅ OrganizerSubscription.js
  - ✅ Commission.js
  - ✅ Payout.js
  - ✅ Booking.js (updated with commission fields)

- [x] **Controllers**: All 3 controllers created with 21 functions
  - ✅ subscriptionController.js (12 functions)
  - ✅ payoutController.js (5 functions)
  - ✅ revenueAnalyticsController.js (4 functions)

- [x] **API Routes**: subscriptionRoutes.js with 19 endpoints
  - ✅ Routes registered in server.js
  - ✅ All endpoints ready

- [x] **Booking Integration**: Commission creation on booking
  - ✅ Imports added to bookingController.js
  - ✅ Commission creation logic added
  - ✅ Booking updated with commission fields

## 🚀 Step-by-Step Testing

### Phase 1: Verify Models & Database Connection

**1. Start MongoDB**
```powershell
# Ensure MongoDB is running
mongod
```

**2. Verify Models Load**
```bash
cd server
npm start
# Check console for connection confirmation
```

**Expected Output:**
```
Connected to MongoDB
Server running on port 5000
```

---

### Phase 2: Create Initial Subscription Plans

**1. Create Free Plan**
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Free",
    "description": "Free tier for new organizers",
    "commissionPercentage": 30,
    "monthlyFee": 0,
    "eventLimit": 5,
    "ticketLimit": 1000,
    "payoutFrequency": "monthly",
    "minPayoutAmount": 100,
    "displayOrder": 1,
    "features": ["Up to 5 events", "Basic analytics", "Monthly payouts"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "_id": "...",
    "name": "Free",
    "commissionPercentage": 30,
    "monthlyFee": 0,
    "createdAt": "2026-02-04T..."
  }
}
```

**2. Create Basic Plan**
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Basic",
    "description": "Professional organizers",
    "commissionPercentage": 20,
    "monthlyFee": 500,
    "eventLimit": 15,
    "ticketLimit": 5000,
    "payoutFrequency": "monthly",
    "minPayoutAmount": 100,
    "displayOrder": 2,
    "features": ["Up to 15 events", "Advanced analytics", "Priority support"]
  }'
```

**3. Create Pro Plan**
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Pro",
    "description": "Enterprise organizers",
    "commissionPercentage": 10,
    "monthlyFee": 2000,
    "eventLimit": 999,
    "ticketLimit": 99999,
    "payoutFrequency": "weekly",
    "minPayoutAmount": 100,
    "displayOrder": 3,
    "features": ["Unlimited events", "Full analytics", "24/7 support", "Custom integrations"]
  }'
```

**4. Verify Plans Created**
```bash
curl http://localhost:5000/api/subscriptions/plans
```

**Expected:**
```json
{
  "success": true,
  "data": [
    { "name": "Free", "commissionPercentage": 30, ... },
    { "name": "Basic", "commissionPercentage": 20, ... },
    { "name": "Pro", "commissionPercentage": 10, ... }
  ],
  "total": 3
}
```

---

### Phase 3: Assign Plans to Test Organizers

**1. Get Organizer ID**
```bash
curl http://localhost:5000/api/super-admin/users?role=organizer \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Note down an organizer's _id

**2. Assign Free Plan**
```bash
curl -X POST http://localhost:5000/api/subscriptions/assign-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "organizerId": "ORGANIZER_ID",
    "planId": "PLAN_ID_FREE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Plan assigned successfully",
  "data": {
    "_id": "...",
    "organizer": "ORGANIZER_ID",
    "plan": "PLAN_ID_FREE",
    "status": "active",
    "currentCommissionPercentage": 30
  }
}
```

**3. Verify Subscription Created**
```bash
curl http://localhost:5000/api/subscriptions/all-subscriptions?status=active \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Phase 4: Test Booking → Commission Flow

**1. Get Event ID**
```bash
curl http://localhost:5000/api/events \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

**2. Create Booking**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "eventId": "EVENT_ID",
    "quantity": 2,
    "ticketTypeId": "TICKET_TYPE_ID"
  }'
```

**Expected Response:**
```json
{
  "_id": "BOOKING_ID",
  "event": "EVENT_ID",
  "quantity": 2,
  "totalAmount": 2000,
  "commission": {
    "percentage": 30,
    "amount": 600,
    "organizerAmount": 1400,
    "platformAmount": 600
  },
  "commissionId": "COMMISSION_ID",
  "status": "confirmed"
}
```

**3. Verify Commission Created**
```bash
curl http://localhost:5000/api/subscriptions/all-commissions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** Commission record with status: "pending"

---

### Phase 5: Test Revenue Dashboard

**1. Organizer Dashboard**
```bash
curl http://localhost:5000/api/subscriptions/analytics/organizer \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 2000,
      "totalCommissionDeducted": 600,
      "totalNetPayout": 1400,
      "totalBookings": 1,
      "totalTickets": 2
    },
    "byEvent": [
      {
        "eventId": "EVENT_ID",
        "eventTitle": "...",
        "revenue": 2000,
        "commission": 600,
        "netAmount": 1400
      }
    ],
    "commissionBreakdown": [
      {
        "percentage": 30,
        "count": 2,
        "revenue": 2000,
        "commission": 600
      }
    ]
  }
}
```

**2. Admin Analytics**
```bash
curl http://localhost:5000/api/subscriptions/analytics/platform \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** Platform-wide revenue metrics, top organizers, top events

**3. Comparison Report**
```bash
curl http://localhost:5000/api/subscriptions/analytics/compare-organizers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** Ranked list of organizers by revenue with stats

---

### Phase 6: Test Payout Request Flow

**1. Check Pending Amount**
```bash
curl http://localhost:5000/api/subscriptions/my-payouts/pending/amount \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "pendingAmount": 1400,
    "commissionCount": 1,
    "minPayoutAmount": 100,
    "canRequestPayout": true
  }
}
```

**2. Request Payout**
```bash
curl -X POST http://localhost:5000/api/subscriptions/payouts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '{
    "amount": 1400,
    "paymentMethod": "bank_transfer",
    "bankDetails": {
      "accountHolderName": "John Organizer",
      "bankName": "HDFC Bank",
      "accountNumber": "1234567890123456",
      "ifscCode": "HDFC0000123"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payout request created successfully",
  "data": {
    "_id": "PAYOUT_ID",
    "organizer": "ORGANIZER_ID",
    "totalAmount": 1400,
    "status": "pending",
    "commissionCount": 1,
    "paymentMethod": "bank_transfer"
  }
}
```

**3. Admin Processes Payout**
```bash
curl -X PUT http://localhost:5000/api/subscriptions/payouts/PAYOUT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "processing",
    "transactionId": "TXN12345"
  }'
```

**4. Complete Payout**
```bash
curl -X PUT http://localhost:5000/api/subscriptions/payouts/PAYOUT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "completed",
    "transactionId": "TXN12345"
  }'
```

**Expected:** Commissions status changed to "paid"

---

### Phase 7: Verify Commission Calculations

**Test Case 1: Free Plan (30% commission)**
```
Ticket Price: ₹1000
Quantity: 2
Subtotal: ₹2000
Commission (30%): ₹600
Organizer Payout: ₹1400
Platform Revenue: ₹600
```

**Test Case 2: Basic Plan (20% commission)**
```
Ticket Price: ₹500
Quantity: 5
Subtotal: ₹2500
Commission (20%): ₹500
Organizer Payout: ₹2000
Platform Revenue: ₹500
```

**Verify in Database:**
```javascript
// MongoDB Query
db.commissions.findOne({ booking: ObjectId("BOOKING_ID") })
// Should show:
// commissionPercentage: 30
// commissionAmount: 600
// organizerAmount: 1400
// platformAmount: 600
```

---

### Phase 8: Test Role-Based Access

**1. Organizer Cannot Create Plans**
```bash
curl -X POST http://localhost:5000/api/subscriptions/plans \
  -H "Authorization: Bearer ORGANIZER_TOKEN" \
  -d '...'
# Expected: 403 Forbidden
```

**2. Organizer Can View Own Dashboard**
```bash
curl http://localhost:5000/api/subscriptions/analytics/organizer \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
# Expected: 200 OK with own data
```

**3. Organizer Cannot View Platform Analytics**
```bash
curl http://localhost:5000/api/subscriptions/analytics/platform \
  -H "Authorization: Bearer ORGANIZER_TOKEN"
# Expected: 403 Forbidden
```

---

## 🔍 Common Issues & Fixes

### Issue 1: Commission Not Created
**Problem:** Booking created but no commission record  
**Debug Steps:**
1. Check organizer has active subscription
   ```bash
   db.organizerSubscriptions.findOne({ organizer: ObjectId("ORG_ID") })
   ```
2. Check booking logs in server console
3. Verify Commission model imported in bookingController.js
4. Ensure database has no errors

**Fix:**
```bash
# Manually create commission for test booking
db.commissions.insertOne({
  booking: ObjectId("BOOKING_ID"),
  event: ObjectId("EVENT_ID"),
  organizer: ObjectId("ORG_ID"),
  ticketPrice: 1000,
  quantity: 2,
  subtotal: 2000,
  commissionPercentage: 30,
  commissionAmount: 600,
  organizerAmount: 1400,
  platformAmount: 600,
  status: "pending",
  createdAt: new Date()
})
```

### Issue 2: Analytics Empty
**Problem:** Revenue dashboard shows no data  
**Debug Steps:**
1. Verify commissions exist: `db.commissions.countDocuments()`
2. Check aggregation pipeline in revenueAnalyticsController.js
3. Verify date filters in request are correct

**Fix:**
```javascript
// Test aggregation in MongoDB:
db.commissions.aggregate([
  { $match: { organizer: ObjectId("ORG_ID") } },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$subtotal" },
      totalCommission: { $sum: "$commissionAmount" }
    }
  }
])
```

### Issue 3: Payout Validation Fails
**Problem:** Cannot request payout  
**Debug Steps:**
1. Check pending amount: 
   ```bash
   curl http://localhost:5000/api/subscriptions/my-payouts/pending/amount
   ```
2. Verify amount >= minPayoutAmount (usually ₹100)
3. Check bank details are provided

**Fix:**
```javascript
// Verify in MongoDB:
db.payouts.find({ organizer: ObjectId("ORG_ID"), status: "pending" })
// Check if amount meets minimum
```

---

## 📊 Database Verification Queries

**Check All Models:**
```javascript
// Total subscriptions
db.organizerSubscriptions.countDocuments()

// Total commissions
db.commissions.countDocuments()

// Total payouts
db.payouts.countDocuments()

// Revenue by status
db.commissions.aggregate([
  { $group: { _id: "$status", total: { $sum: "$commissionAmount" } } }
])

// Pending payouts
db.payouts.find({ status: "pending" }, { totalAmount: 1, organizer: 1, createdAt: 1 })

// Organizer revenue
db.commissions.aggregate([
  { $match: { organizer: ObjectId("ORG_ID") } },
  { $group: { _id: null, total: { $sum: "$subtotal" } } }
])
```

---

## ✅ Successful Integration Checklist

- [ ] MongoDB running and connected
- [ ] All 4 models created successfully
- [ ] All 3 controllers loaded without errors
- [ ] 19 API endpoints responding
- [ ] Free, Basic, Pro plans created
- [ ] Organizer assigned to plan
- [ ] Booking created with commission
- [ ] Commission record exists in database
- [ ] Commission amount calculated correctly
- [ ] Organizer dashboard loads with revenue
- [ ] Admin analytics show platform data
- [ ] Payout request accepted and created
- [ ] Payout status transitions work
- [ ] Role-based access control working
- [ ] All 5 frontend pages accessible
- [ ] Navigation items visible in admin sidebar
- [ ] Revenue calculations accurate

---

## 🚀 Next Steps After Verification

1. **Email Notifications** (Optional)
   - Send emails on payout request
   - Send emails on payout processing
   - Send emails on payout completion

2. **Payment Gateway** (Optional)
   - Integrate bank transfer API
   - Process actual payouts
   - Track transaction IDs

3. **Testing** (Required)
   - Run end-to-end tests
   - Verify all workflows
   - Load testing on analytics

4. **Monitoring** (Required)
   - Set up error tracking
   - Monitor commission calculations
   - Alert on failed payouts

---

**Last Updated:** February 4, 2026  
**Status:** Ready for Testing ✅

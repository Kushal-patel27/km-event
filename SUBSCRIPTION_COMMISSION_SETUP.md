# Subscription & Commission Module - Setup Guide

## Quick Setup Instructions

### 1. Backend Setup

#### A. Database Models Already Created
- ✅ SubscriptionPlan.js
- ✅ OrganizerSubscription.js
- ✅ Commission.js
- ✅ Payout.js
- ✅ Booking.js (updated with commission fields)

#### B. Register Routes in server.js

Add to your main server file:

```javascript
import subscriptionRoutes from './routes/subscriptionRoutes.js'

// ... other routes ...
app.use('/api/subscription', subscriptionRoutes)
```

#### C. Update Booking Controller

When a booking is confirmed, create a commission:

```javascript
import * as subscriptionController from './controllers/subscriptionController.js'
import OrganizerSubscription from './models/OrganizerSubscription.js'

// In your createBooking or confirmBooking method
const event = await Event.findById(eventId)
const subscription = await OrganizerSubscription.findOne({ organizer: event.organizer })
const commissionPercentage = subscription?.currentCommissionPercentage || 30

await subscriptionController.createCommission({
  bookingId: booking._id,
  eventId: event._id,
  organizerId: event.organizer,
  ticketPrice: booking.ticketType.price,
  quantity: booking.quantity,
  commissionPercentage: commissionPercentage
})
```

### 2. Frontend Setup

#### A. Import Pages in App.jsx

```javascript
import SubscriptionPlanManager from './pages/admin/SubscriptionPlanManager'
import OrganizerSubscriptionManager from './pages/admin/OrganizerSubscriptionManager'
import CommissionAnalytics from './pages/admin/CommissionAnalytics'
import OrganizerRevenueDashboard from './pages/organizer/OrganizerRevenueD ashboard'
import PayoutRequest from './pages/organizer/PayoutRequest'
```

#### B. Add Routes in App.jsx

```javascript
// Admin routes
<Route path="/admin/subscription-plans" element={<ProtectedAdminRoute><SubscriptionPlanManager /></ProtectedAdminRoute>} />
<Route path="/admin/organizer-subscriptions" element={<ProtectedAdminRoute><OrganizerSubscriptionManager /></ProtectedAdminRoute>} />
<Route path="/admin/commission-analytics" element={<ProtectedAdminRoute><CommissionAnalytics /></ProtectedAdminRoute>} />

// Organizer routes
<Route path="/organizer/dashboard" element={<ProtectedRoute><OrganizerRevenueDashboard /></ProtectedRoute>} />
<Route path="/organizer/request-payout" element={<ProtectedRoute><PayoutRequest /></ProtectedRoute>} />
```

#### C. Update AdminLayout Navigation

Add to navigation items in AdminLayout.jsx:

```javascript
{ to: '/admin/subscription-plans', label: '💰 Plans', icon: '📊' },
{ to: '/admin/organizer-subscriptions', label: 'Subscriptions', icon: '📋' },
{ to: '/admin/commission-analytics', label: 'Commissions', icon: '📈' }
```

### 3. Initial Data Setup

Create default subscription plans via API or database:

```bash
POST /api/subscription/plans
{
  "name": "Free",
  "description": "For individual organizers",
  "commissionPercentage": 30,
  "monthlyFee": 0,
  "payoutFrequency": "monthly",
  "minPayoutAmount": 100,
  "displayOrder": 1,
  "isActive": true
}

POST /api/subscription/plans
{
  "name": "Basic",
  "description": "For growing event organizers",
  "commissionPercentage": 20,
  "monthlyFee": 500,
  "eventLimit": 10,
  "ticketLimit": 5000,
  "payoutFrequency": "monthly",
  "minPayoutAmount": 100,
  "displayOrder": 2,
  "isActive": true
}

POST /api/subscription/plans
{
  "name": "Pro",
  "description": "For professional organizers",
  "commissionPercentage": 10,
  "monthlyFee": 2000,
  "eventLimit": null,
  "ticketLimit": null,
  "payoutFrequency": "weekly",
  "minPayoutAmount": 100,
  "displayOrder": 3,
  "isActive": true
}
```

### 4. Admin Workflow

#### Step 1: Create Subscription Plans
1. Go to `/admin/subscription-plans`
2. Click "Add New Plan"
3. Set plan details (name, commission %, fees, limits)
4. Save

#### Step 2: Assign Plans to Organizers
1. Go to `/admin/organizer-subscriptions`
2. Click "Assign Plan"
3. Select organizer and plan
4. Save

#### Step 3: Monitor Commissions
1. Go to `/admin/commission-analytics`
2. View all commissions with filters
3. Compare organizer performance
4. Generate reports

#### Step 4: Process Payouts
1. Go to `/admin/commission-analytics`
2. Filter payouts by status "pending"
3. Review payout requests
4. Update status to "processing" → "completed"

### 5. Organizer Workflow

#### Step 1: Check Subscription
1. Organizer logs in
2. Navigates to `/organizer/dashboard`
3. Sees current plan and commission rate

#### Step 2: View Revenue
1. Sees total revenue, commission deducted, net payout
2. Reviews revenue breakdown by event
3. Analyzes commission percentages

#### Step 3: Request Payout
1. Clicks "Request Payout" when balance is available
2. Goes to `/organizer/request-payout`
3. Enters payout amount and bank details
4. Submits request

#### Step 4: Track Payout
1. Views payout status in dashboard
2. Receives email notifications on status changes
3. Tracks transaction ID once completed

## API Testing Examples

### Create Test Commission

```bash
curl -X POST http://localhost:5000/api/subscription/commissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID",
    "eventId": "EVENT_ID",
    "organizerId": "ORGANIZER_ID",
    "ticketPrice": 500,
    "quantity": 2,
    "commissionPercentage": 20
  }'
```

### Get Organizer Commissions

```bash
curl -X GET "http://localhost:5000/api/subscription/my-commissions?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Request Payout

```bash
curl -X POST http://localhost:5000/api/subscription/payouts/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentMethod": "bank_transfer",
    "amount": 5000,
    "bankDetails": {
      "accountHolderName": "John Doe",
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0000123",
      "bankName": "HDFC Bank"
    }
  }'
```

### Get Platform Analytics

```bash
curl -X GET "http://localhost:5000/api/subscription/analytics/platform?fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Troubleshooting

### Commission Not Calculated
- Verify organizer has an active subscription
- Check if booking was created successfully
- Ensure commission creation API is called after booking

### Payout Request Failed
- Check if pending amount is >= minimum payout amount
- Verify bank details are provided for bank transfer
- Check if organizer has pending commissions

### Analytics Not Showing Data
- Ensure commissions exist in database
- Check date range filters
- Verify user has appropriate role/permission

## Database Queries for Verification

### Check if commissions are created
```javascript
db.commissions.find({ organizer: ObjectId("...") })
```

### Get total revenue for organizer
```javascript
db.commissions.aggregate([
  { $match: { organizer: ObjectId("...") } },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$subtotal" },
      totalCommission: { $sum: "$commissionAmount" }
    }
  }
])
```

### Check payout requests
```javascript
db.payouts.find({ status: "pending" })
```

## Next Steps

1. ✅ Test commission creation after booking
2. ✅ Create admin users and set subscription plans
3. ✅ Test organizer dashboard
4. ✅ Test payout request flow
5. ✅ Set up email notifications for payout updates
6. ✅ Configure payment gateway for actual transfers
7. ✅ Create backup scripts for payout data
8. ✅ Set up monitoring for commission calculations

## Files Reference

### Backend Files
- `server/models/SubscriptionPlan.js`
- `server/models/OrganizerSubscription.js`
- `server/models/Commission.js`
- `server/models/Payout.js`
- `server/models/Booking.js` (updated)
- `server/controllers/subscriptionController.js` (new)
- `server/controllers/payoutController.js` (new)
- `server/controllers/revenueAnalyticsController.js` (new)
- `server/routes/subscriptionRoutes.js` (updated)

### Frontend Files
- `Frontend-EZ/src/pages/admin/SubscriptionPlanManager.jsx`
- `Frontend-EZ/src/pages/admin/OrganizerSubscriptionManager.jsx`
- `Frontend-EZ/src/pages/admin/CommissionAnalytics.jsx`
- `Frontend-EZ/src/pages/organizer/OrganizerRevenueDashboard.jsx`
- `Frontend-EZ/src/pages/organizer/PayoutRequest.jsx`

### Documentation
- `SUBSCRIPTION_COMMISSION_MODULE.md` (detailed documentation)
- `SUBSCRIPTION_COMMISSION_SETUP.md` (this file)

---

**Need Help?** Refer to `SUBSCRIPTION_COMMISSION_MODULE.md` for detailed API documentation and architecture overview.

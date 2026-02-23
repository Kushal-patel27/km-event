# Organizer Subscription & Commission Module Documentation

## Overview

The Organizer Subscription & Commission Module is a comprehensive system that enables event organizers to choose subscription plans, track their revenue, and request payouts. The platform takes a commission from each ticket sale based on the organizer's subscription plan.

## Architecture

### Database Models

#### 1. SubscriptionPlan Model
Stores subscription plan information created by admins.

```javascript
{
  name: String (Free, Basic, Pro),
  description: String,
  commissionPercentage: Number (0-100),
  monthlyFee: Number,
  eventLimit: Number,
  ticketLimit: Number,
  payoutFrequency: String (weekly, monthly, on-demand),
  minPayoutAmount: Number,
  features: Array,
  isActive: Boolean,
  displayOrder: Number,
  timestamps: Date
}
```

#### 2. OrganizerSubscription Model
Tracks each organizer's active subscription plan.

```javascript
{
  organizer: ObjectId (ref: User),
  plan: ObjectId (ref: SubscriptionPlan),
  status: String (active, inactive, suspended, cancelled),
  currentCommissionPercentage: Number,
  subscribedAt: Date,
  renewalDate: Date,
  cancelledAt: Date,
  totalTicketsSold: Number,
  totalRevenue: Number,
  totalCommissionDeducted: Number,
  totalNetPayout: Number,
  totalPaidOut: Number,
  pendingPayout: Number
}
```

#### 3. Commission Model
Records commission details for each ticket sale.

```javascript
{
  booking: ObjectId (ref: Booking),
  event: ObjectId (ref: Event),
  organizer: ObjectId (ref: User),
  ticketPrice: Number,
  quantity: Number,
  subtotal: Number,
  commissionPercentage: Number,
  commissionAmount: Number,
  organizerAmount: Number,
  platformAmount: Number,
  status: String (pending, allocated, processed, paid),
  payoutId: ObjectId (ref: Payout),
  paymentMethod: String,
  notes: String,
  timestamps: Date
}
```

#### 4. Payout Model
Tracks payout requests and their status.

```javascript
{
  organizer: ObjectId (ref: User),
  commissions: Array[ObjectId] (ref: Commission),
  totalAmount: Number,
  commissionCount: Number,
  status: String (pending, processing, completed, failed, reversed),
  paymentMethod: String (bank_transfer, upi, cheque, wallet),
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountType: String
  },
  transactionId: String,
  failureReason: String,
  requestedAt: Date,
  processedAt: Date,
  completedAt: Date
}
```

#### 5. Booking Model (Updated)
Added commission fields to track commission details with booking.

```javascript
commission: {
  commissionPercentage: Number,
  commissionAmount: Number,
  organizerAmount: Number,
  platformAmount: Number
},
commissionId: ObjectId (ref: Commission)
```

## API Endpoints

### Subscription Plans (Admin)

#### Get All Plans
```
GET /subscription/plans
```
Public endpoint - Returns all active subscription plans.

#### Create Plan
```
POST /subscription/plans
Required: admin role
Body: {
  name: "Basic",
  description: "For growing organizers",
  commissionPercentage: 20,
  monthlyFee: 500,
  eventLimit: 5,
  payoutFrequency: "monthly"
}
```

#### Update Plan
```
PUT /subscription/plans/:planId
Required: admin role
Body: { ...updated fields }
```

#### Delete Plan
```
DELETE /subscription/plans/:planId
Required: admin role
```

### Organizer Subscriptions

#### Get My Subscription
```
GET /subscription/my-subscription
Required: login (organizer)
Returns: Current subscription details or default Free plan
```

#### Assign Plan to Organizer
```
POST /subscription/assign-plan
Required: admin role
Body: {
  organizerId: "org_id",
  planId: "plan_id"
}
```

#### Get All Subscriptions
```
GET /subscription/all-subscriptions?status=active&search=name&page=1&limit=10
Required: admin role
```

#### Update Subscription Status
```
PUT /subscription/subscriptions/:subscriptionId/status
Required: admin role
Body: {
  status: "active|inactive|suspended|cancelled",
  cancelReason: "reason (if cancelled)",
  notes: "optional notes"
}
```

### Commissions

#### Create Commission (Internal)
```
POST /subscription/commissions
Required: login
Body: {
  bookingId: "booking_id",
  eventId: "event_id",
  organizerId: "organizer_id",
  ticketPrice: 500,
  quantity: 2,
  commissionPercentage: 20
}
Returns: Commission record with calculated amounts
```

#### Get My Commissions
```
GET /subscription/my-commissions?status=pending&page=1&limit=10&fromDate=...&toDate=...
Required: login (organizer)
Returns: List of commissions with summary
```

#### Get All Commissions
```
GET /subscription/all-commissions?organizerId=...&status=...&page=1
Required: admin role
```

#### Get Commissions by Event
```
GET /subscription/event/:eventId/commissions
```

### Payouts

#### Request Payout
```
POST /subscription/payouts/request
Required: login (organizer)
Body: {
  paymentMethod: "bank_transfer",
  amount: 5000,
  bankDetails: {
    accountHolderName: "Name",
    accountNumber: "1234567890",
    ifscCode: "HDFC0000123",
    bankName: "HDFC Bank"
  }
}
```

#### Get My Payouts
```
GET /subscription/my-payouts?status=pending&page=1&limit=10
Required: login (organizer)
```

#### Get Pending Payout Amount
```
GET /subscription/my-payouts/pending/amount
Required: login (organizer)
Returns: {
  pendingAmount: 5000,
  commissionCount: 15,
  ticketCount: 25,
  minPayoutAmount: 100,
  canRequestPayout: true
}
```

#### Get All Payouts
```
GET /subscription/all-payouts?status=pending&fromDate=...&toDate=...
Required: admin role
```

#### Update Payout Status
```
PUT /subscription/payouts/:payoutId/status
Required: admin role
Body: {
  status: "processing|completed|failed",
  transactionId: "txn_123",
  failureReason: "reason (if failed)"
}
```

### Revenue Analytics

#### Platform Revenue Analytics
```
GET /subscription/analytics/platform?fromDate=...&toDate=...
Required: super admin
Returns: {
  summary: { totalRevenue, totalCommission, ... },
  byStatus: Array,
  byPlan: Array,
  topOrganizers: Array,
  topEvents: Array,
  dailyTrend: Array
}
```

#### Organizer Revenue Analytics
```
GET /subscription/analytics/organizer?fromDate=...&toDate=...
Required: login (organizer)
Returns: {
  summary: { totalRevenue, totalCommission, totalPayout, ... },
  byStatus: Array,
  byEvent: Array,
  commissionBreakdown: Array,
  payoutStatus: Array,
  dailyTrend: Array
}
```

#### Event Admin Analytics
```
GET /subscription/analytics/event-admin?fromDate=...&toDate=...
Required: login (event admin)
Returns: Revenue analytics for all events managed by the admin
```

#### Compare Organizers Performance
```
GET /subscription/analytics/compare-organizers?fromDate=...&toDate=...
Required: admin role
Returns: List of organizers with performance metrics
```

## Commission Flow

### 1. Booking Creation
- User books tickets for an event
- System fetches organizer's subscription plan
- Commission percentage is determined

### 2. Commission Calculation
```
Subtotal = Ticket Price × Quantity
Commission Amount = Subtotal × (Commission Percentage / 100)
Organizer Amount = Subtotal - Commission Amount
Platform Amount = Commission Amount

Status = "pending"
```

### 3. Commission Storage
- Commission record is created and linked to booking
- Booking is updated with commission details

### 4. Payout Request
- Organizer requests payout when pending amount >= minimum payout amount
- System creates Payout record with status "pending"
- All pending/allocated commissions are allocated to this payout
- Commissions status change to "allocated"

### 5. Payout Processing (Admin)
- Admin reviews payout requests
- Admin updates status to "processing"
- Admin updates status to "completed" with transaction ID
- Commissions status change to "paid"
- Or update status to "failed" with reason
- Commissions revert to "allocated"

## Frontend Components

### Admin Pages

#### SubscriptionPlanManager.jsx
- View all subscription plans
- Create, edit, delete plans
- Configure commission percentages
- Set plan features and limits

#### OrganizerSubscriptionManager.jsx
- View all organizer subscriptions
- Assign/change plans for organizers
- Update subscription status
- Filter by status or search

#### CommissionAnalytics.jsx
- View all commissions
- Compare organizer performance
- Filter by date range, organizer, event
- Export commission data

### Organizer Pages

#### OrganizerRevenueDashboard.jsx
- View current subscription plan
- Summary of revenue, commission, and payouts
- Revenue breakdown by event
- Commission breakdown by rate
- Pending payout information

#### PayoutRequest.jsx
- View available balance for payout
- Request payout with details
- Enter bank account information
- Choose payment method

## Integration with Existing System

### Booking Controller Integration
When a booking is confirmed, trigger commission creation:

```javascript
// After successful booking creation
const subscription = await OrganizerSubscription.findOne({ organizer: event.organizer });
const commissionPercentage = subscription?.currentCommissionPercentage || 30;

await subscriptionController.createCommission({
  bookingId: booking._id,
  eventId: event._id,
  organizerId: event.organizer,
  ticketPrice: booking.ticketType.price,
  quantity: booking.quantity,
  commissionPercentage: commissionPercentage
});
```

### Event Organizer Dashboard Integration
Add new sections to organizer dashboard:

```javascript
// In organizer dashboard
const revenueStats = await API.get('/subscription/analytics/organizer');
const pendingPayout = await API.get('/subscription/my-payouts/pending/amount');
```

### Super Admin Dashboard Enhancement
Add commission and payout management sections with:
- Platform revenue summary
- Top organizers by revenue
- Top events by earnings
- Payout requests queue
- Commission trends

## Key Features

### For Organizers
1. ✅ View current subscription plan
2. ✅ Track total ticket sales and revenue
3. ✅ See commission deductions per plan
4. ✅ Calculate net payout
5. ✅ Request payouts when available
6. ✅ Track payout status and history
7. ✅ View revenue breakdown by event
8. ✅ Analyze commission percentages

### For Admins
1. ✅ Create and manage subscription plans
2. ✅ Set commission percentages per plan
3. ✅ Assign plans to organizers
4. ✅ View all commissions and payouts
5. ✅ Process payout requests
6. ✅ Generate commission reports
7. ✅ Compare organizer performance
8. ✅ Track platform revenue

## Best Practices

### Commission Calculation
- Always use verified subscription plans
- Fallback to 30% commission for organizers without subscription
- Store commission details with booking for audit trail

### Payout Processing
- Minimum payout amount prevents too many small transfers
- Payout frequency aligns with subscription tier
- Bank details encrypted before storage
- Transaction IDs stored for reconciliation

### Analytics
- Aggregate commissions by period for trend analysis
- Compare organizer performance by revenue
- Track commission revenue vs platform revenue
- Monitor payout status for cash flow analysis

### Security
- Validate all commission calculations
- Verify organizer subscription before commission
- Encrypt sensitive bank details
- Audit all payout requests and approvals
- Limit access to analytics by role

## Testing Checklist

- [ ] Create subscription plans with different commission rates
- [ ] Assign plans to test organizers
- [ ] Create test bookings and verify commission calculation
- [ ] Request payout with minimum amount
- [ ] Process payout and verify status updates
- [ ] Check commission records in database
- [ ] Verify organizer dashboard displays correct data
- [ ] Test admin analytics and filtering
- [ ] Verify payout calculations are accurate
- [ ] Test date range filtering in analytics
- [ ] Check organizer comparison reports
- [ ] Verify bank detail encryption

## Future Enhancements

1. **Automatic Payouts**: Auto-process payouts on schedule
2. **Refund Handling**: Reduce commission when booking is refunded
3. **Incentive Programs**: Bonus commission for high performers
4. **Tax Management**: GST/TDS calculations
5. **Payment Gateway Integration**: Direct bank transfer via API
6. **Subscription Renewal**: Auto-renew or prompt renewal
7. **Usage Tracking**: Monitor plan limits and notify organizers
8. **Chargeback Handling**: Process chargebacks and reduce payout

---

**Version**: 1.0  
**Last Updated**: February 4, 2026  
**Maintained By**: Platform Development Team

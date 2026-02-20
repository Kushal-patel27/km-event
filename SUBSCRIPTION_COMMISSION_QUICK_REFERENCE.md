# Subscription & Commission Module - Quick Reference Guide

## 📋 Quick Navigation

### Admin Tasks
| Task | Location | Steps |
|------|----------|-------|
| Create Plan | `/admin/subscription-plans` | Click "Add Plan" → Fill details → Save |
| Assign Plan | `/admin/organizer-subscriptions` | Click "Assign Plan" → Select organizer & plan → Save |
| View Commissions | `/admin/commission-analytics` | Set date range → View table → Export if needed |
| Process Payouts | `/admin/commission-analytics` | Filter "pending" → Review → Update status |
| Compare Organizers | `/admin/commission-analytics` | Set date range → Switch to comparison view |

### Organizer Tasks
| Task | Location | Steps |
|------|----------|-------|
| View Dashboard | `/organizer/dashboard` | See revenue summary & stats |
| Request Payout | `/organizer/request-payout` | Enter amount → Add bank details → Submit |
| Track Revenue | `/organizer/dashboard` | View event breakdown & commission rates |
| View Payout Status | `/organizer/dashboard` | Check pending amount & request history |

## 💰 Commission Calculation Examples

### Free Plan (30% Commission)
```
Ticket Price: ₹1000
Quantity: 2
Subtotal: ₹2000

Commission (30%): ₹600
Organizer Payout: ₹1400

Net: Organizer receives ₹1400 per 2 tickets
```

### Basic Plan (20% Commission)
```
Ticket Price: ₹1000
Quantity: 2
Subtotal: ₹2000

Commission (20%): ₹400
Organizer Payout: ₹1600

Net: Organizer receives ₹1600 per 2 tickets
```

### Pro Plan (10% Commission)
```
Ticket Price: ₹1000
Quantity: 2
Subtotal: ₹2000

Commission (10%): ₹200
Organizer Payout: ₹1800

Net: Organizer receives ₹1800 per 2 tickets
```

## 📊 API Response Examples

### Get Commission Summary
```bash
GET /subscription/my-commissions
```
Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "com123",
      "event": { "title": "Concert XYZ" },
      "subtotal": 5000,
      "commissionPercentage": 20,
      "commissionAmount": 1000,
      "organizerAmount": 4000,
      "status": "pending"
    }
  ],
  "summary": {
    "totalTickets": 25,
    "totalRevenue": 25000,
    "totalCommission": 5000,
    "totalOrganizerAmount": 20000
  }
}
```

### Request Payout
```bash
POST /subscription/payouts/request
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "paymentMethod": "bank_transfer",
  "amount": 5000,
  "bankDetails": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0000123",
    "bankName": "HDFC Bank"
  }
}
```

### Get Platform Analytics
```bash
GET /subscription/analytics/platform?fromDate=2024-01-01&toDate=2024-12-31
```
Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 1000000,
      "totalCommission": 200000,
      "totalOrganizerPayout": 800000,
      "totalTickets": 2000,
      "totalBookings": 500
    },
    "topOrganizers": [
      {
        "organizerName": "Event Master",
        "totalRevenue": 150000,
        "totalCommissionPaid": 30000,
        "ticketsSold": 300
      }
    ],
    "topEvents": [
      {
        "eventTitle": "Concert 2024",
        "totalRevenue": 50000,
        "commissionEarned": 10000,
        "ticketsSold": 100
      }
    ]
  }
}
```

## 🔧 Common Operations

### Create a New Subscription Plan

**API Call:**
```bash
curl -X POST http://localhost:5000/api/subscription/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Premium",
    "description": "For premium organizers",
    "commissionPercentage": 15,
    "monthlyFee": 1000,
    "eventLimit": 20,
    "payoutFrequency": "weekly",
    "minPayoutAmount": 100
  }'
```

### Assign Plan to Organizer

**API Call:**
```bash
curl -X POST http://localhost:5000/api/subscription/assign-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "organizerId": "ORG_ID",
    "planId": "PLAN_ID"
  }'
```

### Create Commission (Automatic on Booking)

```javascript
// In booking controller
const commission = await subscriptionController.createCommission({
  bookingId: booking._id,
  eventId: event._id,
  organizerId: event.organizer,
  ticketPrice: booking.ticketType.price,
  quantity: booking.quantity,
  commissionPercentage: commissionPercentage
})
```

### Request Payout

**Frontend:**
```javascript
const response = await API.post('/subscription/payouts/request', {
  paymentMethod: 'bank_transfer',
  amount: pendingAmount,
  bankDetails: {
    accountHolderName: 'Name',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0000123',
    bankName: 'HDFC Bank'
  }
})
```

## 📈 Analytics Quick Tips

### View Organizer Revenue
```javascript
// Get organizer's revenue analytics
GET /subscription/analytics/organizer?fromDate=2024-01-01&toDate=2024-12-31

// Shows: Total revenue, commissions, payouts, breakdown by event
```

### Compare Organizers Performance
```javascript
// Compare all organizers
GET /subscription/analytics/compare-organizers?fromDate=2024-01-01&toDate=2024-12-31

// Shows: Revenue, commission rate, tickets sold, average ticket price
```

### Get Commission Trends
```javascript
// Filter commissions by date and status
GET /subscription/all-commissions?status=pending&fromDate=2024-01-01

// Shows: All pending commissions waiting to be paid out
```

## ⚠️ Important Rules

### Commission Minimum Payout
- **Free Plan**: Min ₹100 payout, Monthly frequency
- **Basic Plan**: Min ₹100 payout, Monthly frequency
- **Pro Plan**: Min ₹100 payout, Weekly frequency

### Payout Status Rules
- ✅ Only "pending" or "allocated" commissions can be paid
- ✅ Commission must be >= 7 days old (for dispute resolution)
- ✅ Minimum payout amount must be met
- ✅ Bank details required for bank transfer method

### Commission Rate Rules
- ✅ Rates are locked when commission is created
- ✅ If plan rate changes, new bookings use new rate
- ✅ Changing organizer's plan affects future commissions only
- ✅ Previous commissions keep original rate

## 🚨 Troubleshooting

### Commission Not Created
**Problem:** Booking created but no commission record  
**Solution:**
1. Check if organizer has active subscription
2. Verify commission creation is called in booking controller
3. Check database for Commission records
4. Review server logs for errors

### Payout Request Failed
**Problem:** Cannot request payout  
**Solution:**
1. Ensure pending amount >= minimum payout
2. Check if bank details are provided
3. Verify organizer has pending commissions
4. Check account status (not suspended)

### Analytics Not Loading
**Problem:** Analytics page blank or errors  
**Solution:**
1. Check date range is valid
2. Ensure commissions exist in database
3. Verify user has correct role
4. Check browser console for errors

### Commission Amount Incorrect
**Problem:** Commission math doesn't match  
**Solution:**
1. Verify subscription rate is correct
2. Check commission percentage in plan
3. Calculate: `(Price × Quantity) × (Commission% / 100)`
4. Verify booking details are correct

## 📝 Database Queries

### Check Commissions for Organizer
```javascript
db.commissions.find({ 
  organizer: ObjectId("ORG_ID"),
  status: "pending"
})
```

### Get Total Revenue
```javascript
db.commissions.aggregate([
  { $match: { organizer: ObjectId("ORG_ID") } },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$subtotal" },
      totalCommission: { $sum: "$commissionAmount" },
      totalOrganizerAmount: { $sum: "$organizerAmount" }
    }
  }
])
```

### List Pending Payouts
```javascript
db.payouts.find({ status: "pending" }).pretty()
```

### Find Payouts for Organizer
```javascript
db.payouts.find({ 
  organizer: ObjectId("ORG_ID"),
  status: { $ne: "completed" }
})
```

## 🎯 Monthly Process

### Week 1: Monitor Commissions
- Review new commissions
- Check commission calculations
- Resolve any discrepancies

### Week 2: Prepare Payouts
- Review payout requests
- Verify bank details
- Approve requests

### Week 3: Process Payouts
- Update payout status to "processing"
- Coordinate with payment gateway
- Mark as "completed"

### Week 4: Report & Analysis
- Generate revenue reports
- Compare organizer performance
- Plan next month

## 📞 Support Contacts

For issues, refer to:
1. **Documentation**: `SUBSCRIPTION_COMMISSION_MODULE.md`
2. **Setup Guide**: `SUBSCRIPTION_COMMISSION_SETUP.md`
3. **Architecture**: `SUBSCRIPTION_COMMISSION_ARCHITECTURE.md`
4. **Database Logs**: Check MongoDB logs
5. **Server Logs**: Check Node.js server console

## ✅ Checklist for Going Live

- [ ] All 5 database models created
- [ ] All 3 controllers implemented
- [ ] All 19 API endpoints tested
- [ ] All 5 frontend pages created
- [ ] Routes added to App.jsx
- [ ] AdminLayout updated with navigation
- [ ] Booking controller updated for commission
- [ ] Test subscription plans created
- [ ] Test organizers assigned to plans
- [ ] Test bookings created and verified commissions
- [ ] Test payout request flow
- [ ] Test admin approval flow
- [ ] Email notifications configured (optional)
- [ ] Payment gateway integrated (optional)
- [ ] Backup scripts created
- [ ] Monitoring alerts set up

---

**Pro Tip:** Keep this guide handy for quick reference during implementation and daily operations!

**Last Updated:** February 4, 2026  
**Version:** 1.0

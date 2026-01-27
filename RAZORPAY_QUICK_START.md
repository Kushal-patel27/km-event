# Razorpay Integration - Quick Setup Guide

## 🚀 What's Implemented

✅ Complete Razorpay payment gateway integration
✅ Secure backend order creation & verification
✅ MongoDB payment tracking model
✅ React checkout component (RazorpayCheckout.jsx)
✅ QR code auto-generation for tickets
✅ Email notifications with PDF tickets
✅ Refund processing & management
✅ Payment analytics dashboard
✅ Webhook handling (duplicate-safe)
✅ Admin reporting & analytics
✅ No UI changes (seamless integration)

## 📋 Quick Setup (5 minutes)

### Step 1: Get Razorpay Credentials
1. Sign up at https://razorpay.com (or use existing account)
2. Go to Dashboard → Settings → API Keys
3. Copy your **Key ID** and **Key Secret**
4. Note your **Webhook Secret** (set in dashboard)

### Step 2: Update .env File
```bash
# In server/.env
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

### Step 3: Install Dependencies
```bash
cd server
npm install
# razorpay and pdfkit already added to package.json
```

### Step 4: Start Server
```bash
npm run dev
```

### Step 5: Configure Webhook in Razorpay Dashboard
1. Go to https://dashboard.razorpay.com
2. Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - refund.created
   - refund.processed

## 💳 Test Payment Flow

### Using Test Card
- **Card Number**: 4111111111111111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)

### Test Flow
1. Go to My Bookings page
2. Click "Pay Now" on any pending booking
3. Click "Proceed to Payment"
4. Enter test card details
5. Click "Pay"
6. Payment automatically verifies and books tickets

## 📍 File Locations

### Backend Files Created/Modified
- `server/models/Payment.js` - NEW: Payment tracking model
- `server/controllers/paymentController.js` - NEW: Payment processing logic
- `server/controllers/analyticsController.js` - NEW: Analytics & reporting
- `server/routes/paymentRoutes.js` - NEW: Payment API endpoints
- `server/routes/analyticsRoutes.js` - NEW: Analytics API endpoints
- `server/models/Booking.js` - MODIFIED: Added payment fields
- `server/server.js` - MODIFIED: Added payment & analytics routes
- `server/.env` - MODIFIED: Added Razorpay credentials

### Frontend Files Created/Modified
- `Frontend-EZ/src/components/RazorpayCheckout.jsx` - NEW: Payment modal
- `Frontend-EZ/src/pages/MyBookings.jsx` - MODIFIED: Added payment button & modal

## 🎯 API Endpoints Available

### User Payment APIs
```
POST   /api/payments/order              - Create payment order
POST   /api/payments/verify             - Verify payment signature
GET    /api/payments/status/:bookingId  - Check payment status
POST   /api/payments/refund             - Request refund
```

### Admin Analytics APIs
```
GET    /api/analytics/payments/analytics    - Payment dashboard
GET    /api/analytics/payments/report       - Download report (JSON/CSV)
GET    /api/analytics/refunds               - View refund requests
GET    /api/analytics/payments/failed       - Failed payments
PATCH  /api/analytics/refunds/:paymentId   - Update refund status
POST   /api/analytics/payments/:id/retry    - Retry verification
```

### Webhook (No Auth)
```
POST   /api/payments/webhook            - Razorpay events handler
```

## ✨ Features at a Glance

### For Users
- Pay for tickets with Razorpay
- Auto-generated QR code tickets
- Email confirmation with details
- Request refunds anytime
- PDF ticket download

### For Admins
- View payment analytics
- Track refund requests
- Monitor failed payments
- Generate transaction reports
- Manually retry failed payments

## 🔒 Security Features

✅ HMAC-SHA256 signature verification
✅ Duplicate payment prevention
✅ Idempotent webhook processing
✅ User ownership validation
✅ Error code tracking
✅ Retry attempt limits

## 📧 Email Notifications

### Booking Confirmation
- Event details
- Ticket IDs
- QR codes preview
- Payment confirmation
- Download ticket link

### Refund Notification
- Refund amount
- Refund ID
- Processing timeline
- Original booking details

## 🧪 Testing Checklist

- [ ] Create booking
- [ ] Open payment modal
- [ ] Enter test card (4111111111111111)
- [ ] Verify payment completes
- [ ] Check email for confirmation
- [ ] Verify QR codes generated
- [ ] Download PDF ticket
- [ ] Test refund request
- [ ] Check admin analytics

## 🚨 Common Issues & Fixes

### Issue: "Failed to load Razorpay"
- **Fix**: Check internet connection, clear browser cache

### Issue: "Payment verification failed"
- **Fix**: Ensure RAZORPAY_KEY_SECRET is correct in .env

### Issue: "Webhook not processing"
- **Fix**: 
  - Verify webhook URL is public (not localhost)
  - Check RAZORPAY_WEBHOOK_SECRET matches dashboard
  - Test webhook in Razorpay dashboard

### Issue: "QR codes not showing"
- **Fix**: Check server logs, ensure qrcode package installed

## 📚 Documentation

Full documentation available in `RAZORPAY_INTEGRATION.md`

## 🆘 Support

- Razorpay: https://razorpay.com/support
- App Issues: Check server logs or contact support@kmevents.com

## 🎉 Ready to Go!

Your event booking system now has full payment processing with:
- Secure payment handling
- Automatic ticket generation
- Email confirmations
- Admin analytics
- Refund management

No frontend UI changes needed - everything integrates seamlessly!

Start testing with test credentials and go live with real Razorpay credentials when ready.

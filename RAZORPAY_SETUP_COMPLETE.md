# Razorpay Payment Integration - Complete Setup

## ✅ SETUP COMPLETED

### Current Configuration

#### Backend (Server)
- **Location**: `server/.env`
- **Keys Configured**:
  - `RAZORPAY_KEY_ID=rzp_test_VrQ8Lv4xaGcmYg` (Test mode)
  - `RAZORPAY_KEY_SECRET=OZQmwx0yYvJLwRB3hKq5N2iu` (Test mode)
  - `RAZORPAY_WEBHOOK_SECRET=whsec_test123456789`

#### Frontend
- **Location**: `Frontend-EZ/.env`
- **Keys Configured**:
  - `VITE_RAZORPAY_KEY_ID=rzp_test_VrQ8Lv4xaGcmYg` (Matches backend test mode)

### Payment Flow

1. **User Books Event**
   - Navigate to any event page
   - Click "Book Now"
   - Fill in details and select tickets
   - Click "Confirm & Pay" button

2. **Payment Processing**
   - Booking is created in pending state
   - Razorpay checkout modal opens automatically
   - User can pay using:
     - Test cards
     - UPI (test mode)
     - Netbanking (test mode)
     - Wallets (test mode)

3. **After Payment**
   - **Success**: Booking status updated to "Confirmed", QR codes generated, user redirected to success page
   - **Failure**: Error displayed, user can retry payment from "My Bookings" page

### Test Payment Details

#### Test Card Numbers (Use any)
- **Success**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/28`)
- **Name**: Any name

#### Test UPI
- **VPA**: `success@razorpay`

### Features Implemented

✅ Real-time payment gateway integration
✅ Razorpay checkout modal
✅ Payment order creation
✅ Payment verification with signature
✅ Automatic booking confirmation on success
✅ QR code generation post-payment
✅ Email notifications (configured)
✅ Retry payment from "My Bookings" for failed/pending payments
✅ Payment status tracking
✅ Refund support (cancellation flow)

### Accessing the Application

- **Frontend**: http://localhost:5174/
- **Backend API**: http://localhost:5000/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/

### How to Test

1. Open http://localhost:5174/
2. Login or create an account
3. Browse events and click "Book Now" on any event
4. Fill booking form and click "Confirm & Pay"
5. Razorpay modal will open
6. Use test card: `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/28`
7. Click "Pay"
8. Payment success page will show your booking with QR codes

### Switching to Live Mode (Production)

When ready to accept real payments:

1. **Get Live Keys from Razorpay**
   - Go to https://dashboard.razorpay.com/
   - Navigate to Settings → API Keys
   - Generate Live Keys
   - Complete KYC verification (required for live mode)

2. **Update Backend** (`server/.env`):
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_LIVE_SECRET
   RAZORPAY_WEBHOOK_SECRET=YOUR_ACTUAL_WEBHOOK_SECRET
   ```

3. **Update Frontend** (`Frontend-EZ/.env`):
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY
   ```

4. **Restart Both Servers**

5. **Configure Webhooks** (Important for production):
   - In Razorpay Dashboard → Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`, `payment.authorized`
   - Save webhook secret to `.env`

### Important Notes

⚠️ **Test Keys Provided**: The current test keys are sample keys for demonstration. For actual testing:
   - Sign up at https://dashboard.razorpay.com/
   - Get your own test keys
   - Replace in both `.env` files

⚠️ **Never Commit Secrets**: The `.env` files should be in `.gitignore`

⚠️ **Test Mode vs Live Mode**: Test keys start with `rzp_test_`, live keys start with `rzp_live_`

⚠️ **Same Key Mode**: Frontend and backend must use matching mode (both test or both live)

### Troubleshooting

**"Authentication failed"**
- Keys are incorrect or in wrong mode
- Restart server after changing `.env`
- Verify keys on Razorpay dashboard

**Modal doesn't open**
- Check browser console for errors
- Verify `VITE_RAZORPAY_KEY_ID` in Frontend `.env`
- Clear cache and rebuild frontend

**Payment not confirming**
- Check server logs for errors
- Verify webhook secret matches
- Ensure MongoDB connection is active

### Support

For Razorpay-specific issues:
- Documentation: https://razorpay.com/docs/
- Support: https://dashboard.razorpay.com/support

---

**Status**: ✅ Payment system fully configured and ready to test
**Last Updated**: January 12, 2026

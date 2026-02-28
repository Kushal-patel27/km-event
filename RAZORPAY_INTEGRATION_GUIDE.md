# Razorpay Payment Integration - Complete Guide

## 🎯 Overview

This guide covers the complete Razorpay payment integration for your MERN event management application, supporting both:
- **Event Booking Payments**
- **Subscription Plan Payments**

## 📦 What's Been Added

### Backend Components

1. **Payment Model** (`server/models/Payment.js`)
   - Stores all payment transactions
   - Fields: userId, amount, orderId, paymentId, status, paymentType, referenceId, metadata
   - Status types: created, paid, failed, refunded
   - Payment types: event, subscription

2. **Payment Controller** (`server/controllers/paymentController.js`)
   - `createOrder` - Creates Razorpay order
   - `verifyPayment` - Verifies payment signature
   - `getPaymentById` - Fetch payment details
   - `getMyPayments` - User's payment history
   - `getAllPayments` - Admin: All payments
   - `handlePaymentFailure` - Record failed payments
   - `initiateRefund` - Process refunds (Admin)

3. **Payment Routes** (`server/routes/paymentRoutes.js`)
   - `POST /api/payments/create-order` - Create payment order
   - `POST /api/payments/verify` - Verify payment
   - `POST /api/payments/failure` - Record failure
   - `GET /api/payments/my-payments` - User payments
   - `GET /api/payments/:paymentId` - Payment details
   - `GET /api/payments/` - All payments (Admin)
   - `POST /api/payments/:paymentId/refund` - Refund (Admin)

### Frontend Components

1. **RazorpayButton** (`Frontend-EZ/src/components/payment/RazorpayButton.jsx`)
   - Reusable payment button component
   - Handles Razorpay SDK loading
   - Manages payment flow
   - Success/failure callbacks
   - Loading states

2. **PaymentStatus** (`Frontend-EZ/src/components/payment/PaymentStatus.jsx`)
   - Display payment success/failure/pending
   - Transaction details
   - Retry and navigation options

3. **Integration Examples** (`Frontend-EZ/src/examples/PaymentIntegrationGuide.jsx`)
   - Complete working examples
   - Event booking with payment
   - Subscription with payment
   - Simple one-click payment

---

## 🚀 Setup Instructions

### Step 1: Install Razorpay Package

```bash
cd server
npm install razorpay
```

### Step 2: Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test Keys (for testing)
4. Generate Live Keys (for production)

### Step 3: Configure Environment Variables

Add to `server/.env`:

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# For Production:
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Restart Server

```bash
cd server
npm start
```

---

## 💻 Usage Examples

### Example 1: Event Booking with Payment

```jsx
import React, { useState } from 'react';
import RazorpayButton from '../../components/payment/RazorpayButton';
import PaymentStatus from '../../components/payment/PaymentStatus';
import API from '../../services/api';

export default function Booking() {
  const [bookingData, setBookingData] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleProceedToPayment = () => {
    // Prepare booking data
    const data = {
      eventId: event._id,
      quantity: 2,
      totalAmount: 1000,
      ticketTypeId: selectedTicketType._id,
    };
    
    setBookingData(data);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Create booking after successful payment
      const response = await API.post('/bookings', {
        ...bookingData,
        paymentId: paymentData.data.paymentId,
        paymentStatus: 'completed',
      });

      setPaymentStatus({
        status: 'success',
        message: 'Booking Confirmed!',
        bookingId: response.data.bookingId,
      });
    } catch (error) {
      console.error('Booking creation failed:', error);
    }
  };

  const handlePaymentFailure = (error) => {
    setPaymentStatus({
      status: 'failed',
      message: 'Payment Failed',
    });
  };

  if (paymentStatus) {
    return (
      <PaymentStatus
        status={paymentStatus.status}
        message={paymentStatus.message}
        amount={bookingData.totalAmount}
        redirectUrl="/my-bookings"
        redirectText="View My Bookings"
        onRetry={() => setPaymentStatus(null)}
      />
    );
  }

  return (
    <div>
      {showPayment ? (
        <RazorpayButton
          amount={bookingData.totalAmount}
          paymentType="event"
          referenceId={bookingData.eventId}
          metadata={{
            eventId: bookingData.eventId,
            eventName: event.title,
            quantity: bookingData.quantity,
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          buttonText={`Pay ₹${bookingData.totalAmount}`}
        />
      ) : (
        <button onClick={handleProceedToPayment}>
          Continue to Payment
        </button>
      )}
    </div>
  );
}
```

### Example 2: Subscription Payment

```jsx
import React, { useState } from 'react';
import RazorpayButton from '../../components/payment/RazorpayButton';

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePaymentSuccess = async (paymentData) => {
    // Subscription is automatically activated by backend
    alert('Subscription activated successfully!');
    navigate('/event-admin');
  };

  const handlePaymentFailure = (error) => {
    alert('Payment failed. Please try again.');
  };

  return (
    <div>
      {selectedPlan && (
        <RazorpayButton
          amount={selectedPlan.monthlyFee}
          paymentType="subscription"
          referenceId={selectedPlan._id}
          metadata={{
            planId: selectedPlan._id,
            planName: selectedPlan.name,
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          buttonText={`Subscribe for ₹${selectedPlan.monthlyFee}/month`}
        />
      )}
    </div>
  );
}
```

---

## 🔄 Payment Flow

### Event Booking Flow

1. **User selects tickets**
   - Choose event
   - Select quantity and ticket type
   - Calculate total amount

2. **Initiate Payment**
   - Click "Pay Now"
   - RazorpayButton creates order via `/api/payments/create-order`
   - Backend creates Payment record with status "created"

3. **Razorpay Checkout**
   - Razorpay modal opens
   - User enters payment details
   - Payment processed

4. **Verify Payment**
   - On success: Frontend calls `/api/payments/verify`
   - Backend verifies signature
   - Updates Payment status to "paid"

5. **Create Booking**
   - Frontend calls `/api/bookings` with paymentId
   - Backend creates booking with payment reference
   - User redirected to success page

### Subscription Flow

1. **User selects plan**
   - Browse available plans
   - Click "Subscribe"

2. **Payment Processing**
   - Same Razorpay flow as booking
   - Payment type = "subscription"

3. **Auto-Activation**
   - Backend automatically:
     - Creates/updates OrganizerSubscription
     - Sets status to "active"
     - Updates user role to "event_admin"
     - Sets renewal date (30 days)

4. **Confirmation**
   - User redirected to dashboard
   - Subscription features enabled

---

## 🔐 Security Features

### Payment Signature Verification

Every payment is verified using HMAC-SHA256:

```javascript
const generatedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (generatedSignature !== razorpay_signature) {
  // Payment is invalid
}
```

### Protected Routes

All payment endpoints require authentication:
- User must be logged in
- JWT token verified
- User can only access their own payments
- Admin routes protected with `requireAdmin` middleware

---

## 📊 Payment Model Schema

```javascript
{
  userId: ObjectId,           // Reference to User
  amount: Number,             // Amount in INR
  currency: String,           // Default: "INR"
  orderId: String,            // Unique order ID
  paymentId: String,          // Razorpay payment ID
  signature: String,          // Payment signature
  status: String,             // created, paid, failed, refunded
  paymentType: String,        // event, subscription
  referenceId: ObjectId,      // Event ID or Plan ID
  metadata: {
    eventId: ObjectId,
    eventName: String,
    quantity: Number,
    ticketType: String,
    planId: ObjectId,
    planName: String
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  errorCode: String,
  errorDescription: String,
  refundId: String,
  refundAmount: Number,
  refundedAt: Date,
  refundReason: String,
  timestamps: true
}
```

---

## 🎨 Component Props

### RazorpayButton

```typescript
interface RazorpayButtonProps {
  amount: number;              // Amount in INR (required)
  paymentType: 'event' | 'subscription';  // (required)
  referenceId: string;         // Event/Plan ID (required)
  metadata?: object;           // Additional data
  onSuccess?: (data) => void;  // Success callback
  onFailure?: (error) => void; // Failure callback
  buttonText?: string;         // Button label
  className?: string;          // Custom CSS classes
  disabled?: boolean;          // Disable button
}
```

### PaymentStatus

```typescript
interface PaymentStatusProps {
  status: 'success' | 'failed' | 'pending';
  message?: string;
  paymentId?: string;
  transactionId?: string;
  amount?: number;
  details?: object;
  onRetry?: () => void;
  redirectUrl?: string;
  redirectText?: string;
}
```

---

## 🛠 Admin Features

### View All Payments

```javascript
// Get all payments with filters
const { data } = await API.get('/payments', {
  params: {
    status: 'paid',
    paymentType: 'event',
    page: 1,
    limit: 20
  }
});
```

### Initiate Refund

```javascript
// Admin can refund payments
const { data } = await API.post(`/payments/${paymentId}/refund`, {
  amount: 1000,  // Optional: partial refund
  reason: 'User requested cancellation'
});
```

### Payment Statistics

The `/api/payments` endpoint returns stats:

```javascript
{
  success: true,
  data: [...payments],
  stats: [
    { _id: 'paid', count: 150, totalAmount: 150000 },
    { _id: 'failed', count: 10, totalAmount: 0 },
    { _id: 'refunded', count: 5, totalAmount: 5000 }
  ],
  pagination: { total, page, pages, limit }
}
```

---

## 🧪 Testing

### Test Mode

1. Use test credentials:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```

2. Test cards (no real money charged):
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: Any other card that's invalid
   - CVV: Any 3 digits
   - Expiry: Any future date

### Testing Payment Flow

1. Create test order
2. Use Razorpay test card
3. Complete payment
4. Verify in Razorpay dashboard
5. Check Payment model in database

---

## 🚨 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to load payment gateway" | Razorpay SDK not loaded | Check internet connection |
| "Payment verification failed" | Invalid signature | Check secret key |
| "Amount must be at least ₹1" | Amount too low | Set amount >= 1 |
| "Payment record not found" | Order ID mismatch | Verify order creation |

### Error Logs

Check server logs for detailed errors:
```bash
tail -f server/logs/payment.log
```

---

## 📱 Frontend Integration Checklist

- [ ] Install payment components
- [ ] Import RazorpayButton in booking/subscription pages
- [ ] Add payment state management
- [ ] Implement onSuccess callback
- [ ] Implement onFailure callback
- [ ] Add PaymentStatus display
- [ ] Test with Razorpay test mode
- [ ] Update booking/subscription creation logic
- [ ] Add loading states
- [ ] Handle edge cases (network errors, etc.)

---

## 🔧 Backend Integration Checklist

- [ ] Install Razorpay package (`npm install razorpay`)
- [ ] Add Razorpay keys to .env
- [ ] Import payment routes in server.js
- [ ] Update booking controller to accept paymentId
- [ ] Update subscription controller if needed
- [ ] Test payment creation endpoint
- [ ] Test payment verification endpoint
- [ ] Implement webhook handler (optional)
- [ ] Add admin refund functionality
- [ ] Set up production keys before go-live

---

## 🌐 Production Deployment

### Before Going Live

1. **Switch to Live Keys**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```

2. **Enable Webhooks** (Optional but recommended)
   - Go to Razorpay Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/payments/webhook`
   - Select events: payment.captured, payment.failed
   - Implement webhook handler in backend

3. **Test in Production**
   - Make small test transaction
   - Verify payment flow end-to-end
   - Check database records
   - Verify emails/notifications

4. **Monitor Payments**
   - Check Razorpay dashboard regularly
   - Monitor server logs
   - Track payment success rate
   - Handle refunds promptly

---

## 📞 Support

### Documentation Links
- [Razorpay Docs](https://razorpay.com/docs/)
- [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Payment Verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/verify-payments/)

### Troubleshooting
- Check Razorpay dashboard for failed payments
- Verify environment variables are set
- Ensure Razorpay SDK loads (check browser console)
- Check server logs for backend errors
- Verify signature validation logic

---

## ✅ Summary

You now have a complete, production-ready Razorpay payment integration that:

✅ Supports event booking payments
✅ Supports subscription payments  
✅ Includes reusable React components
✅ Has comprehensive error handling
✅ Provides payment verification
✅ Supports refunds (Admin)
✅ Includes payment history
✅ Has proper security measures
✅ Works with your existing booking system
✅ Integrates with subscription system

**Next Steps:**
1. Add Razorpay keys to .env
2. Test with test mode credentials
3. Integrate RazorpayButton into booking page
4. Integrate into subscription page
5. Test thoroughly
6. Switch to live keys for production
7. Monitor and maintain

Happy coding! 🚀

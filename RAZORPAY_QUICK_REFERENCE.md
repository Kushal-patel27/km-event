# Razorpay Integration - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Install & Configure

```bash
cd server
npm install razorpay
```

Add to `server/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### 2. Use in Frontend

```jsx
import RazorpayButton from '../../components/payment/RazorpayButton';

<RazorpayButton
  amount={1500}
  paymentType="event"
  referenceId={eventId}
  metadata={{ eventId, eventName, quantity }}
  onSuccess={(data) => console.log('Success:', data)}
  onFailure={(error) => console.log('Failed:', error)}
  buttonText="Pay ₹1,500"
/>
```

### 3. Handle Success

```jsx
const handlePaymentSuccess = async (paymentData) => {
  await API.post('/bookings', {
    ...bookingData,
    paymentId: paymentData.data.paymentId,
    paymentStatus: 'completed'
  });
  navigate('/success');
};
```

---

## 📁 Files Created

### Backend
- `server/models/Payment.js` - Payment model
- `server/controllers/paymentController.js` - Payment logic
- `server/routes/paymentRoutes.js` - API routes
- `server/server.js` - Updated with payment routes

### Frontend
- `Frontend-EZ/src/components/payment/RazorpayButton.jsx`
- `Frontend-EZ/src/components/payment/PaymentStatus.jsx`
- `Frontend-EZ/src/examples/PaymentIntegrationGuide.jsx`

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/create-order` | Create payment order | User |
| POST | `/api/payments/verify` | Verify payment | User |
| POST | `/api/payments/failure` | Record failure | User |
| GET | `/api/payments/my-payments` | Get my payments | User |
| GET | `/api/payments/:paymentId` | Get payment details | User |
| GET | `/api/payments/` | Get all payments | Admin |
| POST | `/api/payments/:paymentId/refund` | Refund payment | Admin |

---

## 💳 Test Cards

Use these in test mode (no real money):

| Card Number | Result |
|-------------|--------|
| `4111 1111 1111 1111` | Success |
| `4000 0000 0000 0002` | Failure |

CVV: Any 3 digits | Expiry: Any future date

---

## 🎯 Component Props

### RazorpayButton

```typescript
{
  amount: number,              // Required: Amount in INR
  paymentType: 'event' | 'subscription',  // Required
  referenceId: string,         // Required: Event/Plan ID
  metadata?: object,           // Optional: Extra data
  onSuccess?: (data) => void,  // Optional: Success callback
  onFailure?: (error) => void, // Optional: Failure callback
  buttonText?: string,         // Optional: Button text
  className?: string,          // Optional: CSS classes
  disabled?: boolean           // Optional: Disable button
}
```

### PaymentStatus

```typescript
{
  status: 'success' | 'failed' | 'pending',  // Required
  message?: string,            // Optional: Status message
  paymentId?: string,          // Optional: Payment ID
  transactionId?: string,      // Optional: Transaction ID
  amount?: number,             // Optional: Payment amount
  details?: object,            // Optional: Extra details
  onRetry?: () => void,        // Optional: Retry callback
  redirectUrl?: string,        // Optional: Redirect URL
  redirectText?: string        // Optional: Redirect button text
}
```

---

## 🔄 Payment Flow Diagram

```
User Action → Create Order → Razorpay Checkout → Verify Payment → Update Database
   ↓              ↓                ↓                   ↓              ↓
Select Pay   POST /create-    Razorpay Modal     POST /verify   Create Booking
  Items        order           User Pays          Signature      Set status=paid
```

---

## 📝 Integration Checklist

### Backend Setup
- [x] Created Payment model
- [x] Created payment controller
- [x] Created payment routes
- [x] Updated server.js
- [ ] Install razorpay: `npm install razorpay`
- [ ] Add keys to .env
- [ ] Restart server

### Frontend Integration
- [x] Created RazorpayButton component
- [x] Created PaymentStatus component
- [x] Created integration examples
- [ ] Import in booking page
- [ ] Add payment flow to booking
- [ ] Add payment flow to subscription
- [ ] Test with test mode

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Failed to load payment gateway" | Check internet, Razorpay SDK blocked? |
| "Payment verification failed" | Check RAZORPAY_KEY_SECRET is correct |
| "Amount must be at least ₹1" | Ensure amount >= 1 |
| Button not working | Check console for errors, verify keys |
| Payment success but booking failed | Check backend logs, API errors |

---

## 🔐 Security Notes

✅ All payments verified with HMAC-SHA256 signature
✅ Payment secrets never exposed to frontend
✅ All endpoints require authentication
✅ Users can only access their own payments
✅ Admin routes protected

---

## 🌐 Environment Variables

```env
# Development (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Production (Live Mode)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Important:** Never commit .env to Git!

---

## 📊 Payment Model

```javascript
{
  userId: ObjectId,
  amount: Number,
  currency: "INR",
  orderId: String,          // Razorpay order ID
  paymentId: String,        // Razorpay payment ID
  signature: String,        // Payment signature
  status: String,           // created | paid | failed | refunded
  paymentType: String,      // event | subscription
  referenceId: ObjectId,    // Event/Plan ID
  metadata: Object,         // Additional data
  timestamps: true
}
```

---

## 🎨 UI Examples

### Booking Page Integration

```jsx
{showPayment ? (
  <div className="payment-section">
    <h3>Complete Payment</h3>
    <div className="amount">₹{totalAmount}</div>
    
    <RazorpayButton
      amount={totalAmount}
      paymentType="event"
      referenceId={eventId}
      metadata={{ eventId, quantity, eventName }}
      onSuccess={handlePaymentSuccess}
      onFailure={handlePaymentFailure}
      buttonText={`Pay ₹${totalAmount}`}
    />
  </div>
) : (
  <button onClick={handleProceedToPayment}>
    Continue to Payment
  </button>
)}
```

### Subscription Page Integration

```jsx
<RazorpayButton
  amount={plan.monthlyFee}
  paymentType="subscription"
  referenceId={plan._id}
  metadata={{ planId: plan._id, planName: plan.name }}
  onSuccess={handleSubscriptionSuccess}
  onFailure={handlePaymentFailure}
  buttonText={`Subscribe for ₹${plan.monthlyFee}/month`}
/>
```

---

## 📞 Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Dashboard**: https://dashboard.razorpay.com/
- **Test Payments**: Use test mode cards
- **Integration Guide**: See `RAZORPAY_INTEGRATION_GUIDE.md`
- **Examples**: See `src/examples/PaymentIntegrationGuide.jsx`

---

## ✅ Pre-Launch Checklist

Before going live:

- [ ] Test payments in test mode
- [ ] Verify webhooks (optional)
- [ ] Switch to live keys
- [ ] Test small live transaction
- [ ] Verify booking creation works
- [ ] Check payment records in database
- [ ] Monitor Razorpay dashboard
- [ ] Set up refund process
- [ ] Train admin on refund handling

---

## 🚀 Next Steps

1. **Install Razorpay**
   ```bash
   cd server && npm install razorpay
   ```

2. **Add Keys to .env**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

3. **Restart Server**
   ```bash
   npm start
   ```

4. **Integrate in Booking Page**
   - Import RazorpayButton
   - Add payment flow
   - Test with test card

5. **Test Thoroughly**
   - Success case
   - Failure case
   - Network errors
   - Edge cases

6. **Go Live**
   - Switch to live keys
   - Test with real money (small amount)
   - Monitor payments

---

**Need Help?** Check the full guide: `RAZORPAY_INTEGRATION_GUIDE.md`

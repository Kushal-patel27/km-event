# Razorpay Payment Gateway Integration

## Overview
Complete Razorpay payment integration for event ticket booking with secure backend order creation, payment verification, MongoDB payment records, and React checkout flow.

## Features Implemented

### 1. Backend Payment Processing
- **Order Creation**: Generates Razorpay orders with unique receipt numbers
- **Payment Verification**: Validates payment signatures using HMAC-SHA256
- **Webhook Handling**: Processes payment events (captured, failed, refunded)
- **Duplicate Prevention**: Prevents duplicate orders for the same booking
- **Error Tracking**: Comprehensive error logging and failure reasons

### 2. Payment Data Models
- **Payment Model**: Tracks all payment transactions with fields:
  - Order and Payment IDs
  - Amount, currency, status
  - Payment method and verification details
  - Refund information
  - Webhook processing status
  - Error tracking

- **Booking Model Updated**: Includes payment reference fields:
  - `payment.razorpayOrderId`
  - `payment.razorpayPaymentId`
  - `payment.paidAt`
  - `payment.receiptNumber`

### 3. Frontend Checkout Flow
- **RazorpayCheckout Component**: React modal for payment processing
  - Loads Razorpay SDK
  - Creates orders on demand
  - Handles payment success/failure
  - Auto-verifies payments on backend

### 4. Post-Payment Features
- **QR Code Generation**: Auto-generates QR codes for each ticket
- **Email Notifications**: Sends confirmation with ticket details and QR codes
- **Booking Confirmation**: Updates booking status to "Confirmed"
- **Ticket IDs**: Generates unique 8-character ticket IDs

### 5. Refund Management
- **User-initiated Refunds**: Users can request refunds through API
- **Admin Refund Processing**: Manual refund status updates
- **Refund Tracking**: Complete refund workflow (pending → processed → failed)
- **Refund Notifications**: Email notifications for refund status

### 6. Analytics & Reporting
- **Payment Dashboard**: Analytics on revenue, success rates, payment methods
- **Payment Reports**: CSV export of transaction history
- **Refund Tracking**: View all refund requests with status
- **Failed Payment Monitoring**: Track and retry failed payments
- **Top Events**: Revenue breakdown by event

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install razorpay pdfkit
```

### 2. Update Environment Variables
Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Get Razorpay Credentials
1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Copy Key ID and Key Secret
4. Set webhook endpoint in Razorpay dashboard: `https://yourdomain.com/api/payments/webhook`

### 4. Database Migrations
The Payment model is automatically created. Booking model fields are optional (backward compatible).

## API Endpoints

### Payment Endpoints

#### Create Order
```
POST /api/payments/order
Auth: Required
Body: { bookingId: "booking_id" }
Response: { success: true, orderId, key, amount, user }
```

#### Verify Payment
```
POST /api/payments/verify
Auth: Required
Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId }
Response: { success: true, payment: {...} }
```

#### Get Payment Status
```
GET /api/payments/status/:bookingId
Auth: Required
Response: { success: true, payment: {...} }
```

#### Process Refund
```
POST /api/payments/refund
Auth: Required
Body: { bookingId }
Response: { success: true, refundId }
```

#### Webhook Handler
```
POST /api/payments/webhook
No Auth Required (Signature verified)
Handles: payment.authorized, payment.captured, payment.failed, refund.processed
```

### Analytics Endpoints

#### Get Payment Analytics
```
GET /api/analytics/payments/analytics?startDate=&endDate=&eventId=&status=
Auth: Required (Admin)
Response: { success: true, analytics, payments }
```

#### Get Payment Report
```
GET /api/analytics/payments/report?format=json|csv&startDate=&endDate=
Auth: Required (Admin)
Response: JSON or CSV file
```

#### Get Refund Requests
```
GET /api/analytics/refunds
Auth: Required (Admin)
Response: { success: true, refunds }
```

#### Get Failed Payments
```
GET /api/analytics/payments/failed
Auth: Required (Admin)
Response: { success: true, payments }
```

## Frontend Integration

### Using RazorpayCheckout Component

```jsx
import RazorpayCheckout from '../components/RazorpayCheckout'

export default function MyComponent() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      <button onClick={() => setCheckoutOpen(true)}>
        Pay Now
      </button>

      <RazorpayCheckout
        bookingId={bookingId}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPaymentSuccess={(payment) => {
          console.log('Payment successful!', payment)
          // Refresh bookings or navigate
        }}
        onPaymentFailure={(error) => {
          console.log('Payment failed:', error)
        }}
      />
    </>
  )
}
```

## Payment Flow

```
1. User initiates payment
   ↓
2. Frontend calls POST /api/payments/order
   ↓
3. Backend creates Razorpay order + Payment record
   ↓
4. Frontend opens Razorpay checkout modal
   ↓
5. User enters payment details and completes payment
   ↓
6. Razorpay returns success response
   ↓
7. Frontend calls POST /api/payments/verify with signature
   ↓
8. Backend verifies signature using HMAC-SHA256
   ↓
9. Backend fetches payment from Razorpay API
   ↓
10. If captured:
    - Update Payment record to "captured"
    - Update Booking status to "Confirmed"
    - Generate QR codes for tickets
    - Send confirmation email
    ↓
11. Webhook also confirms payment (prevents race conditions)
```

## Edge Case Handling

### 1. Duplicate Webhooks
- `webhookId` and `webhookProcessed` flag prevent duplicate processing
- Each webhook event is idempotent

### 2. Failed Payments
- `errorCode` and `errorDescription` stored
- `verificationAttempts` tracked
- Manual retry via admin API

### 3. Network Issues
- Webhook is authoritative source of payment status
- Manual verification retry available
- Email confirmation sent only after verification

### 4. Refund Edge Cases
- Prevents double refunds (checks payment status)
- Validates authorization before processing
- Tracks refund status changes

## Email Notifications

### Booking Confirmation Email
Includes:
- Event details
- Booking ID and ticket details
- Payment confirmation
- QR codes for entry
- Link to view tickets
- Support contact info

### Refund Notification Email
Includes:
- Refund amount and ID
- Event name
- Expected processing time
- Transaction reference

## Database Schema

### Payment Collection
```javascript
{
  orderId: String,              // Unique order identifier
  paymentId: ObjectId,          // MongoDB ID
  user: ObjectId,               // Reference to User
  booking: ObjectId,            // Reference to Booking
  event: ObjectId,              // Reference to Event
  amount: Number,               // In INR
  currency: String,             // "INR"
  status: String,               // "created", "captured", "failed", "refunded"
  razorpayOrderId: String,      // Razorpay order ID
  razorpayPaymentId: String,    // Razorpay payment ID
  razorpaySignature: String,    // Payment signature
  refund: {
    refundId: String,
    amount: Number,
    status: String,             // "pending", "processed", "failed"
    reason: String,
    requestedAt: Date,
    processedAt: Date
  },
  webhookProcessed: Boolean,    // Prevent duplicate processing
  failureReason: String,
  errorCode: String,
  errorDescription: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Measures

1. **Signature Verification**: HMAC-SHA256 verification of all Razorpay payloads
2. **Authorization Checks**: User ownership verification before payment operations
3. **Duplicate Prevention**: Order uniqueness constraints
4. **Error Handling**: No sensitive data exposed in error messages
5. **Webhook Validation**: Signature verification on all webhooks
6. **Idempotency**: Webhook processing is idempotent

## Testing

### Manual Testing Steps

1. **Create Booking**
   ```bash
   POST /api/bookings
   { eventId, quantity, seats }
   ```

2. **Create Order**
   ```bash
   POST /api/payments/order
   { bookingId }
   ```

3. **Process Payment**
   - Use Razorpay test card: 4111111111111111
   - Any future expiry date
   - Any 3-digit CVV

4. **Verify Payment**
   ```bash
   POST /api/payments/verify
   { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId }
   ```

5. **Check Analytics**
   ```bash
   GET /api/analytics/payments/analytics
   ```

## Troubleshooting

### "Payment verification failed"
- Ensure RAZORPAY_KEY_SECRET is correct
- Check signature calculation

### "Booking not found"
- Verify bookingId exists and belongs to user
- Check booking status

### "Webhook not processing"
- Verify RAZORPAY_WEBHOOK_SECRET is set
- Check webhook URL is publicly accessible
- Test webhook signature in Razorpay dashboard

### "QR codes not generating"
- Check generateQR utility is accessible
- Verify qrcode package is installed
- Check server logs for errors

## Future Enhancements

1. **Installments**: Support EMI options
2. **International Payments**: Multi-currency support
3. **Payment Links**: Generate shareable payment links
4. **Subscription**: Support recurring payments
5. **Disputes**: Handle payment disputes
6. **3D Secure**: Enhanced security for certain cards
7. **Invoice Generation**: PDF invoices with payment details
8. **Batch Refunds**: Admin bulk refund processing

## API Rate Limits
- Payment creation: 100/minute per user
- Payment verification: 10/minute per order
- Analytics queries: 100/minute per admin

## Support
For Razorpay-specific issues, visit https://razorpay.com/support
For application issues, contact: support@kmevents.com

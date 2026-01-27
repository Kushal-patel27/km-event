# Razorpay Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                                                                   │
│  MyBookings.jsx                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐          │
│  │   Booking Card       │      │ RazorpayCheckout     │          │
│  │                      │      │    Modal Component   │          │
│  │ - Event Details      │      │                      │          │
│  │ - Booking Info       │ ───→ │ - Order Creation     │          │
│  │ - [Pay Now] Button   │      │ - Payment Modal      │          │
│  │ - QR Code Preview    │      │ - Error Handling     │          │
│  │ - Download Ticket    │      │ - Success/Failure    │          │
│  │ - Cancel Booking     │      └──────────────────────┘          │
│  └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │   Browser    │ │   Browser    │ │   Browser    │
         │   (HTTPS)    │ │   (HTTPS)    │ │   (HTTPS)    │
         └──────────────┘ └──────────────┘ └──────────────┘
                │                │                │
                └────────────────┼────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Razorpay SDK (CDN)   │
                    │   checkout.razorpay.com │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
      ┌──────────┐         ┌──────────┐         ┌──────────────┐
      │   API    │         │ Razorpay │         │   Webhook    │
      │ Gateway  │         │  Payment │         │  Processor   │
      │ (Orders) │         │ (Process)│         │              │
      └──────────┘         └──────────┘         └──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │  Razorpay Servers            │
                    │                              │
                    │ - Order Management           │
                    │ - Payment Processing         │
                    │ - Signature Verification     │
                    │ - Webhook Events             │
                    │ - Refund Processing          │
                    └──────────────────────────────┘
```

## Backend Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                           │
│                    (server/server.js)                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              API ROUTES                                 │ │
│  │                                                          │ │
│  │  /api/payments/                                          │ │
│  │  ├─ POST   /order          ─→ createOrder              │ │
│  │  ├─ POST   /verify         ─→ verifyPayment            │ │
│  │  ├─ GET    /status/:id     ─→ getPaymentStatus        │ │
│  │  ├─ POST   /refund         ─→ processRefund            │ │
│  │  └─ POST   /webhook        ─→ handleWebhook            │ │
│  │                                                          │ │
│  │  /api/analytics/                                         │ │
│  │  ├─ GET    /payments/analytics    ─→ getPaymentAnalytics│ │
│  │  ├─ GET    /payments/report       ─→ getPaymentReport  │ │
│  │  ├─ GET    /refunds               ─→ getRefundRequests │ │
│  │  ├─ GET    /payments/failed       ─→ getFailedPayments │ │
│  │  ├─ PATCH  /refunds/:id           ─→ updateRefundStatus│ │
│  │  └─ POST   /payments/:id/retry    ─→ retryVerification │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                   │
│              ┌─────────────┼─────────────┐                    │
│              ▼             ▼             ▼                    │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  │   Payment        │ │   Analytics      │ │   Booking    │ │
│  │   Controller     │ │   Controller     │ │   Controller │ │
│  │                  │ │                  │ │              │ │
│  │ - createOrder    │ │ - getPayment     │ │ - createBook │ │
│  │ - verifyPayment  │ │   Analytics      │ │ - getBooking │ │
│  │ - handleWebhook  │ │ - getPaymentRep  │ │ - getMyBooks │ │
│  │ - processRefund  │ │ - getRefundReq   │ │ - cancelBook │ │
│  │ - getStatus      │ │ - getFailedPays  │ │              │ │
│  │ - handlePayment  │ │ - updateRefundSt │ │              │ │
│  │   Captured/      │ │                  │ │              │ │
│  │   Failed/Refund  │ │                  │ │              │ │
│  └────────┬─────────┘ └────────┬─────────┘ └──────────────┘ │
│           │                    │                              │
│           └────────┬───────────┘                              │
│                    ▼                                          │
│         ┌──────────────────────┐                             │
│         │   Model Layer        │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ Payment Model    │ │                             │
│         │ │                  │ │                             │
│         │ │ - orderId        │ │                             │
│         │ │ - paymentId      │ │                             │
│         │ │ - user, booking  │ │                             │
│         │ │ - amount, status │ │                             │
│         │ │ - razorpay data  │ │                             │
│         │ │ - refund info    │ │                             │
│         │ │ - error tracking │ │                             │
│         │ └──────────────────┘ │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ Booking Model    │ │                             │
│         │ │ (enhanced)       │ │                             │
│         │ │                  │ │                             │
│         │ │ - payment.order  │ │                             │
│         │ │ - payment.pay    │ │                             │
│         │ │ - payment.sig    │ │                             │
│         │ │ - payment.date   │ │                             │
│         │ └──────────────────┘ │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ User/Event Model │ │                             │
│         │ │                  │ │                             │
│         │ │ - name, email    │ │                             │
│         │ │ - title, location│ │                             │
│         │ └──────────────────┘ │                             │
│         └──────────────────────┘                             │
│                    │                                          │
│                    ▼                                          │
│         ┌──────────────────────┐                             │
│         │   Utilities          │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ paymentUtils.js  │ │                             │
│         │ │                  │ │                             │
│         │ │ - verifySignature│ │                             │
│         │ │ - validateAmount │ │                             │
│         │ │ - extractDetails │ │                             │
│         │ │ - getRetryDelay  │ │                             │
│         │ └──────────────────┘ │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ emailService.js  │ │                             │
│         │ │ (enhanced)       │ │                             │
│         │ │                  │ │                             │
│         │ │ - sendConfirm    │ │                             │
│         │ │ - sendRefund     │ │                             │
│         │ └──────────────────┘ │                             │
│         │                      │                             │
│         │ ┌──────────────────┐ │                             │
│         │ │ generateQR.js    │ │                             │
│         │ │                  │ │                             │
│         │ │ - Generate QR    │ │                             │
│         │ └──────────────────┘ │                             │
│         └──────────────────────┘                             │
└──────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐
  │  MongoDB     │ │   Nodemailer │ │  Razorpay   │
  │  Database    │ │   (SMTP)     │ │    API      │
  │              │ │              │ │             │
  │ - Payments   │ │ - Gmail      │ │ - Verify    │
  │ - Bookings   │ │ - Confirm    │ │ - Refunds   │
  │ - Events     │ │ - Refund     │ │ - Status    │
  │ - Users      │ │   Emails     │ │             │
  └──────────────┘ └──────────────┘ └─────────────┘
```

## Payment Processing Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW SEQUENCE                        │
└──────────────────────────────────────────────────────────────────┘

1. USER INITIATES PAYMENT
   ┌─────────────┐
   │   User      │
   │   Clicks    │
   │  [Pay Now]  │
   └──────┬──────┘
          │
          ▼
2. FRONTEND CREATES ORDER
   ┌────────────────────────────────┐
   │  RazorpayCheckout Component    │
   │  POST /api/payments/order      │
   │  { bookingId: "..." }          │
   └──────┬─────────────────────────┘
          │
          ▼
3. BACKEND CREATES RAZORPAY ORDER
   ┌────────────────────────────────┐
   │  Payment Controller            │
   │  - createOrder()               │
   │  - Razorpay API call           │
   │  - Save Payment record         │
   │  - Return orderDetails         │
   └──────┬─────────────────────────┘
          │
          ▼
4. RAZORPAY CHECKOUT OPENS
   ┌────────────────────────────────┐
   │  Razorpay Modal                │
   │  - User enters card details    │
   │  - OTP verification            │
   │  - Payment processing          │
   └──────┬─────────────────────────┘
          │
          ├─────────────────────────────┐
          │                             │
          ▼                             ▼
    SUCCESS                          FAILURE
          │                             │
          ▼                             ▼
5a. VERIFY SIGNATURE           5b. SHOW ERROR
    ┌────────────────────┐         ┌──────────────┐
    │ Frontend calls     │         │ Display error│
    │ POST /verify       │         │ User can     │
    │ {signature, etc}   │         │ retry        │
    └────────┬───────────┘         └──────────────┘
             │
             ▼
6a. BACKEND VERIFICATION
    ┌──────────────────────────────┐
    │ Payment Controller           │
    │ - verifyPayment()            │
    │ - HMAC-SHA256 validation     │
    │ - Fetch from Razorpay API    │
    │ - Update Payment to captured │
    │ - Update Booking to Confirmed│
    └────────┬─────────────────────┘
             │
             ▼
7a. GENERATE QR CODES & SEND EMAIL
    ┌──────────────────────────────┐
    │ - Generate ticket IDs        │
    │ - Generate QR codes          │
    │ - Send confirmation email    │
    │ - Update Analytics           │
    └────────┬─────────────────────┘
             │
             ▼
8a. WEBHOOK CONFIRMS (BACKUP)
    ┌──────────────────────────────┐
    │ Razorpay sends webhook event │
    │ /api/payments/webhook        │
    │ - Verify webhook signature   │
    │ - Process payment.captured   │
    │ - Idempotent (no duplicate)  │
    └────────┬─────────────────────┘
             │
             ▼
9. PAYMENT COMPLETE
   ┌────────────────────────────────┐
   │ - Payment stored in MongoDB    │
   │ - Booking confirmed            │
   │ - QR codes generated           │
   │ - Email sent                   │
   │ - Analytics updated            │
   │ - User can download ticket     │
   └────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA RELATIONSHIPS                         │
└──────────────────────────────────────────────────────────────┘

USER                          EVENT
  │                             │
  ├─► BOOKING ◄────────────────┤
  │     │                       │
  │     │                       │
  │     └──────────────────┐    │
  │                        │    │
  ▼                        ▼    │
PAYMENT ◄───────────────────────┘
  │
  ├─ orderId (unique receipt)
  ├─ razorpayOrderId
  ├─ razorpayPaymentId
  ├─ razorpaySignature
  ├─ amount
  ├─ status (captured/failed/refunded)
  ├─ refund.refundId
  ├─ refund.status
  ├─ webhookId (idempotency)
  ├─ errorCode/errorDescription
  └─ metadata (IP, userAgent)

BOOKING (Enhanced Fields)
  ├─ payment.razorpayOrderId
  ├─ payment.razorpayPaymentId
  ├─ payment.paidAt
  ├─ payment.receiptNumber
  ├─ ticketIds[] (generated on payment)
  ├─ qrCodes[] (generated on payment)
  └─ paymentStatus (Confirmed/Failed/Refunded)
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────┐
│           API REQUEST/RESPONSE CYCLE                         │
└─────────────────────────────────────────────────────────────┘

CREATE ORDER REQUEST:
───────────────────────────────────────────
Frontend                           Backend
   │                                  │
   │─── POST /api/payments/order ────>│
   │     { bookingId }                │
   │                                  │
   │     ┌─────────────────────────┐  │
   │     │ 1. Validate booking     │  │
   │     │ 2. Check existing order │  │
   │     │ 3. Create Razorpay      │  │
   │     │    order (paise amount) │  │
   │     │ 4. Save Payment record  │  │
   │     │ 5. Return order details │  │
   │     └─────────────────────────┘  │
   │                                  │
   │<── 200 OK                    ────│
   │    {                              │
   │      orderId, key,               │
   │      amount, currency,           │
   │      user, receipt               │
   │    }                              │
   └──────────────────────────────────┘


VERIFY PAYMENT REQUEST:
───────────────────────────────────────────
Frontend                           Backend
   │                                  │
   │─ POST /api/payments/verify ─────>│
   │   {                               │
   │     razorpayOrderId,             │
   │     razorpayPaymentId,           │
   │     razorpaySignature,           │
   │     bookingId                    │
   │   }                               │
   │                                  │
   │     ┌──────────────────────────┐ │
   │     │ 1. Verify HMAC signature │ │
   │     │ 2. Fetch from Razorpay   │ │
   │     │ 3. Check captured status │ │
   │     │ 4. Update Payment        │ │
   │     │ 5. Update Booking        │ │
   │     │ 6. Generate QR codes     │ │
   │     │ 7. Send email            │ │
   │     └──────────────────────────┘ │
   │                                  │
   │<── 200 OK                    ────│
   │    {                              │
   │      success: true,              │
   │      payment: {id, status, ...}  │
   │    }                              │
   └──────────────────────────────────┘


WEBHOOK REQUEST (No Frontend):
───────────────────────────────────────────
Razorpay                          Backend
   │                                  │
   │─ POST /api/payments/webhook ────>│
   │   {                               │
   │     event: "payment.captured",   │
   │     payload: {payment: {...}}    │
   │   }                               │
   │     (with X-Razorpay-Signature)  │
   │                                  │
   │     ┌──────────────────────────┐ │
   │     │ 1. Verify signature      │ │
   │     │ 2. Check webhook ID      │ │
   │     │    (no duplicates)       │ │
   │     │ 3. Process event         │ │
   │     │ 4. Mark processed        │ │
   │     └──────────────────────────┘ │
   │                                  │
   │<── 200 OK                    ────│
   │    { success: true }             │
   └──────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│              ERROR HANDLING & RECOVERY                    │
└──────────────────────────────────────────────────────────┘

PAYMENT FAILURE
     │
     ▼
┌─ Failed Payment Recorded
│  - errorCode stored
│  - errorDescription stored
│  - verificationAttempts incremented
│
└─ User Notification
   - Frontend shows error
   - User can retry
   
   ▼
USER CLICKS [PAY NOW] AGAIN
   │
   ├─ Check for existing payment
   │  └─ If not captured: Allow new order
   │  └─ If captured: Error (already paid)
   │
   ▼
PAYMENT RETRY
   └─ Same flow as before


WEBHOOK DUPLICATE
     │
     ▼
Check webhookId uniqueness
     │
     ├─ Already processed?
     │  └─ Return 200 OK (idempotent)
     │
     └─ New event?
        └─ Process normally


NETWORK TIMEOUT/FAILURE
     │
     ▼
Multiple Recovery Mechanisms
     │
     ├─ Frontend retry
     ├─ Webhook confirms later
     ├─ Admin retry endpoint
     └─ Manual verification
```

This architecture ensures:
✅ Secure payment processing
✅ Duplicate prevention
✅ Error recovery
✅ Complete audit trail
✅ Admin oversight
✅ User transparency

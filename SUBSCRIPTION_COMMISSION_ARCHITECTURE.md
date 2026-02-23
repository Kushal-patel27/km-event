# Subscription & Commission Module Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ROLES                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   ORGANIZER      │  │      ADMIN       │  │   SUPER ADMIN    │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │ • View Plan      │  │ • Create Plans   │  │ • Platform       │  │
│  │ • View Revenue   │  │ • Assign Plans   │  │   Analytics      │  │
│  │ • Request Payout │  │ • Manage Payouts │  │ • All Reports    │  │
│  │ • Track Status   │  │ • View Analytics │  │ • Comparisons    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ↓             ↓             ↓
          ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
          │ Organizer Pages  │  │   Admin Pages    │  │  Analytics Pages │
          ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
          │ • Dashboard      │  │ • Plans Manager  │  │ • Commission     │
          │ • Revenue View   │  │ • Subscription   │  │   Analytics      │
          │ • Payout Request │  │   Manager        │  │ • Revenue        │
          │                  │  │ • Commission     │  │   Analytics      │
          │                  │  │   Analytics      │  │                  │
          └──────────────────┘  └──────────────────┘  └──────────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ↓                           ↓
              ┌──────────────────┐      ┌──────────────────┐
              │  SUBSCRIPTION    │      │   COMMISSION     │
              │    ROUTES        │      │    ROUTES        │
              ├──────────────────┤      ├──────────────────┤
              │ • /plans         │      │ • /commissions   │
              │ • /subscriptions │      │ • /analytics     │
              └──────────────────┘      └──────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ↓                           ↓
            ┌──────────────────┐      ┌──────────────────┐
            │  CONTROLLERS     │      │   ANALYTICS      │
            │                  │      │   CONTROLLERS    │
            ├──────────────────┤      ├──────────────────┤
            │subscription:     │      │revenue:          │
            │ • Plan Mgmt      │      │ • Platform Data  │
            │ • Subscription   │      │ • Organizer Data │
            │ • Commission     │      │ • Event Data     │
            │ • Payout         │      │ • Comparison     │
            └──────────────────┘      └──────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ↓                           ↓
            ┌──────────────────┐      ┌──────────────────┐
            │   MODELS         │      │   DATABASE       │
            ├──────────────────┤      ├──────────────────┤
            │ • Plan           │      │ • subscriptionplan│
            │ • OrgSubsc       │      │ • organizer_sub  │
            │ • Commission     │      │ • commission     │
            │ • Payout         │      │ • payout         │
            │ • Booking*       │      │ • booking*       │
            └──────────────────┘      └──────────────────┘
```

## Data Flow Diagram

### Booking → Commission Flow

```
USER BOOKS TICKET
        │
        ↓
    BOOKING CREATED
    ┌─────────────────────────┐
    │ bookingId: ABC123       │
    │ eventId: EVENT001       │
    │ quantity: 2             │
    │ price: ₹500 each        │
    └─────────────────────────┘
        │
        ↓
FETCH ORGANIZER SUBSCRIPTION
    ┌─────────────────────────┐
    │ organizerId: ORG001      │
    │ planId: PLAN002         │
    │ commissionPercentage: 20│
    └─────────────────────────┘
        │
        ↓
CALCULATE COMMISSION
    ┌─────────────────────────┐
    │ subtotal: ₹1000         │
    │ commission%: 20         │
    │ commission: ₹200        │
    │ organizer_amt: ₹800     │
    └─────────────────────────┘
        │
        ↓
CREATE COMMISSION RECORD
    ┌─────────────────────────┐
    │ commissionId: COM001     │
    │ status: pending         │
    │ amount: ₹200            │
    └─────────────────────────┘
        │
        ↓
UPDATE BOOKING
    ┌─────────────────────────┐
    │ commission: {           │
    │   percentage: 20,       │
    │   amount: 200,          │
    │   organizerAmt: 800     │
    │ }                       │
    │ commissionId: COM001    │
    └─────────────────────────┘
```

### Payout Request Flow

```
ORGANIZER REQUESTS PAYOUT
    │
    ↓
VALIDATE AMOUNT
    ├─ >= Min Payout: YES
    ├─ <= Pending Amt: YES
    └─ Valid Details: YES
    │
    ↓
CREATE PAYOUT RECORD
    ┌─────────────────────────┐
    │ payoutId: PAYOUT001     │
    │ amount: ₹5000           │
    │ status: pending         │
    │ method: bank_transfer   │
    │ requestedAt: 2024-02-04 │
    └─────────────────────────┘
    │
    ↓
UPDATE COMMISSIONS
    ┌─────────────────────────┐
    │ status: pending → allocated
    │ payoutId: PAYOUT001     │
    │ count: 15 commissions   │
    └─────────────────────────┘
    │
    ↓
SEND TO ADMIN QUEUE
    │
    ├─ ADMIN REVIEWS
    │   │
    │   ↓
    │ UPDATE TO "processing"
    │   │
    │   ↓
    │ PROCESS PAYMENT
    │   │
    │   ↓
    │ UPDATE TO "completed"
    │ + Add Transaction ID
    │   │
    │   ↓
    │ UPDATE COMMISSIONS
    │   status: allocated → paid
    │   │
    │   ↓
    │ SEND NOTIFICATION
    │
    └─ ORGANIZER NOTIFIED
        Funds Available in Bank
```

## Commission Calculation Details

```
TICKET SALE
    Price: ₹500
    Quantity: 2
        │
        ↓
    SUBTOTAL = 500 × 2 = ₹1000
        │
        ├─ Plan: Basic
        ├─ Commission%: 20%
        │
        ↓
    COMMISSION_AMOUNT = 1000 × (20/100) = ₹200
        │
        ├─ Goes to: Platform
        │
        ↓
    ORGANIZER_AMOUNT = 1000 - 200 = ₹800
        │
        ├─ Goes to: Organizer (After Payout)
        │
        ↓
    BREAKDOWN
    ┌──────────────────────────┐
    │ User Paid:      ₹1000    │
    ├──────────────────────────┤
    │ Commission:     ₹200     │ (20%)
    │ Organizer:      ₹800     │ (80%)
    └──────────────────────────┘
```

## Database Schema Relationships

```
USER
  ├── Has Many: OrganizerSubscription
  │     └── References: SubscriptionPlan
  │
  ├── Has Many: Commission
  │
  ├── Has Many: Payout
  │     └── Has Many: Commission
  │
  └── Creates: Event
        └── Has Many: Booking
              ├── Has One: Commission
              │
              └── References: User (Organizer)
                    └── SubscriptionPlan


SUBSCRIPTION_PLAN (1)
  │
  ├── name: Free, Basic, Pro
  ├── commissionPercentage: 30, 20, 10
  ├── monthlyFee: 0, 500, 2000
  ├── eventLimit: null, 10, null
  ├── ticketLimit: null, 5000, null
  │
  └── Referenced By: OrganizerSubscription (Many)


ORGANIZER_SUBSCRIPTION (1..*)
  │
  ├── organizer: User ID
  ├── plan: SubscriptionPlan ID
  ├── status: active|inactive|suspended|cancelled
  ├── currentCommissionPercentage: 30
  │
  └── Tracked By: Commission (Many)


COMMISSION (Many)
  │
  ├── booking: Booking ID
  ├── event: Event ID
  ├── organizer: User ID
  ├── ticketPrice: 500
  ├── quantity: 2
  ├── subtotal: 1000
  ├── commissionPercentage: 20
  ├── commissionAmount: 200
  ├── organizerAmount: 800
  ├── status: pending|allocated|processed|paid
  │
  └── Grouped By: Payout (Many)


PAYOUT (1..*)
  │
  ├── organizer: User ID
  ├── commissions: Commission IDs (Array)
  ├── totalAmount: 5000
  ├── status: pending|processing|completed|failed|reversed
  ├── paymentMethod: bank_transfer|upi|cheque|wallet
  │
  └── References: Commission (Many-to-Many through status)


BOOKING (Updated)
  │
  ├── commission: {
  │   ├── percentage: 20
  │   ├── amount: 200
  │   ├── organizerAmount: 800
  │   └── platformAmount: 200
  │ }
  │
  └── commissionId: Commission ID
```

## API Endpoint Structure

```
/subscription/
├── /plans
│   ├── GET    → List all plans
│   ├── POST   → Create plan (Admin)
│   ├── PUT    → Update plan (Admin)
│   └── DELETE → Delete plan (Admin)
│
├── /my-subscription
│   └── GET    → Get current subscription
│
├── /assign-plan
│   └── POST   → Assign plan to organizer (Admin)
│
├── /all-subscriptions
│   └── GET    → List all subscriptions (Admin)
│
├── /subscriptions/:id/status
│   └── PUT    → Update status (Admin)
│
├── /commissions
│   ├── POST   → Create commission (Internal)
│   └── GET    → List all (Admin)
│
├── /my-commissions
│   └── GET    → Organizer's commissions
│
├── /event/:id/commissions
│   └── GET    → Event's commissions
│
├── /payouts/request
│   └── POST   → Request payout (Organizer)
│
├── /my-payouts
│   ├── GET    → Organizer's payouts
│   └── /pending/amount → Pending balance
│
├── /all-payouts
│   └── GET    → All payouts (Admin)
│
├── /payouts/:id/status
│   └── PUT    → Update payout status (Admin)
│
└── /analytics/
    ├── /platform        → Platform analytics (Super Admin)
    ├── /organizer       → Organizer analytics
    ├── /event-admin     → Event admin analytics
    └── /compare-organizers → Compare performance (Admin)
```

## State Transitions

### Commission Status Flow
```
pending
  ├─ ✓ (Payout requested)
  └─→ allocated
      ├─ ✓ (Payout processing)
      └─→ processed
          ├─ ✓ (Payout completed)
          └─→ paid
      
      Or:
      └─→ allocated
          ├─ ✗ (Payout failed)
          └─→ pending (revert)
```

### Payout Status Flow
```
pending (Requested)
  │
  ├─→ processing (Admin started)
  │     │
  │     ├─→ completed (Success)
  │     │     └─ Commission: paid
  │     │
  │     └─→ failed (Payment error)
  │           └─ Commission: allocated (reverted)
  │
  └─→ reversed (Cancelled)
        └─ Commission: allocated (reverted)
```

## Security & Validation Flow

```
PAYOUT REQUEST
    │
    ├─ Validate: User is organizer ✓
    │
    ├─ Validate: Amount > 0 ✓
    │
    ├─ Validate: Amount >= minPayoutAmount ✓
    │
    ├─ Validate: Amount <= pendingAmount ✓
    │
    ├─ Validate: Bank details provided (if needed) ✓
    │
    ├─ Encrypt: Bank details ✓
    │
    ├─ Create: Payout record ✓
    │
    ├─ Update: Commission status ✓
    │
    └─ Success: Payout created
```

## Performance Considerations

```
DATABASE INDEXES
├── OrganizerSubscription
│   ├── organizer (unique)
│   ├── plan
│   └── status
│
├── Commission
│   ├── organizer + status
│   ├── event
│   ├── booking
│   ├── createdAt
│   └── payoutId
│
└── Payout
    ├── organizer + status
    ├── createdAt
    └── status

AGGREGATION PIPELINES
├── Revenue Summary: Group by organizer
├── Top Organizers: Sort by revenue
├── Daily Trends: Group by date
└── Comparisons: Multi-stage pipeline
```

---

**Note**: This diagram shows the complete system architecture and data flow for the Subscription & Commission Module. Refer to the documentation files for implementation details.

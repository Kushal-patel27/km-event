# Discount Coupon System Implementation Guide

## Overview
A complete discount coupon system for K&M Events that allows admins and event organizers to create promotional coupons with various discount types, usage limits, and expiry dates.

## Features Implemented

### 1. **Backend Components**

#### Database Model (Coupon.js)
- **Fields:**
  - `code`: Unique coupon code (uppercase, 3-20 characters)
  - `description`: Optional discount description
  - `discountType`: "percentage" or "fixed"
  - `discountValue`: Discount amount (0-100 for percentage)
  - `expiryDate`: When coupon expires
  - `usageLimit`: Max number of uses (unlimited if null)
  - `usageCount`: Current usage count
  - `minOrderAmount`: Minimum purchase required
  - `maxDiscountAmount`: Maximum discount cap
  - `applicableEventIds`: Events this coupon applies to
  - `applicableCategories`: Event categories (future use)
  - `isPublic`: Whether visible to all users
  - `isActive`: Active/inactive status
  - `createdBy`: Admin/Event Admin who created it
  - `createdByRole`: "admin" or "event_admin"
  - `eventAdminId`: Event admin owner (if applicable)
  - `usedByUsers`: Track who used the coupon
  - `tags`: For categorization

#### API Endpoints

**Public Routes (Authenticated Users)**
- `POST /api/coupons/validate` - Validate and get coupon details
- `POST /api/coupons/apply` - Apply coupon after successful payment

**Admin Routes**
- `GET /api/coupons` - List all coupons (paginated)
- `POST /api/coupons` - Create new coupon
- `GET /api/coupons/details/:couponId` - Get coupon details
- `PUT /api/coupons/:couponId` - Update coupon
- `DELETE /api/coupons/:couponId` - Delete coupon
- `GET /api/coupons/:couponId/statistics` - Get usage statistics

**Event Admin Routes**
- `GET /api/coupons/event-admin/my-coupons` - List own event's coupons
- `POST /api/coupons/event-admin/create` - Create event coupon
- `PUT /api/coupons/event-admin/:couponId` - Update event coupon
- `DELETE /api/coupons/event-admin/:couponId` - Delete event coupon

### 2. **Frontend Components**

#### Admin Coupon Manager (`/pages/admin/AdminCouponManager.jsx`)
**Features:**
- View all coupons in paginated table
- Create new coupons with all parameters
- Edit existing coupons
- Delete coupons
- Search by code or description
- Filter by active/inactive status
- Responsive desktop and mobile views
- Dark mode support

**Form Fields:**
- Coupon Code (disabled after creation)
- Discount Type (percentage or fixed)
- Discount Value
- Expiry Date
- Usage Limit
- Minimum Order Amount
- Maximum Discount Amount
- Tags
- Description
- Public/Private toggle

#### Event Admin Coupon Manager (`/pages/event-admin/EventAdminCouponManager.jsx`)
**Features:**
- Manage coupons for their events only
- Assign coupons to specific events
- Beautiful card-based layout
- Mobile-responsive design
- Real-time coupon status display
- Edit and delete capabilities

#### Coupon Discount Component (`/components/payment/CouponDiscount.jsx`)
**Features:**
- Input field for coupon code
- Real-time validation
- Shows discount amount applied
- Error/success messages
- Responsive mobile-first design
- Easy removal of applied coupon
- Helpful tips for users

### 3. **Frontend Integration**

#### Booking Page Updates (`/pages/public/Booking.jsx`)
- Integrated CouponDiscount component before price summary
- Added coupon state management
- Updated total calculation to include coupon discount
- Pass coupon info to payment button
- Combined promotional offer discounts with coupon discounts

#### Payment Button Updates (`/components/payment/RazorpayButton.jsx`)
- Accepts coupon parameter
- Sends coupon data to backend with payment order
- Stores coupon info in payment record

#### Payment Model Updates
- Added coupon fields to Payment schema:
  - `coupon.couponId`
  - `coupon.code`
  - `coupon.discountType`
  - `coupon.discountValue`
  - `coupon.discountAmount`
  - `originalAmount` (before discount)
  - `discountedAmount` (after discount)

### 4. **Security Features**
- Coupon code validation on backend
- Expiry date verification
- Usage limit enforcement
- User authentication required
- Admin/Event Admin role restrictions
- Proper error handling and messages

## How to Use

### For Admins
1. Go to Admin Dashboard → Coupon Management
2. Click "New Coupon"
3. Enter coupon details:
   - Code (e.g., SAVE20)
   - Discount type and value
   - Expiry date
   - Optional: Usage limit, min order amount, max discount cap
4. Click "Create Coupon"
5. View, edit, or delete coupons from the dashboard

### For Event Admins
1. Go to Event Admin Dashboard → Event Coupons
2. Click "New Coupon"
3. Select your events from the list
4. Enter coupon details
5. Click "Create Coupon"

### For Users (Checkout)
1. Go to event booking page
2. Select tickets and quantity
3. In the "Coupon" section, enter code
4. Click "Apply"
5. See discount applied instantly
6. Proceed to payment

## Example Coupons

### 20% Percentage Discount
```
Code: SAVE20
Type: Percentage
Value: 20%
Max Discount: ₹500 (optional)
Min Order: ₹500
```

### Fixed Amount Discount
```
Code: FLAT100
Type: Fixed
Value: ₹100
Min Order: ₹1000
```

### Limited Usage Coupon
```
Code: SUMMER2024
Type: Percentage
Value: 15%
Usage Limit: 100
Expiry: 31-08-2024
```

## Testing Checklist

### Backend Testing
- [ ] Create coupon via admin endpoint
- [ ] Create coupon via event admin endpoint
- [ ] Validate coupon code
- [ ] Check expiry date validation
- [ ] Verify usage limit enforcement
- [ ] Test minimum order amount check
- [ ] Verify max discount cap application
- [ ] Check event applicability
- [ ] Test coupon removal
- [ ] Verify payment integration with coupon

### Frontend Testing

#### Admin Panel
- [ ] Create coupon form displays correctly
- [ ] All fields are editable
- [ ] Coupon code cannot be edited after creation
- [ ] Coupons display in table with correct info
- [ ] Search functionality works
- [ ] Filter by active/inactive works
- [ ] Edit button updates coupon
- [ ] Delete button removes coupon
- [ ] Pagination works correctly
- [ ] Responsive on mobile/tablet/desktop

#### Event Admin Panel
- [ ] Can see only own events in dropdown
- [ ] Can create event-specific coupons
- [ ] Coupon cards display correctly
- [ ] Can edit own coupons
- [ ] Can delete own coupons
- [ ] Mobile view is responsive
- [ ] Dark mode works

#### Booking Page
- [ ] Coupon input field visible
- [ ] Can enter and validate coupon code
- [ ] Discount calculated correctly
- [ ] Error messages display properly
- [ ] Applied coupon shows with remove button
- [ ] Total price updates with discount
- [ ] Coupon data passes to payment
- [ ] Works on mobile view
- [ ] Dark mode compatible

### Integration Testing
- [ ] Apply coupon → sees discount → pays → booking created
- [ ] Invalid coupon → error message
- [ ] Expired coupon → error message
- [ ] Usage limit reached → error message
- [ ] Min order not met → error message
- [ ] Percentage discount applied correctly
- [ ] Fixed discount applied correctly
- [ ] Max discount cap respected
- [ ] Multiple discounts don't double-apply

## Database Queries

### Find active coupons
```javascript
Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } })
```

### Find coupons by admin
```javascript
Coupon.find({ createdBy: adminId, createdByRole: 'admin' })
```

### Find event-specific coupons
```javascript
Coupon.find({ applicableEventIds: eventId })
```

### Update usage count
```javascript
coupon.usageCount += 1
```

## Performance Optimizations
- Indexes on `code`, `isActive`, `createdBy`
- Virtual fields for `isValid` and `isExpired`
- Pagination for coupon lists (20 items per page)
- Efficient MongoDB queries with proper indexing

## Future Enhancements
1. Bulk coupon generation
2. Usage analytics dashboard
3. Referral coupon system
4. Tiered coupons (e.g., better discounts for more quantities)
5. Coupon templates
6. Automatic coupon application based on rules
7. Email coupon delivery
8. QR code generation for coupons
9. Coupon combinations/stacking rules
10. A/B testing coupon effectiveness

## Troubleshooting

### Coupon not applying
- Check if code is correct (case-insensitive)
- Verify coupon has not expired
- Ensure usage limit not reached
- Check if min order amount met
- Verify coupon applies to this event

### Discount not reflecting in payment
- Clear browser cache
- Check if event ID matches
- Verify coupon is active
- Check console for errors

### Can't create coupon
- Verify user is admin or event admin
- Check all required fields filled
- Ensure expiry date is in future
- Verify no duplicate coupon code

## Support
For issues or feature requests, contact the development team.

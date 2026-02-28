# Coupon System Quick Start Guide

## Installation & Setup

### Step 1: Database
The Coupon model is already defined. MongoDB will automatically create the collection when first insert occurs.

### Step 2: Backend Routes
Routes are already registered in `server.js`:
```javascript
import couponRoutes from "./routes/couponRoutes.js"
app.use("/api/coupons", couponRoutes)
```

### Step 3: Frontend Integration
All components are created and imported where needed.

## Quick Testing

### Test 1: Create Admin Coupon via API
```bash
curl -X POST http://localhost:5000/api/coupons \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "description": "Save 20% on all events",
    "discountType": "percentage",
    "discountValue": 20,
    "expiryDate": "2025-12-31",
    "usageLimit": 100,
    "isPublic": true
  }'
```

### Test 2: Validate Coupon
```bash
curl -X POST http://localhost:5000/api/coupons/validate \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "eventId": "EVENT_ID",
    "subtotal": 1000
  }'
```

### Test 3: UI Testing
1. **Admin**: http://localhost:5173/admin/coupons (if route added to admin nav)
2. **Event Admin**: http://localhost:5173/event-admin/coupons (if route added)
3. **User**: Go to any event booking page and use coupon field

## File Locations

### Backend Files
- Model: `/server/models/Coupon.js`
- Controller: `/server/controllers/couponController.js`
- Routes: `/server/routes/couponRoutes.js`
- Updated: `/server/models/Payment.js`, `/server/controllers/paymentController.js`

### Frontend Files
- Admin UI: `/src/pages/admin/AdminCouponManager.jsx`
- Event Admin UI: `/src/pages/event-admin/EventAdminCouponManager.jsx`
- Component: `/src/components/payment/CouponDiscount.jsx`
- Updated: `/src/pages/public/Booking.jsx`, `/src/components/payment/RazorpayButton.jsx`

### Documentation
- Detailed Guide: `COUPON_SYSTEM_GUIDE.md`
- Quick Start: `COUPON_QUICK_START.md` (this file)

## Navigation Integration (TODO)

To add coupon management to admin menus, update navigation components:

### For Admin
```jsx
// In AdminLayout or admin navigation
<Link to="/admin/coupons">Discount Coupons</Link>
```

### For Event Admin
```jsx
// In EventAdminLayout or event admin navigation
<Link to="/event-admin/coupons">Event Coupons</Link>
```

## Common Issues & Solutions

### Issue: 404 error on coupon endpoints
**Solution**: Ensure coupon routes are registered in `server.js`

### Issue: "You don't have permission"
**Solution**: Check user role. Admins = admin, Event Organizers = event_admin

### Issue: Coupon doesn't apply in checkout
**Solution**: 
1. Check browser console for errors
2. Verify coupon code exists and is active
3. Check if coupon applies to this event

### Issue: Dark mode not working
**Solution**: Ensure `useDarkMode` context is properly set up

## API Response Examples

### Create Coupon Success
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6g7h8i9j0k",
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "isActive": true,
    "expiryDate": "2025-12-31T00:00:00.000Z"
  }
}
```

### Validate Coupon Success
```json
{
  "success": true,
  "message": "Coupon is valid",
  "data": {
    "couponId": "663a1b2c3d4e5f6g7h8i9j0k",
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "discountAmount": 200,
    "currency": "INR",
    "description": "Get 20% off"
  }
}
```

### Validate Coupon Error
```json
{
  "success": false,
  "message": "Coupon has expired"
}
```

## Performance Notes

- Coupons are indexed by code, active status, and creator
- Payment records include coupon details for reporting
- Validation queries are optimized with indexes
- Frontend uses pagination for coupon lists

## Security Considerations

✅ User authentication required for all endpoints
✅ Admin role verification for admin endpoints
✅ Event admin can only manage own event coupons
✅ Backend coupon validation prevents client-side bypass
✅ Usage limits enforced at database level
✅ Expiry dates verified server-side

## Next Steps

1. Add navigation links in admin/event-admin dashboards
2. Test with sample coupons
3. Monitor usage metrics
4. Gather user feedback
5. Implement future enhancements as needed

## Support Files
- `COUPON_SYSTEM_GUIDE.md` - Complete documentation
- This file - Quick start
- Code comments in components for inline help

# Adding Coupon Management to Navigation

## For Admin Dashboard

### Option 1: Update Admin Navigation Component
Find your admin navigation file (likely `AdminLayout.jsx` or similar) and add:

```jsx
// In your admin navigation/sidebar
<Link to="/admin/coupons" className="menu-item">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4 4h.01m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Discount Coupons</span>
</Link>
```

### Option 2: Create Admin Routes
Add to your admin routing (find where admin routes are defined):

```jsx
import AdminCouponManager from '../pages/admin/AdminCouponManager'

// In your routes array
{
  path: '/admin/coupons',
  element: <AdminCouponManager />,
  requiredRole: 'admin'
}
```

---

## For Event Admin Dashboard

### Option 1: Update Event Admin Navigation
Find your event admin navigation and add:

```jsx
// In your event admin navigation/sidebar
<Link to="/event-admin/coupons" className="menu-item">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
  <span>Event Coupons</span>
</Link>
```

### Option 2: Create Event Admin Routes
Add to your event admin routing:

```jsx
import EventAdminCouponManager from '../pages/event-admin/EventAdminCouponManager'

// In your routes array
{
  path: '/event-admin/coupons',
  element: <EventAdminCouponManager />,
  requiredRole: 'event_admin'
}
```

---

## Dashboard Integration Examples

### Admin Dashboard Menu Integration
```jsx
const adminMenuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart' },
  { label: 'Bookings', path: '/admin/bookings', icon: 'ticket' },
  { label: 'Events', path: '/admin/events', icon: 'calendar' },
  { label: 'Users', path: '/admin/users', icon: 'users' },
  { label: 'Discount Coupons', path: '/admin/coupons', icon: 'tag' }, // ← ADD THIS
  { label: 'Settings', path: '/admin/settings', icon: 'settings' },
]
```

### Event Admin Dashboard Menu Integration
```jsx
const eventAdminMenuItems = [
  { label: 'Dashboard', path: '/event-admin/dashboard', icon: 'chart' },
  { label: 'My Events', path: '/event-admin/events', icon: 'calendar' },
  { label: 'Bookings', path: '/event-admin/bookings', icon: 'ticket' },
  { label: 'Revenue', path: '/event-admin/revenue', icon: 'trending' },
  { label: 'Event Coupons', path: '/event-admin/coupons', icon: 'tag' }, // ← ADD THIS
  { label: 'Settings', path: '/event-admin/settings', icon: 'settings' },
]
```

---

## URL Mapping

| User Type | URL | Component |
|-----------|-----|-----------|
| Admin | `/admin/coupons` | `AdminCouponManager.jsx` |
| Event Admin | `/event-admin/coupons` | `EventAdminCouponManager.jsx` |
| User | (no direct access) | Uses `CouponDiscount.jsx` in checkout |

---

## Testing Navigation

After adding the routes:

1. **As Admin:**
   - Login as admin
   - Navigate to Discount Coupons
   - Should see `AdminCouponManager` page
   - Create test coupon

2. **As Event Admin:**
   - Login as event admin
   - Navigate to Event Coupons
   - Should see `EventAdminCouponManager` page
   - Create test coupon for your events

3. **As User:**
   - Go to event booking page
   - Should see coupon input field
   - Enter admin-created coupon code
   - Should see discount applied

---

## Component Import Reference

```jsx
// Admin Component
import AdminCouponManager from '../../pages/admin/AdminCouponManager'

// Event Admin Component  
import EventAdminCouponManager from '../../pages/event-admin/EventAdminCouponManager'

// Coupon Input Component (already used in Booking.jsx)
import CouponDiscount from '../../components/payment/CouponDiscount'
```

---

## Sidebar/Menu Icon Suggestions

### For Admin Nav
```jsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z M4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
</svg>
```

### For Event Admin Nav
```jsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
```

---

## Styling Tips

Add consistent styling with your existing menu items:

```css
/* Navigation Link Styling */
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.nav-link.active {
  background-color: #4f46e5;
  color: white;
}
```

---

## Quick Setup Checklist

- [ ] Create route definition in admin router
- [ ] Create route definition in event admin router
- [ ] Add navigation link to admin sidebar/nav
- [ ] Add navigation link to event admin sidebar/nav
- [ ] Test admin can access `/admin/coupons`
- [ ] Test event admin can access `/event-admin/coupons`
- [ ] Verify styling matches existing navigation
- [ ] Test that coupon input works on checkout page
- [ ] Verify dark mode works for coupon pages
- [ ] Test on mobile devices

---

## No Additional Configuration Needed!

The coupon system is **plug-and-play** once you add the navigation links. 

✅ Backend is ready
✅ Database is ready  
✅ API endpoints are registered
✅ Components are built
✅ Payment integration is complete

Just add the navigation links and you're done!

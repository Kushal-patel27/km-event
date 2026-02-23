# Create Your Own Event Module - Complete Architecture

## 🎯 Overview
A comprehensive MERN stack SaaS module for event management platforms with subscription-based feature access control.

## 🏗️ Architecture Components

### **Backend Structure**

#### 1. **MongoDB Models**

##### SubscriptionPlan Model (`server/models/SubscriptionPlan.js`)
```
- Defines 4 plan tiers: Basic, Standard, Professional, Enterprise
- Each plan includes:
  * Pricing (monthly/annual)
  * Feature flags for 9 core features
  * Resource limits (events, attendees, storage)
  * Transaction fees and support levels
```

**Features Controlled:**
1. ✅ Ticketing - Sell and manage tickets
2. 📱 QR Check-in - QR code generation
3. 📸 Scanner App - Mobile entry verification
4. 📊 Analytics - Real-time insights
5. 📧 Email/SMS - Automated notifications
6. 💳 Payments - Payment processing
7. ⛅ Weather Alerts - Weather monitoring
8. 👥 Sub-admins - Additional administrators
9. 📈 Reports - Comprehensive reporting

##### EventRequest Model (`server/models/EventRequest.js`)
```
Enhanced with:
- subscriptionPlan reference
- requestedFeatures object
- approvedFeatures object
- billingCycle (monthly/annual)
- approvedAt timestamp
- adminNotes field
```

##### FeatureToggle Model (`server/models/FeatureToggle.js`)
```
Existing model - stores per-event feature enablement
```

#### 2. **Controllers**

##### SubscriptionPlanController (`server/controllers/subscriptionPlanController.js`)
**Public Routes:**
- `GET /api/subscriptions/plans` - Fetch all active plans
- `GET /api/subscriptions/plans/compare` - Compare plans
- `GET /api/subscriptions/plans/:id` - Get plan by ID
- `GET /api/subscriptions/plans/name/:name` - Get plan by name

**Super Admin Only:**
- `POST /api/subscriptions/plans` - Create new plan
- `PUT /api/subscriptions/plans/:id` - Update plan
- `DELETE /api/subscriptions/plans/:id` - Deactivate plan

##### EventRequestController (`server/controllers/eventRequestController.js`)
**Organizer Routes:**
- `POST /api/event-requests/create-request` - Submit event request
  * Auto-populates features based on selected plan
  * Validates plan exists and is active
  * Prevents duplicate pending requests
  
- `GET /api/event-requests/my-requests` - View own requests

**Super Admin Routes:**
- `GET /api/event-requests/pending` - View pending requests
- `GET /api/event-requests/all?status=PENDING` - Filter by status
- `POST /api/event-requests/:id/approve` - Approve with feature override
  * Creates Event in database
  * Upgrades user to event_admin role
  * Creates FeatureToggle with approved features
  * Sends approval email
  * Accepts featureOverrides and adminNotes
  
- `POST /api/event-requests/:id/reject` - Reject with reason
  * Updates status to REJECTED
  * Sends rejection email with reason

**Feature Management:**
- `GET /api/event-requests/:eventId/features` - Get feature toggles
- `PUT /api/event-requests/:eventId/features` - Update features
- `GET /api/event-requests/:eventId/enabled-features` - Get only enabled features

#### 3. **Middleware**

##### Feature-Based Middleware (`server/middleware/featureMiddleware.js`)
```javascript
// Check single feature
checkFeature('ticketing')

// Check at least one feature
checkAnyFeature(['ticketing', 'qrCheckIn'])

// Check all features required
checkAllFeatures(['ticketing', 'payments'])

// Attach features without blocking
attachEnabledFeatures
```

**Usage Example:**
```javascript
router.get('/events/:eventId/analytics', 
  protect, 
  checkFeature('analytics'),
  getEventAnalytics
)
```

**Super Admin Bypass:** All feature checks are automatically bypassed for super_admin role.

#### 4. **Routes**

##### Subscription Routes (`server/routes/subscriptionRoutes.js`)
```
Mounted at: /api/subscriptions
```

##### Event Request Routes (`server/routes/eventRequestRoutes.js`)
```
Mounted at: /api/event-requests
- Includes organizer, super admin, and feature routes
```

#### 5. **Database Seeding**

##### Seed Script (`server/utils/seedSubscriptionPlans.js`)
```bash
# Run to populate default subscription plans
cd server
node utils/seedSubscriptionPlans.js
```

**Default Plans Created:**

| Plan | Price/mo | Tickets | Features |
|------|----------|---------|----------|
| Basic | $0 | 100 | Ticketing, Payments (5% fee) |
| Standard | $29 | 500 | + QR Check-in, Analytics, Reports |
| Professional | $79 | 2000 | + Scanner, Email/SMS, Sub-admins |
| Enterprise | $199 | Unlimited | All features + Weather Alerts |

---

### **Frontend Structure**

#### 1. **Event Request Form**
**Location:** `Frontend-EZ/src/pages/public/CreateEventRequest.jsx` (enhanced version available)

**Features:**
- Visual plan comparison with pricing toggle (monthly/annual)
- Auto-sync available tickets with total tickets
- Multiple ticket types support
- Organizer information capture
- Real-time feature preview based on selected plan
- Order summary display

**Flow:**
1. User selects subscription plan
2. Fills event details (title, description, date, location, etc.)
3. Adds ticket types (optional)
4. Provides organizer info
5. Reviews order summary
6. Submits request → status: PENDING

#### 2. **Super Admin Dashboard**
**Location:** `Frontend-EZ/src/pages/super-admin/EventRequestsDashboard.jsx`

**Features:**
- Filter by status (PENDING, APPROVED, REJECTED, ALL)
- View all request details and organizer info
- Approve requests with feature toggle override
- Visual feature checklist with enable/disable switches
- Add admin notes on approval
- Reject with custom reason
- Real-time status updates

**Approval Modal:**
- Displays default plan features
- Toggle switches for each of 9 features
- Override capability (enable features not in plan, or disable included ones)
- Admin notes field for internal tracking

#### 3. **Event Admin Components**

##### Feature Guard Component
**Location:** `Frontend-EZ/src/components/event-admin/EventAdminFeatureGuard.jsx`

**Usage:**
```jsx
<EventAdminFeatureGuard 
  requiredFeature="analytics" 
  eventId={eventId}
>
  <AnalyticsComponent />
</EventAdminFeatureGuard>
```

Shows "Feature Not Available" message if feature is disabled.

##### Event Admin Dashboard (Enhanced)
**Location:** `Frontend-EZ/src/pages/event-admin/EventAdminDashboard.jsx` (new version created)

**Features:**
- Multi-event selector
- Visual feature cards (enabled vs disabled)
- Click-through navigation to enabled features only
- Disabled features shown as locked with upgrade prompt
- Quick actions panel
- Event overview statistics

---

## 🔄 Complete Flow

### **Phase 1: Event Request Creation**
```
1. Organizer navigates to /create-event-request
2. Views available subscription plans
3. Selects plan (e.g., "Professional")
4. System auto-populates requestedFeatures:
   {
     ticketing: true,
     qrCheckIn: true,
     scannerApp: true,
     analytics: true,
     emailSms: true,
     payments: true,
     weatherAlerts: false,
     subAdmins: true,
     reports: true
   }
5. Fills event details
6. Submits → EventRequest created with status: PENDING
```

### **Phase 2: Super Admin Review**
```
1. Super Admin opens /super-admin/event-requests
2. Sees pending request in dashboard
3. Reviews event details, organizer info, selected plan
4. Clicks "Approve"
5. Modal opens showing requested features as toggles
6. Super Admin can:
   - Keep default features (from plan)
   - Enable additional features (override)
   - Disable included features (downgrade)
   - Add admin notes
7. Clicks "Confirm Approval"
```

### **Phase 3: System Processing (Approval)**
```
Backend executes:
1. Create Event document in MongoDB
2. Update User:
   - role → event_admin (if not already admin)
   - assignedEvents.push(newEventId)
3. Create FeatureToggle:
   - eventId: newEventId
   - features: approvedFeatures (with overrides)
4. Update EventRequest:
   - status → APPROVED
   - approvedBy → adminId
   - approvedAt → Date.now()
   - approvedFeatures → final feature set
5. Send approval email to organizer
6. Return: { event, featureToggle, eventRequest }
```

### **Phase 4: Event Admin Access**
```
1. Organizer logs in
2. Role upgraded to event_admin
3. Opens /event-admin/dashboard
4. System fetches:
   - Assigned events
   - Enabled features for each event
5. Dashboard renders:
   - Only enabled features as clickable cards
   - Disabled features shown as locked
6. Clicks on enabled feature (e.g., "Analytics")
7. Feature middleware checks access
8. Grants access if enabled
```

---

## 🛡️ Security & Access Control

### **Role-Based Access**
```
super_admin → Full access, bypasses all feature checks
event_admin → Access only to assigned events + enabled features
user → Can create event requests only
```

### **Feature-Based Access**
Every protected route includes feature middleware:
```javascript
// Example: Analytics route
router.get('/events/:eventId/analytics', 
  protect,                    // Must be authenticated
  checkFeature('analytics'),  // Must have analytics enabled
  getAnalytics
)

// Middleware logic:
1. Verify user is authenticated
2. Check if user has access to this event
3. Fetch FeatureToggle for event
4. Verify feature.enabled === true
5. Allow or deny with 403 error
```

### **Event Access Control**
Users can only access events where:
- They are the organizer (event.organizer === userId)
- OR they are assigned (user.assignedEvents.includes(eventId))
- OR they are super_admin

---

## 📡 API Reference

### **Subscription Plans**
```
GET    /api/subscriptions/plans
GET    /api/subscriptions/plans/compare
GET    /api/subscriptions/plans/:id
GET    /api/subscriptions/plans/name/:name
POST   /api/subscriptions/plans          [Super Admin]
PUT    /api/subscriptions/plans/:id      [Super Admin]
DELETE /api/subscriptions/plans/:id      [Super Admin]
```

### **Event Requests**
```
POST   /api/event-requests/create-request
GET    /api/event-requests/my-requests
GET    /api/event-requests/pending        [Super Admin]
GET    /api/event-requests/all            [Super Admin]
POST   /api/event-requests/:id/approve    [Super Admin]
POST   /api/event-requests/:id/reject     [Super Admin]
```

### **Features**
```
GET    /api/event-requests/:eventId/features
PUT    /api/event-requests/:eventId/features
GET    /api/event-requests/:eventId/enabled-features
```

---

## 🚀 Deployment Steps

### **1. Backend Setup**
```bash
cd server

# Install dependencies (if new packages added)
npm install

# Seed subscription plans
node utils/seedSubscriptionPlans.js

# Start server
npm run dev
```

### **2. Frontend Setup**
```bash
cd Frontend-EZ

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### **3. Database Configuration**
Ensure MongoDB connection string is configured in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/km-event
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

### **4. Test the Flow**
1. Register as a user
2. Navigate to `/create-event-request`
3. Create an event request
4. Log in as super_admin
5. Go to `/super-admin/event-requests`
6. Approve the request
7. Log back in as the organizer
8. Check `/event-admin/dashboard` for enabled features

---

## 🔧 Configuration Options

### **Customizing Subscription Plans**
Edit `server/utils/seedSubscriptionPlans.js`:
```javascript
{
  name: 'Custom',
  displayName: 'Custom Plan',
  price: { monthly: 149, annual: 1490 },
  features: {
    ticketing: { enabled: true, limit: 5000 },
    // ... configure as needed
  }
}
```

### **Adding New Features**
1. Add to SubscriptionPlan model features object
2. Add to EventRequest requestedFeatures/approvedFeatures
3. Add to FeatureToggle model features object
4. Create middleware check
5. Update frontend components
6. Add to feature labels mapping

### **Email Customization**
Edit templates in `server/utils/emailService.js`:
- `sendEventApprovalEmail()`
- `sendEventRejectionEmail()`

---

## 📊 Database Schema Reference

### **SubscriptionPlan**
```javascript
{
  name: String (enum),
  displayName: String,
  description: String,
  price: { monthly: Number, annual: Number },
  features: { [featureName]: { enabled, limit, description } },
  limits: { eventsPerMonth, attendeesPerEvent, storageGB, ... },
  isActive: Boolean,
  displayOrder: Number
}
```

### **EventRequest**
```javascript
{
  // Organizer Info
  organizerId: ObjectId,
  organizerName: String,
  organizerEmail: String,
  organizerPhone: String,
  organizerCompany: String,
  
  // Event Info
  title: String,
  description: String,
  category: String,
  date: Date,
  location: String,
  totalTickets: Number,
  ticketTypes: Array,
  
  // Subscription
  subscriptionPlan: ObjectId,
  planSelected: String,
  billingCycle: String,
  requestedFeatures: Object,
  approvedFeatures: Object,
  
  // Status
  status: String (PENDING/APPROVED/REJECTED),
  approvedBy: ObjectId,
  approvedAt: Date,
  rejectReason: String,
  adminNotes: String
}
```

### **FeatureToggle**
```javascript
{
  eventId: ObjectId,
  features: {
    [featureName]: {
      enabled: Boolean,
      description: String
    }
  },
  toggledBy: ObjectId
}
```

---

## 🎨 UI Components Guide

### **Plan Selection Card**
```jsx
- Visual pricing display
- Feature list with checkmarks
- Active/inactive state
- Monthly/annual toggle
- Click to select
```

### **Feature Toggle Switch**
```jsx
- Checkbox for each feature
- Visual enabled/disabled state
- Grouped by category
- Permission-based display
```

### **Feature Guard**
```jsx
- Shows loading state
- Fetches feature access
- Renders children if enabled
- Shows upgrade prompt if disabled
```

---

## 🐛 Troubleshooting

### Issue: Features not showing in Event Admin dashboard
**Solution:** 
1. Check FeatureToggle exists for event
2. Verify GET `/api/event-requests/:eventId/enabled-features` returns features
3. Check user.assignedEvents includes eventId

### Issue: Feature middleware blocking super_admin
**Solution:** Ensure middleware has super_admin bypass:
```javascript
if (user.role === 'super_admin') {
  return next()
}
```

### Issue: Approval email not sending
**Solution:** Check `emailService.js` configuration and email provider settings

---

## 📈 Future Enhancements

1. **Payment Integration**
   - Stripe/PayPal for subscription billing
   - Automatic plan upgrades/downgrades

2. **Usage Tracking**
   - Monitor feature usage
   - Enforce limits (email quotas, ticket limits)

3. **Plan Recommendations**
   - AI-based plan suggestions based on event size

4. **Multi-tenant Support**
   - Organization-level subscriptions
   - Team management

5. **Feature Analytics**
   - Track which features drive conversions
   - A/B testing for plans

---

## 📝 Code Examples

### **Protecting a Route with Feature Check**
```javascript
import { checkFeature } from '../middleware/featureMiddleware.js'

router.post('/events/:eventId/send-notification',
  protect,
  checkFeature('emailSms'),
  sendNotificationController
)
```

### **Using Feature Guard in React**
```jsx
import EventAdminFeatureGuard from '../components/event-admin/EventAdminFeatureGuard'

function AnalyticsPage() {
  const { eventId } = useParams()
  
  return (
    <EventAdminFeatureGuard requiredFeature="analytics" eventId={eventId}>
      <div>
        <h1>Analytics Dashboard</h1>
        {/* Analytics content */}
      </div>
    </EventAdminFeatureGuard>
  )
}
```

### **Checking Multiple Features**
```javascript
import { checkAllFeatures } from '../middleware/featureMiddleware.js'

router.post('/events/:eventId/send-sms-with-qr',
  protect,
  checkAllFeatures(['emailSms', 'qrCheckIn']),
  sendSmsWithQrController
)
```

---

## ✅ Testing Checklist

- [ ] Seed subscription plans successfully
- [ ] User can view all plans
- [ ] User can create event request with plan selection
- [ ] Request shows in Super Admin pending list
- [ ] Super Admin can approve with default features
- [ ] Super Admin can override features during approval
- [ ] Super Admin can reject with reason
- [ ] Approval creates Event, updates User role, creates FeatureToggle
- [ ] Rejection sends email with reason
- [ ] Event Admin sees only assigned events
- [ ] Event Admin dashboard shows only enabled features
- [ ] Disabled features show as locked
- [ ] Feature middleware blocks access to disabled features
- [ ] Super Admin bypasses all feature checks
- [ ] Email notifications sent on approval/rejection

---

## 🔐 Security Best Practices

1. **Always validate subscription plan existence** before creating request
2. **Check user.assignedEvents** before granting event access
3. **Use feature middleware** on all feature-specific routes
4. **Validate feature overrides** on approval (Super Admin only)
5. **Rate limit** event request creation to prevent spam
6. **Sanitize admin notes** to prevent XSS
7. **Verify email addresses** before sending notifications

---

## 📞 Support & Maintenance

### **Regular Tasks**
- Monitor event request approval times
- Review feature usage patterns
- Update subscription plan pricing
- Audit feature access logs

### **Monitoring**
- Track number of pending requests
- Monitor feature toggle changes
- Alert on approval/rejection patterns

---

**Last Updated:** January 2026  
**Version:** 1.0  
**Author:** Senior MERN Stack SaaS Architect

# API Usage Examples - Create Your Own Event Module

## 🔑 Authentication

All protected endpoints require authentication. Include JWT token in headers:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 1️⃣ Subscription Plans API

### GET /api/subscriptions/plans
**Access:** Public  
**Description:** Fetch all active subscription plans

**Request:**
```bash
curl http://localhost:5000/api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "_id": "65abc123...",
      "name": "Basic",
      "displayName": "Basic Plan",
      "description": "Perfect for small events and getting started",
      "price": {
        "monthly": 0,
        "annual": 0
      },
      "features": {
        "ticketing": {
          "enabled": true,
          "limit": 100,
          "description": "Sell and manage up to 100 tickets"
        },
        "qrCheckIn": {
          "enabled": false,
          "description": "QR code-based check-in not available"
        },
        // ... other features
      },
      "limits": {
        "eventsPerMonth": 1,
        "attendeesPerEvent": 100,
        "storageGB": 0.5,
        "customBranding": false,
        "prioritySupport": false
      },
      "isActive": true,
      "displayOrder": 1
    },
    // ... other plans
  ]
}
```

### GET /api/subscriptions/plans/compare
**Access:** Public  
**Description:** Get side-by-side plan comparison

**Request:**
```bash
curl http://localhost:5000/api/subscriptions/plans/compare
```

**Response:**
```json
{
  "success": true,
  "comparison": {
    "plans": [
      {
        "name": "Basic",
        "displayName": "Basic Plan",
        "price": { "monthly": 0, "annual": 0 },
        "features": { /* all features */ },
        "limits": { /* all limits */ }
      }
      // ... other plans
    ]
  }
}
```

### POST /api/subscriptions/plans
**Access:** Super Admin Only  
**Description:** Create a new subscription plan

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/subscriptions/plans', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Premium',
    displayName: 'Premium Plan',
    description: 'For serious event organizers',
    price: {
      monthly: 129,
      annual: 1290
    },
    features: {
      ticketing: { enabled: true, limit: 5000 },
      qrCheckIn: { enabled: true },
      scannerApp: { enabled: true },
      analytics: { enabled: true },
      emailSms: { enabled: true, emailLimit: 10000, smsLimit: 1000 },
      payments: { enabled: true, transactionFee: 2.0 },
      weatherAlerts: { enabled: true },
      subAdmins: { enabled: true, limit: 10 },
      reports: { enabled: true, types: ['basic', 'advanced', 'custom'] }
    },
    limits: {
      eventsPerMonth: 20,
      attendeesPerEvent: 5000,
      storageGB: 50,
      customBranding: true,
      prioritySupport: true
    },
    displayOrder: 3
  })
})
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan created successfully",
  "plan": { /* created plan object */ }
}
```

---

## 2️⃣ Event Requests API

### POST /api/event-requests/create-request
**Access:** Authenticated Users  
**Description:** Submit an event creation request

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/event-requests/create-request', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Event Details
    title: 'Tech Conference 2026',
    description: 'Annual technology conference featuring industry leaders',
    category: 'Conference',
    date: '2026-06-15T09:00:00Z',
    location: 'San Francisco, CA',
    locationDetails: 'Moscone Center, 747 Howard St',
    totalTickets: 500,
    availableTickets: 500,
    price: 99,
    image: 'https://example.com/event-image.jpg',
    
    // Ticket Types (optional)
    ticketTypes: [
      {
        name: 'Early Bird',
        price: 79,
        quantity: 100,
        available: 100,
        description: 'Limited early bird pricing'
      },
      {
        name: 'VIP',
        price: 199,
        quantity: 50,
        available: 50,
        description: 'VIP access with exclusive perks'
      }
    ],
    
    // Organizer Details
    organizerPhone: '+1-555-123-4567',
    organizerCompany: 'Tech Events Inc.',
    
    // Subscription
    planSelected: 'Professional',
    billingCycle: 'annual'
  })
})
```

**Response:**
```json
{
  "success": true,
  "message": "Event request submitted successfully. Awaiting super admin approval.",
  "eventRequest": {
    "_id": "65abc456...",
    "title": "Tech Conference 2026",
    "status": "PENDING",
    "planSelected": "Professional",
    "requestedFeatures": {
      "ticketing": true,
      "qrCheckIn": true,
      "scannerApp": true,
      "analytics": true,
      "emailSms": true,
      "payments": true,
      "weatherAlerts": false,
      "subAdmins": true,
      "reports": true
    },
    "subscriptionPlan": { /* populated plan object */ },
    "organizerName": "John Doe",
    "organizerEmail": "john@example.com",
    "createdAt": "2026-01-19T10:30:00Z"
  }
}
```

### GET /api/event-requests/my-requests
**Access:** Authenticated Users  
**Description:** Get user's own event requests

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/event-requests/my-requests', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

**Response:**
```json
{
  "requests": [
    {
      "_id": "65abc456...",
      "title": "Tech Conference 2026",
      "status": "PENDING",
      "planSelected": "Professional",
      "createdAt": "2026-01-19T10:30:00Z",
      "updatedAt": "2026-01-19T10:30:00Z"
    }
    // ... more requests
  ]
}
```

### GET /api/event-requests/pending
**Access:** Super Admin Only  
**Description:** Get all pending event requests

**Request:**
```bash
curl http://localhost:5000/api/event-requests/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "65abc456...",
      "title": "Tech Conference 2026",
      "description": "Annual technology conference...",
      "status": "PENDING",
      "planSelected": "Professional",
      "requestedFeatures": { /* ... */ },
      "organizerId": {
        "_id": "65abc123...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "subscriptionPlan": { /* populated plan */ },
      "createdAt": "2026-01-19T10:30:00Z"
    }
  ]
}
```

### POST /api/event-requests/:id/approve
**Access:** Super Admin Only  
**Description:** Approve an event request with optional feature overrides

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/event-requests/65abc456.../approve', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Optional: Override features (if not provided, uses requestedFeatures)
    featureOverrides: {
      ticketing: true,
      qrCheckIn: true,
      scannerApp: true,
      analytics: true,
      emailSms: true,
      payments: true,
      weatherAlerts: true,  // OVERRIDE: Enable even though not in Professional plan
      subAdmins: true,
      reports: true
    },
    // Optional: Add admin notes
    adminNotes: 'Approved with weather alerts enabled as special request'
  })
})
```

**Response:**
```json
{
  "success": true,
  "message": "Event approved successfully and confirmation email sent",
  "event": {
    "_id": "65def789...",
    "title": "Tech Conference 2026",
    "status": "scheduled",
    "organizer": "65abc123...",
    // ... full event object
  },
  "featureToggle": {
    "_id": "65def890...",
    "eventId": "65def789...",
    "features": {
      "ticketing": { "enabled": true, "description": "..." },
      "qrCheckIn": { "enabled": true, "description": "..." },
      "weatherAlerts": { "enabled": true, "description": "..." },
      // ... all features
    }
  },
  "eventRequest": {
    "_id": "65abc456...",
    "status": "APPROVED",
    "approvedBy": "65admin123...",
    "approvedAt": "2026-01-19T11:00:00Z",
    "approvedFeatures": { /* final approved features */ },
    "adminNotes": "Approved with weather alerts enabled as special request"
  }
}
```

### POST /api/event-requests/:id/reject
**Access:** Super Admin Only  
**Description:** Reject an event request

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/event-requests/65abc456.../reject', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    rejectReason: 'Event description does not meet our community guidelines. Please provide more details about the event agenda and speakers.'
  })
})
```

**Response:**
```json
{
  "success": true,
  "message": "Event request rejected and notification email sent",
  "eventRequest": {
    "_id": "65abc456...",
    "status": "REJECTED",
    "rejectReason": "Event description does not meet our community guidelines...",
    "updatedAt": "2026-01-19T11:15:00Z"
  }
}
```

---

## 3️⃣ Feature Management API

### GET /api/event-requests/:eventId/features
**Access:** Authenticated Users  
**Description:** Get feature toggles for an event

**Request:**
```bash
curl http://localhost:5000/api/event-requests/65def789.../features \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "_id": "65def890...",
  "eventId": "65def789...",
  "features": {
    "ticketing": {
      "enabled": true,
      "description": "Allow ticket sales and management"
    },
    "qrCheckIn": {
      "enabled": true,
      "description": "QR code generation for check-in"
    },
    "scannerApp": {
      "enabled": false,
      "description": "Mobile scanner app for entry verification"
    }
    // ... all 9 features
  },
  "toggledBy": "65admin123...",
  "createdAt": "2026-01-19T11:00:00Z",
  "updatedAt": "2026-01-19T11:00:00Z"
}
```

### GET /api/event-requests/:eventId/enabled-features
**Access:** Authenticated Users  
**Description:** Get only enabled features (filtered)

**Request:**
```bash
curl http://localhost:5000/api/event-requests/65def789.../enabled-features \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "eventId": "65def789...",
  "enabledFeatures": {
    "ticketing": {
      "enabled": true,
      "description": "Allow ticket sales and management"
    },
    "qrCheckIn": {
      "enabled": true,
      "description": "QR code generation for check-in"
    },
    "analytics": {
      "enabled": true,
      "description": "Event analytics and reporting"
    }
    // Only enabled features included
  }
}
```

### PUT /api/event-requests/:eventId/features
**Access:** Super Admin Only  
**Description:** Update feature toggles for an event

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/event-requests/65def789.../features', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    features: {
      ticketing: { enabled: true, description: "Ticketing enabled" },
      qrCheckIn: { enabled: true, description: "QR Check-in enabled" },
      scannerApp: { enabled: false, description: "Scanner app disabled" },
      analytics: { enabled: true, description: "Analytics enabled" },
      emailSms: { enabled: true, description: "Email/SMS enabled" },
      payments: { enabled: true, description: "Payments enabled" },
      weatherAlerts: { enabled: false, description: "Weather alerts disabled" },
      subAdmins: { enabled: true, description: "Sub-admins enabled" },
      reports: { enabled: true, description: "Reports enabled" }
    }
  })
})
```

**Response:**
```json
{
  "message": "Features updated successfully",
  "featureToggle": {
    "_id": "65def890...",
    "eventId": "65def789...",
    "features": { /* updated features */ },
    "toggledBy": "65admin123...",
    "updatedAt": "2026-01-19T12:00:00Z"
  }
}
```

---

## 4️⃣ Using Feature Middleware

### Example: Protecting Analytics Route

**Backend Route Definition:**
```javascript
import { checkFeature } from '../middleware/featureMiddleware.js'

router.get('/events/:eventId/analytics',
  protect,                    // Authenticate user
  checkFeature('analytics'),  // Check analytics feature
  async (req, res) => {
    // This code only runs if analytics is enabled
    res.json({ analytics: 'data' })
  }
)
```

**If Feature is Disabled:**
```json
{
  "message": "The feature 'analytics' is not enabled for this event. Please upgrade your plan or contact support.",
  "feature": "analytics",
  "access": false
}
```

**Status Code:** 403 Forbidden

### Example: Checking Multiple Features

**Backend Route:**
```javascript
import { checkAllFeatures } from '../middleware/featureMiddleware.js'

router.post('/events/:eventId/send-notification',
  protect,
  checkAllFeatures(['emailSms', 'qrCheckIn']),
  sendNotificationController
)
```

---

## 5️⃣ Frontend Integration Examples

### Fetch Plans and Create Request

```javascript
import { useState, useEffect } from 'react'
import api from './services/api'

function CreateEventForm() {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans')
      setPlans(response.data.plans)
      setSelectedPlan(response.data.plans[1]) // Default to Standard
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const response = await api.post('/event-requests/create-request', {
        ...formData,
        planSelected: selectedPlan.name,
        billingCycle: 'monthly'
      })
      
      if (response.data.success) {
        alert('Request submitted!')
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error')
    }
  }

  return (
    <div>
      {/* Plan selector */}
      {plans.map(plan => (
        <div 
          key={plan._id}
          onClick={() => setSelectedPlan(plan)}
          className={selectedPlan?._id === plan._id ? 'selected' : ''}
        >
          <h3>{plan.displayName}</h3>
          <p>${plan.price.monthly}/month</p>
        </div>
      ))}
      
      {/* Event form */}
      {/* ... */}
    </div>
  )
}
```

### Check Feature Access in Component

```javascript
import { useState, useEffect } from 'react'
import api from './services/api'

function AnalyticsPage({ eventId }) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [eventId])

  const checkAccess = async () => {
    try {
      const response = await api.get(`/event-requests/${eventId}/enabled-features`)
      setHasAccess(response.data.enabledFeatures.analytics === true)
    } catch (error) {
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  
  if (!hasAccess) {
    return (
      <div>
        <h2>Feature Not Available</h2>
        <p>Analytics is not enabled for this event.</p>
        <button>Upgrade Plan</button>
      </div>
    )
  }

  return <div>{/* Analytics content */}</div>
}
```

---

## 🔐 Error Responses

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "You do not have permission to access this resource",
  "access": false
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid subscription plan: InvalidPlan"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error processing request",
  "error": "Detailed error message"
}
```

---

## 📊 Complete Flow Example

```javascript
// 1. User views plans
const plansResponse = await api.get('/subscriptions/plans')
const plans = plansResponse.data.plans

// 2. User selects "Professional" and creates request
const createResponse = await api.post('/event-requests/create-request', {
  title: 'My Event',
  planSelected: 'Professional',
  // ... other fields
})
const requestId = createResponse.data.eventRequest._id

// 3. Super Admin views pending requests
const pendingResponse = await api.get('/event-requests/pending')
const pendingRequests = pendingResponse.data.requests

// 4. Super Admin approves with overrides
const approveResponse = await api.post(`/event-requests/${requestId}/approve`, {
  featureOverrides: {
    ticketing: true,
    qrCheckIn: true,
    scannerApp: true,
    analytics: true,
    emailSms: true,
    payments: true,
    weatherAlerts: true, // Override to enable
    subAdmins: false,    // Override to disable
    reports: true
  }
})
const eventId = approveResponse.data.event._id

// 5. Event Admin checks enabled features
const featuresResponse = await api.get(`/event-requests/${eventId}/enabled-features`)
const enabledFeatures = featuresResponse.data.enabledFeatures

// 6. Event Admin uses a feature
if (enabledFeatures.analytics) {
  const analyticsResponse = await api.get(`/events/${eventId}/analytics`)
  // Success!
}
```

---

## 🧪 Testing with cURL

```bash
# Get all plans
curl http://localhost:5000/api/subscriptions/plans

# Create event request (need auth token)
curl -X POST http://localhost:5000/api/event-requests/create-request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "Test description",
    "category": "Conference",
    "date": "2026-06-15T09:00:00Z",
    "location": "Test Location",
    "totalTickets": 100,
    "availableTickets": 100,
    "planSelected": "Standard",
    "billingCycle": "monthly"
  }'

# Get pending requests (super admin)
curl http://localhost:5000/api/event-requests/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Approve request
curl -X POST http://localhost:5000/api/event-requests/REQUEST_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminNotes": "Approved"}'

# Check enabled features
curl http://localhost:5000/api/event-requests/EVENT_ID/enabled-features \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Last Updated:** January 2026  
**API Version:** 1.0

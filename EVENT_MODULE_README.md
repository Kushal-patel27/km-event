# 🎉 Create Your Own Event - Subscription-Based Event Management Module

> **A complete MERN stack SaaS solution with subscription plans and feature-based access control**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()
[![Version](https://img.shields.io/badge/version-1.0-green.svg)]()
[![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## 🎯 Overview

This module provides a complete **subscription-based event creation and management system** where:

1. **Event Organizers** select a subscription plan and submit event requests
2. **System** auto-assigns features based on the selected plan
3. **Super Admins** review, approve/reject requests, and override features
4. **Event Admins** get access ONLY to enabled features for their events

### Key Capabilities

✅ **4 Subscription Tiers** - Basic, Standard, Professional, Enterprise  
✅ **9 Toggleable Features** - Ticketing, QR Check-in, Scanner, Analytics, Email/SMS, Payments, Weather, Sub-admins, Reports  
✅ **Feature-Based Access Control** - Middleware enforces permissions  
✅ **Role-Based Authorization** - Super Admin, Event Admin, User roles  
✅ **Approval Workflow** - Review and override features before activation  
✅ **Email Notifications** - Automated approval/rejection emails  
✅ **Production Ready** - Complete error handling, validation, security  

---

## ✨ Features

### **For Event Organizers**
- 📝 Submit event requests with comprehensive details
- 💰 Choose from 4 subscription plans
- 🎯 See feature preview based on selected plan
- 📧 Receive email notifications on approval/rejection
- 🎫 Add multiple ticket types with custom pricing
- 📊 Track request status in real-time

### **For Super Admins**
- 📋 View all event requests with status filters
- ✅ Approve/reject requests with custom reasons
- 🎛️ Override plan features (enable/disable individually)
- 📝 Add internal admin notes
- 📧 Automated email notifications sent on actions
- 📈 Full visibility into all submissions

### **For Event Admins**
- 🎯 Access only assigned events
- 🔐 See only enabled features
- 🚫 Automatic blocking of disabled features
- 📊 Feature-specific dashboards
- 👥 Manage event based on plan capabilities
- ⚡ Seamless user experience

---

## 🏗️ Architecture

### **System Components**

```
Frontend (React)
    ↓
API Layer (Express.js)
    ↓
Controllers & Middleware
    ↓
MongoDB Database
```

### **Data Models**

1. **SubscriptionPlan** - Plans with feature configurations
2. **EventRequest** - Pending/approved/rejected requests
3. **Event** - Active events
4. **FeatureToggle** - Per-event feature enablement
5. **User** - Role-based user accounts

### **Security Layers**

1. JWT Authentication
2. Role-Based Access Control
3. Event Ownership Verification
4. Feature-Based Permissions
5. Input Validation

**[View Complete Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)**

---

## 🚀 Installation

### **Prerequisites**

- Node.js v16+ 
- MongoDB v4.4+
- npm or yarn

### **Backend Setup**

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your MongoDB URI, JWT secret, etc.

# Seed subscription plans
npm run seed:plans

# Start development server
npm run dev
```

### **Frontend Setup**

```bash
# Navigate to frontend directory
cd Frontend-EZ

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

---

## ⚡ Quick Start

### **1. Seed Database**

```bash
cd server
npm run seed:plans
```

**Expected Output:**
```
✓ 4 subscription plans created successfully
- Basic Plan (Basic): $0/month
- Standard Plan (Standard): $29/month
- Professional Plan (Professional): $79/month
- Enterprise Plan (Enterprise): $199/month
```

### **2. Start Services**

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd Frontend-EZ
npm run dev
```

### **3. Test the Flow**

1. **Create Event Request**
   - Navigate to: `http://localhost:5173/create-event-request`
   - Select a plan (e.g., "Professional")
   - Fill event details
   - Submit

2. **Review as Super Admin**
   - Login as super_admin
   - Navigate to: `http://localhost:5173/super-admin/event-requests`
   - Click "Approve" on pending request
   - Toggle features as needed
   - Confirm approval

3. **Access as Event Admin**
   - Login as the organizer
   - Navigate to: `http://localhost:5173/event-admin/dashboard`
   - See only enabled features
   - Click on enabled feature to access

---

## 📚 Documentation

### **Comprehensive Guides**

1. **[Complete Documentation](./CREATE_EVENT_MODULE_DOCUMENTATION.md)** (15,000+ words)
   - Full architecture overview
   - Schema references
   - Security guidelines
   - Troubleshooting guide

2. **[Quick Start Guide](./QUICK_START_IMPLEMENTATION.md)** (3,000+ words)
   - Step-by-step integration
   - Testing checklist
   - Common issues & solutions

3. **[API Examples](./API_EXAMPLES.md)** (4,000+ words)
   - Complete API reference
   - Request/response examples
   - cURL commands
   - Frontend integration

4. **[Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)**
   - Visual system architecture
   - Data flow diagrams
   - Component hierarchy

5. **[Module Summary](./MODULE_SUMMARY.md)**
   - Quick reference
   - Statistics
   - File inventory

---

## 🔌 API Reference

### **Base URL**
```
http://localhost:5000/api
```

### **Key Endpoints**

#### **Subscription Plans**
```http
GET    /subscriptions/plans              # Get all plans
GET    /subscriptions/plans/compare      # Compare plans
GET    /subscriptions/plans/:id          # Get plan by ID
POST   /subscriptions/plans              # Create plan [Admin]
PUT    /subscriptions/plans/:id          # Update plan [Admin]
DELETE /subscriptions/plans/:id          # Delete plan [Admin]
```

#### **Event Requests**
```http
POST   /event-requests/create-request    # Submit request [Auth]
GET    /event-requests/my-requests       # Get own requests [Auth]
GET    /event-requests/pending           # Get pending [Admin]
GET    /event-requests/all?status=X      # Filter by status [Admin]
POST   /event-requests/:id/approve       # Approve [Admin]
POST   /event-requests/:id/reject        # Reject [Admin]
```

#### **Features**
```http
GET    /event-requests/:eventId/features          # Get all features [Auth]
PUT    /event-requests/:eventId/features          # Update features [Admin]
GET    /event-requests/:eventId/enabled-features  # Get enabled only [Auth]
```

**[View Complete API Documentation](./API_EXAMPLES.md)**

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js v16+
- **Framework:** Express.js v5
- **Database:** MongoDB v4.4+
- **ODM:** Mongoose v9
- **Authentication:** JWT (jsonwebtoken)
- **Email:** Nodemailer
- **Security:** bcryptjs, express-rate-limit

### **Frontend**
- **Library:** React v18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** TailwindCSS
- **Animations:** Framer Motion (optional)

### **Development Tools**
- **Linting:** ESLint
- **Formatting:** Prettier
- **Version Control:** Git

---

## 📊 Subscription Plans

| Plan | Price | Tickets | Key Features |
|------|-------|---------|--------------|
| **Basic** | $0/mo | 100 | Ticketing, Payments (5% fee) |
| **Standard** | $29/mo | 500 | + QR Check-in, Analytics, Reports |
| **Professional** | $79/mo | 2,000 | + Scanner App, Email/SMS, Sub-admins |
| **Enterprise** | $199/mo | Unlimited | All features + Weather Alerts |

### **Features Breakdown**

1. 🎫 **Ticketing** - Sell and manage tickets
2. 📱 **QR Check-in** - QR code generation for attendees
3. 📸 **Scanner App** - Mobile scanner for entry verification
4. 📊 **Analytics** - Real-time event insights
5. 📧 **Email/SMS** - Automated notifications
6. 💳 **Payments** - Secure payment processing
7. ⛅ **Weather Alerts** - Weather-based notifications
8. 👥 **Sub-admins** - Assign additional administrators
9. 📈 **Reports** - Comprehensive event reports

---

## 🔐 Security

### **Authentication**
- JWT-based token authentication
- Secure password hashing (bcryptjs)
- Token expiration and refresh
- Session management

### **Authorization**
- **Role-Based:** super_admin, event_admin, user
- **Feature-Based:** Per-event feature toggles
- **Ownership:** Event assignment verification

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention (Mongoose)
- XSS protection
- CORS configuration
- Rate limiting

---

## 🧪 Testing

### **Backend Tests**

```bash
cd server

# Test subscription plans endpoint
curl http://localhost:5000/api/subscriptions/plans

# Test create event request (with auth)
curl -X POST http://localhost:5000/api/event-requests/create-request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-event.json
```

### **Frontend Tests**

```bash
cd Frontend-EZ

# Run tests (if configured)
npm test

# Build for production
npm run build
```

### **Manual Testing Checklist**

- [ ] Plans display correctly
- [ ] Can create event request
- [ ] Request appears in admin dashboard
- [ ] Can approve with default features
- [ ] Can override features during approval
- [ ] Can reject with reason
- [ ] Event Admin sees only enabled features
- [ ] Feature middleware blocks disabled features
- [ ] Super admin bypasses all checks
- [ ] Emails send correctly

---

## 📈 Performance

### **Optimizations Included**
- Efficient MongoDB queries with indexing
- Population strategies for related data
- Conditional rendering in frontend
- Lazy loading of components
- API response caching (recommended)

### **Scalability**
- Horizontal scaling ready
- Stateless API design
- Database indexing
- Load balancer compatible

---

## 🚢 Deployment

### **Production Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set secure JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure email service
- [ ] Set up error logging
- [ ] Enable rate limiting
- [ ] Configure CORS for production domain
- [ ] Run database migrations
- [ ] Seed subscription plans
- [ ] Set up monitoring
- [ ] Configure backups

### **Environment Variables**

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## 📝 Usage Examples

### **Create Event Request**

```javascript
const response = await api.post('/event-requests/create-request', {
  title: 'Tech Conference 2026',
  description: 'Annual tech conference',
  category: 'Conference',
  date: '2026-06-15T09:00:00Z',
  location: 'San Francisco, CA',
  totalTickets: 500,
  availableTickets: 500,
  price: 99,
  planSelected: 'Professional',
  billingCycle: 'monthly'
})
```

### **Approve with Feature Override**

```javascript
const response = await api.post(`/event-requests/${requestId}/approve`, {
  featureOverrides: {
    ticketing: true,
    qrCheckIn: true,
    scannerApp: true,
    analytics: true,
    emailSms: true,
    payments: true,
    weatherAlerts: true,  // Override: enable extra feature
    subAdmins: false,     // Override: disable included feature
    reports: true
  },
  adminNotes: 'Approved with custom features'
})
```

### **Check Feature Access**

```javascript
const response = await api.get(`/event-requests/${eventId}/enabled-features`)
const { enabledFeatures } = response.data

if (enabledFeatures.analytics) {
  // User has access to analytics
}
```

---

## 🤝 Contributing

This is a proprietary module. For feature requests or bug reports, please contact the development team.

---

## 📞 Support

### **Documentation**
- [Complete Documentation](./CREATE_EVENT_MODULE_DOCUMENTATION.md)
- [Quick Start Guide](./QUICK_START_IMPLEMENTATION.md)
- [API Examples](./API_EXAMPLES.md)

### **Common Issues**
Refer to the troubleshooting section in the [Complete Documentation](./CREATE_EVENT_MODULE_DOCUMENTATION.md#troubleshooting).

---

## 📜 License

Proprietary - © 2026. All rights reserved.

---

## 👨‍💻 Author

**Senior MERN Stack SaaS Architect**  
Specialized in subscription-based event management systems

---

## 📅 Version History

- **v1.0** (January 19, 2026)
  - Initial production release
  - 4 subscription plans
  - 9 toggleable features
  - Complete approval workflow
  - Feature-based access control
  - Super admin dashboard
  - Event admin dashboard with guards
  - Email notifications
  - Comprehensive documentation

---

## 🎯 Quick Links

- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)
- [API Examples](./API_EXAMPLES.md)
- [Module Summary](./MODULE_SUMMARY.md)
- [Quick Start](./QUICK_START_IMPLEMENTATION.md)
- [Full Documentation](./CREATE_EVENT_MODULE_DOCUMENTATION.md)

---

## 🌟 Features at a Glance

| Feature | Basic | Standard | Professional | Enterprise |
|---------|:-----:|:--------:|:------------:|:----------:|
| Ticketing | ✅ (100) | ✅ (500) | ✅ (2K) | ✅ (∞) |
| QR Check-in | ❌ | ✅ | ✅ | ✅ |
| Scanner App | ❌ | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Email/SMS | ❌ | ❌ | ✅ | ✅ |
| Payments | ✅ (5%) | ✅ (3.5%) | ✅ (2.5%) | ✅ (1.9%) |
| Weather Alerts | ❌ | ❌ | ❌ | ✅ |
| Sub-admins | ❌ | ❌ | ✅ (5) | ✅ (∞) |
| Reports | ❌ | ✅ Basic | ✅ Advanced | ✅ Custom |

---

**Built with ❤️ using MERN Stack**

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** January 19, 2026

# System-Wide Connectivity - Complete Implementation

## ✅ Full Stack Integration Status

All admin roles are now **fully connected** from frontend → backend → database.

---

## 🔌 Database Connectivity

### MongoDB Connection
- **File**: `server/config/db.js`
- **Connection String**: `process.env.MONGO_URI`
- **Status**: ✅ Connected via Mongoose

### Models (Database Schemas)
```javascript
✅ User.js      - All roles: user, staff, admin, event_admin, staff_admin, super_admin
✅ Event.js     - Events with ticket types
✅ Booking.js   - Bookings with ticket type selection
✅ EntryLog.js  - Scanner entry tracking
✅ Contact.js   - Contact form submissions
✅ About.js     - About page content
```

---

## 🎯 Authentication Endpoints (All Roles)

### User Login
```
POST /api/auth/register
POST /api/auth/login
```

### Admin Login (admin, event_admin, staff_admin, super_admin)
```
POST /api/auth/admin/login
```
**Used by:**
- Super Admin → `/super-admin/login`
- Admin → `/admin/login`
- Event Admin → `/event-admin/login`
- Staff Admin → `/staff-admin/login`

### Staff (Scanner) Login
```
POST /api/auth/staff/login  ✨ NEW
```
**Used by:**
- Staff (Scanner) → `/staff/login`

### Common Auth Endpoints
```
GET  /api/auth/me              - Get current user
POST /api/auth/refresh         - Refresh token
POST /api/auth/logout          - Logout
POST /api/auth/logout-all      - Logout all sessions
PUT  /api/auth/profile         - Update profile
PUT  /api/auth/password        - Change password
GET  /api/auth/preferences     - Get user preferences
PUT  /api/auth/preferences     - Update preferences
```

---

## 🔐 Role-Based Access Control

### Middleware Functions
```javascript
// authMiddleware.js
✅ protect              - Verify JWT token
✅ requireRoles(...roles) - Check specific role(s)
✅ requireAdminRole     - Verify user is in ADMIN_ROLES
✅ requireSuperAdmin    - Verify super_admin role
```

### Admin Roles Array
```javascript
const ADMIN_ROLES = ["super_admin", "event_admin", "staff_admin", "admin"];
// Note: "staff" is NOT in this array (non-admin role)
```

---

## 📡 API Endpoints by Role

### 1️⃣ Super Admin (System Owner)
**Login**: `POST /api/auth/admin/login`  
**Frontend Route**: `/super-admin/*`

**API Endpoints** (`/api/super-admin/*`):
```
GET  /users                      - List all users (paginated)
POST /users                      - Create new user
GET  /users/:userId              - Get user details
PUT  /users/:userId              - Update user
DELETE /users/:userId            - Delete user
POST /users/:userId/disable      - Disable user
POST /users/:userId/reactivate   - Reactivate user
PUT  /users/:userId/role         - Assign role

GET  /roles                      - List all available roles

POST   /staff                    - Create global staff ✨
GET    /staff                    - List all staff (paginated) ✨
PUT    /staff/:staffId           - Update staff ✨
DELETE /staff/:staffId           - Deactivate staff ✨

GET  /events                     - List all events
GET  /events/:eventId            - Get event details
PUT  /events/:eventId            - Update event
DELETE /events/:eventId          - Delete event

GET  /bookings                   - List all bookings
PUT  /bookings/:bookingId/status - Update booking status
POST /bookings/:bookingId/refund - Refund booking

GET  /analytics/platform         - Platform analytics
GET  /config                     - Get system config
PUT  /config                     - Update system config
GET  /logs                       - Get system logs
GET  /export                     - Export platform data
```

---

### 2️⃣ Admin (Platform Operations)
**Login**: `POST /api/auth/admin/login`  
**Frontend Route**: `/admin/*`

**API Endpoints** (`/api/admin/*`):
```
GET  /dashboard                  - Dashboard stats
GET  /events                     - List events
POST /events                     - Create event
PUT  /events/:id                 - Update event
DELETE /events/:id               - Delete event

GET  /bookings                   - List bookings
PUT  /bookings/:id               - Update booking

GET  /contacts                   - List contacts
GET  /team                       - Team info
```

---

### 3️⃣ Event Admin (Event Owner)
**Login**: `POST /api/auth/admin/login`  
**Frontend Route**: `/event-admin/*`

**API Endpoints** (`/api/event-admin/*`):
```
GET  /dashboard                  - Event admin dashboard
GET  /events                     - List assigned events
POST /events                     - Create new event
PUT  /events/:id                 - Update event
DELETE /events/:id               - Delete event

GET  /bookings                   - List bookings for events
GET  /bookings/:id               - Get booking details
```

---

### 4️⃣ Staff Admin (Gate/Team Manager) 🎯
**Login**: `POST /api/auth/admin/login`  
**Frontend Route**: `/staff-admin/*`

**API Endpoints** (`/api/staff-admin/*`):
```
POST   /staff                    - Create scanner staff
GET    /staff                    - List staff members
PUT    /staff/:staffId           - Update staff
DELETE /staff/:staffId           - Deactivate staff

GET  /events/:eventId/entries    - Get entry logs
PUT  /entries/:logId/approve     - Approve manual entry

GET  /dashboard                  - Staff admin dashboard
```

---

### 5️⃣ Staff (Scanner Only) 🎫📱
**Login**: `POST /api/auth/staff/login` ✨  
**Frontend Route**: `/staff/*`

**API Endpoints** (`/api/scanner/*`):
```
POST /scan                       - Scan ticket (QR or booking ID)
GET  /ticket/:bookingId/status   - Check ticket status
POST /manual-entry               - Request manual entry
GET  /events/:eventId/stats      - Get gate statistics
GET  /info                       - Get assigned events/gates
```

---

## 🎨 Frontend Pages & Routes

### Super Admin
```
/super-admin/login               → SuperAdminLogin.jsx
/super-admin                     → SuperAdminDashboard.jsx
/super-admin/users               → SuperAdminUsers.jsx
/super-admin/staff               → SuperAdminStaff.jsx ✨
/super-admin/events              → SuperAdminEvents.jsx
/super-admin/bookings            → SuperAdminBookings.jsx
/super-admin/logs                → SuperAdminLogs.jsx
/super-admin/config              → SuperAdminConfig.jsx
/super-admin/export              → SuperAdminExport.jsx
```

### Admin
```
/admin/login                     → AdminLogin.jsx
/admin                           → AdminDashboard.jsx
/admin/events                    → AdminEvents.jsx
/admin/bookings                  → AdminBookings.jsx
/admin/team                      → AdminTeam.jsx
```

### Event Admin
```
/event-admin/login               → EventAdminLogin.jsx
/event-admin                     → EventAdminDashboard.jsx
/event-admin/events              → EventAdminEvents.jsx
/event-admin/bookings            → EventAdminBookings.jsx
```

### Staff Admin (Gate/Team Manager)
```
/staff-admin/login               → StaffAdminLogin.jsx ✨
/staff-admin                     → StaffAdminDashboard.jsx
```

### Staff (Scanner Only)
```
/staff/login                     → StaffLogin.jsx (updated) ✨
/staff/scanner                   → ScannerScreen.jsx
```

---

## 🔄 Data Flow Examples

### Example 1: Super Admin Creates Staff
```
1. User logs in at /super-admin/login
   → POST /api/auth/admin/login { email, password }
   ← { _id, name, email, role: "super_admin", token }

2. Frontend saves token to localStorage + AuthContext
   → axios.defaults.headers.Authorization = "Bearer <token>"

3. User navigates to /super-admin/staff (SuperAdminStaff.jsx)
   → Component loads, calls fetchStaff()
   → GET /api/super-admin/staff?page=1&limit=10
   ← { staff: [...], pagination: {...} }

4. User fills form and clicks "Create"
   → POST /api/super-admin/staff { name, email, eventIds, gates }
   ← { success: true, staff: {...} }

5. Backend (superAdminController.createGlobalStaff)
   → Checks if user exists
   → Creates User with role="staff"
   → Saves to MongoDB via User.create()
   ← Returns success response

6. Frontend refreshes staff list
   → GET /api/super-admin/staff
   → Updates UI with new staff member
```

### Example 2: Staff Scans Ticket
```
1. Staff logs in at /staff/login
   → POST /api/auth/staff/login { email, password }
   ← { _id, name, email, role: "staff", assignedEvents, assignedGates, token }

2. Staff navigates to /staff/scanner
   → ScannerScreen.jsx loads
   → GET /api/scanner/info
   ← { staff: { assignedEvents, assignedGates } }

3. Staff enters booking ID and clicks Scan
   → POST /api/scanner/scan { bookingId, gate }
   ← { booking: {...}, entryLog: {...} }

4. Backend (staffController.scanTicket)
   → Validates booking exists
   → Checks if already scanned
   → Creates EntryLog record
   → Updates Booking.status = "used"
   → Saves to MongoDB
   ← Returns booking details

5. Frontend shows success message
   → Green card with booking info
   → Refreshes gate stats
```

---

## 🗄️ Database Operations

### Create/Update
```javascript
// Super Admin creates staff
await User.create({
  name, email,
  role: "staff",
  assignedEvents: [eventId1, eventId2],
  assignedGates: ["Gate A", "Gate B"],
  assignedBy: superAdminId
});

// Scanner scans ticket
await EntryLog.create({
  event: eventId,
  booking: bookingId,
  staff: staffId,
  gate: "Gate A",
  scanMethod: "booking_id",
  ticketStatus: "valid"
});

await Booking.findByIdAndUpdate(bookingId, {
  status: "used",
  scannedAt: new Date()
});
```

### Query/Read
```javascript
// Get all staff
const staff = await User.find({ role: "staff" })
  .populate("assignedEvents", "title")
  .sort({ createdAt: -1 });

// Get entry logs for event
const logs = await EntryLog.find({ event: eventId })
  .populate("booking")
  .populate("staff", "name email")
  .sort({ scannedAt: -1 });
```

---

## ⚡ Frontend → Backend Integration

### API Service (`services/api.jsx`)
```javascript
import axios from "axios";

const API = axios.create({
  baseURL: `${BASE}/api`,  // http://localhost:5000/api
  withCredentials: true,
});

// Auto-attach token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh, else logout
    }
    return Promise.reject(error);
  }
);
```

### Usage in Components
```javascript
// SuperAdminStaff.jsx
const fetchStaff = async () => {
  const res = await API.get('/super-admin/staff?page=1');
  setStaff(res.data.staff);
};

const createStaff = async (formData) => {
  await API.post('/super-admin/staff', formData);
};
```

---

## 🔒 Security & Validation

### Backend Protection
```javascript
// All admin routes protected
router.use(protect);                      // Verify JWT
router.use(requireRoles("super_admin"));  // Check role

// Staff routes
router.use(protect);
router.use(requireRoles("staff"));

// Dynamic role check
router.put("/staff/:id", protect, requireAdminRole, updateStaff);
```

### Frontend Protection
```javascript
// ProtectedSuperAdminRoute.jsx
const ProtectedSuperAdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/super-admin/login" />;
  if (user.role !== "super_admin") return <Navigate to="/" />;
  
  return children;
};
```

---

## 🧪 Testing Connectivity

### 1. Test Super Admin Flow
```bash
# Login
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"admin123"}'

# Create Staff
curl -X POST http://localhost:5000/api/super-admin/staff \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Scanner","email":"john@test.com","gates":["Gate A"]}'
```

### 2. Test Staff Login
```bash
# Staff Login
curl -X POST http://localhost:5000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"password123"}'
```

### 3. Test Scanner
```bash
# Scan Ticket
curl -X POST http://localhost:5000/api/scanner/scan \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"BOOK123","gate":"Gate A"}'
```

---

## ✅ Connectivity Checklist

- [x] MongoDB connected via `connectDB()`
- [x] All models exported and used in controllers
- [x] All routes registered in `server.js`
- [x] JWT authentication working with `protect` middleware
- [x] Role-based access control via `requireRoles()`
- [x] Frontend API service configured with interceptors
- [x] All admin login pages created
- [x] All admin routes added to App.jsx
- [x] Staff (scanner) login endpoint created
- [x] Staff Admin login page created
- [x] AuthContext handles all roles
- [x] Protected routes enforce role checks
- [x] Super Admin can create staff globally
- [x] Staff Admin can create staff for events
- [x] Staff can scan tickets
- [x] Entry logs tracked in database

---

## 🚀 System is Fully Connected!

All 5 admin roles can:
1. ✅ Login via dedicated endpoints
2. ✅ Access role-specific frontend pages
3. ✅ Call protected API endpoints
4. ✅ Perform CRUD operations on database
5. ✅ Maintain proper role-based permissions

**Status**: 🟢 **FULLY OPERATIONAL**

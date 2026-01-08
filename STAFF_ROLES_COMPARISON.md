# Staff Roles Comparison - Clear Distinction

## Two Different Roles with Different Responsibilities

---

## 1️⃣ Staff Admin (Gate/Team Manager) 🎯

### Role Classification
- **Admin Role**: YES ✅ (included in ADMIN_ROLES array)
- **Level**: Mid-level management
- **Reports to**: Super Admin, Admin, Event Admin

### Responsibilities
- ✅ **Manage scanner staff** - Create, edit, deactivate staff members
- ✅ **Assign gates/zones** - Allocate staff to specific entry points
- ✅ **Approve manual entries** - Review and approve entry requests
- ✅ **View entry logs** - Monitor all scan activities
- ✅ **Dashboard access** - View stats for events, staff, scans

### Permissions
```javascript
permissions: [
  "manage_staff",
  "approve_entries", 
  "view_entry_logs",
  "assign_gates"
]
```

### API Access
```
✅ /api/staff-admin/*  (Full access to staff management)
✅ /api/scanner/*       (Can also scan if needed)
```

### Use Case Example
**Sarah (Staff Admin)** manages entry operations for a concert venue:
- Creates 10 scanner staff members
- Assigns 3 staff to Gate A, 4 to Gate B, 3 to VIP entrance
- Reviews manual entry requests when QR codes fail
- Views real-time dashboard showing scan counts by gate
- Approves/denies manual entry requests

---

## 2️⃣ Staff (Scanner Only) 🎫📱

### Role Classification
- **Admin Role**: NO ❌ (NOT in ADMIN_ROLES array)
- **Level**: Lowest operational role
- **Reports to**: Staff Admin, Super Admin

### Responsibilities
- ✅ **Scan tickets only** - QR codes or booking IDs
- ✅ **Check ticket status** - Validate if ticket is valid/used/cancelled
- ✅ **Request manual entry** - Ask for approval when needed
- ❌ **Cannot manage other users**
- ❌ **Cannot approve entries**
- ❌ **Cannot view logs**

### Permissions
```javascript
permissions: [
  "scan_tickets",
  "view_ticket_status",
  "request_manual_entry"
]
```

### API Access
```
✅ /api/scanner/*       (Scanner operations only)
❌ /api/staff-admin/*   (NO access - forbidden)
```

### Use Case Example
**Mike (Scanner Staff)** works at Gate A:
- Opens scanner app on tablet
- Scans attendee QR codes
- Sees "Valid Entry" or "Already Used" messages
- If QR doesn't work, requests manual entry from Staff Admin
- Can only see stats for Gate A (his assigned gate)
- Cannot create other staff or approve entries

---

## Key Differences Summary

| Feature | Staff Admin 🎯 | Staff (Scanner) 🎫📱 |
|---------|---------------|---------------------|
| **Is Admin?** | ✅ YES | ❌ NO |
| **Create Staff** | ✅ YES | ❌ NO |
| **Scan Tickets** | ✅ YES | ✅ YES |
| **Approve Entries** | ✅ YES | ❌ NO |
| **View All Logs** | ✅ YES | ❌ NO |
| **Assign Gates** | ✅ YES | ❌ NO |
| **Dashboard** | ✅ Full Stats | ⚠️ Limited (own gate) |
| **Manage Events** | ⚠️ Assigned events | ❌ NO |
| **API Routes** | `/staff-admin/*` + `/scanner/*` | `/scanner/*` only |

---

## Role Hierarchy Visualization

```
┌─────────────────────────────────────────┐
│  SUPER ADMIN (System Owner) 🔑          │
│  - Can create both Staff Admin & Staff │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────────┐  ┌──────────────────┐
│ ADMIN  │  │EVENT ADMIN │  │ STAFF ADMIN 🎯   │
│        │  │            │  │ (Gate/Team Mgr)  │
└────────┘  └────────────┘  └────────┬─────────┘
                                     │
                                     │ creates/manages
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │ STAFF 🎫📱          │
                            │ (Scanner Only)      │
                            │ Entry Execution     │
                            └─────────────────────┘
```

---

## Database Schema

### User Model
```javascript
{
  role: {
    type: String,
    enum: ["user", "staff", ...ADMIN_ROLES],
    // "staff" = Scanner Only
    // "staff_admin" = Gate/Team Manager (in ADMIN_ROLES)
  },
  assignedEvents: [ObjectId],  // Events they can work on
  assignedGates: [String],     // Gates/zones they can access
  assignedBy: ObjectId,        // Who created them (Staff Admin or Super Admin)
}
```

### ADMIN_ROLES Constant
```javascript
const ADMIN_ROLES = ["super_admin", "event_admin", "staff_admin", "admin"];
// Notice: "staff" is NOT in this array (not an admin)
```

---

## Implementation Files

### Staff Admin (Gate/Team Manager)
- **Controller**: `server/controllers/staffAdminController.js`
- **Routes**: `server/routes/staffAdminRoutes.js`
- **Middleware**: `requireRoles("staff_admin")`
- **Layout**: `Frontend-EZ/src/components/StaffAdminLayout.jsx`
- **Dashboard**: `Frontend-EZ/src/pages/StaffAdminDashboard.jsx`

### Staff (Scanner Only)
- **Controller**: `server/controllers/staffController.js`
- **Routes**: `server/routes/scannerRoutes.js`
- **Middleware**: `requireRoles("staff")`
- **Scanner UI**: `Frontend-EZ/src/pages/ScannerScreen.jsx`
- **No admin layout** - Simple fullscreen scanner interface

---

## Who Can Create Each Role?

### Create Staff Admin (Gate/Team Manager)
- ✅ **Super Admin** → Can create Staff Admin globally
- ✅ **Admin** → Can create Staff Admin for platform
- ⚠️ **Event Admin** → Can create Staff Admin for their events only
- ❌ **Staff Admin** → Cannot create other Staff Admins
- ❌ **Staff** → Cannot create anyone

### Create Staff (Scanner Only)
- ✅ **Super Admin** → Can create Staff globally (`/api/super-admin/staff`)
- ✅ **Staff Admin** → Can create Staff for their events (`/api/staff-admin/staff`)
- ❌ **Event Admin** → Cannot directly create Staff (must go through Staff Admin)
- ❌ **Staff** → Cannot create anyone

---

## Real-World Workflow Example

### Concert Event Entry Management

**Setup by Super Admin:**
1. Super Admin creates "Sarah" as **Staff Admin**
2. Super Admin assigns Sarah to "Rock Concert 2026" event
3. Sarah can now manage entry operations for this event

**Sarah's Work (Staff Admin):**
1. Creates 10 **Scanner Staff** members:
   - Mike, John, Emma (Gate A)
   - Lisa, Tom, Anna (Gate B)
   - Dave, Kelly, Chris, Sam (VIP Entrance)
2. Assigns gates to each staff member
3. Monitors dashboard during event
4. Approves manual entry requests when QR codes fail

**Mike's Work (Scanner Staff - Gate A):**
1. Logs in to scanner app
2. Sees only Gate A as his assigned gate
3. Scans QR codes as attendees arrive
4. App shows "Valid Entry" ✅ or "Already Used" ❌
5. If QR doesn't work, requests manual entry
6. Sarah (Staff Admin) reviews and approves/denies
7. Mike can proceed with manual entry once approved

---

## Security & Permissions

### Staff Admin (Gate/Team Manager)
```javascript
// Can access both admin and scanner routes
router.use(protect);
router.use(requireRoles("staff_admin"));
// Has admin privileges - included in ADMIN_ROLE_SET
```

### Staff (Scanner Only)
```javascript
// Can only access scanner routes
router.use(protect);
router.use(requireRoles("staff"));
// NOT an admin - excluded from ADMIN_ROLE_SET
// Lowest permission level - entry operations only
```

---

## Summary

✅ **Staff Admin** = Manager who creates and manages scanner staff  
✅ **Staff** = Operational scanner who only scans tickets  
✅ **Clearly separated** with different permissions, routes, and responsibilities  
✅ **Staff Admin is an admin role**, Staff is NOT an admin role  
✅ **Both are essential** for event entry management but serve different purposes


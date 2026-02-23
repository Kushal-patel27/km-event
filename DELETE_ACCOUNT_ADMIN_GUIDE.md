# Delete Account Request Management - Admin Guide

## Where to View Delete Account Requests

The KM Events platform now provides dedicated admin panels for managing user account deletion requests.

---

## 📍 Access Points

### 1. **Dedicated Deletion Requests Dashboard** (New!)
**URL:** `http://localhost:5173/super-admin/deletion-requests`

This is the primary dashboard for viewing all deletion requests.

**What you'll see:**
- Total count of pending deletion requests
- Number of requests on current page
- Count of "Urgent" requests (deleting within 3 days)
- Complete table with all deletion request details:
  - User name and email
  - User role
  - Request submission date
  - Scheduled deletion date and time
  - Days remaining until deletion
  - Action button to cancel requests

**Navigation:**
- Menu Item: "Deletion Requests" (🗑️ icon) in Super Admin sidebar
- Path: `/super-admin/deletion-requests`

---

### 2. **User Management Page** (Secondary View)
**URL:** `http://localhost:5173/super-admin/users`

View all users and their status. The main users table shows basic info for all users.

**What you can do:**
- Search for specific users
- Filter by role
- Filter by status (active/disabled)
- View user details when clicking on them

---

## 🔍 Getting User Deletion Details

### Method 1: Through Deletion Requests Dashboard

1. Go to `/super-admin/deletion-requests`
2. You'll see a table with columns:
   - **User**: Name and email
   - **Role**: User's role (user, event_admin, staff, etc.)
   - **Request Date**: When the user requested deletion
   - **Scheduled Deletion**: The exact date/time the account will be deleted
   - **Days Remaining**: How many days until permanent deletion
   - **Status Badge**: Color-coded by urgency:
     - 🔴 Red: 0-3 days remaining
     - 🟠 Orange: 4-7 days remaining  
     - 🟡 Yellow: 8+ days remaining

### Method 2: Check Individual User Details

1. Go to `/super-admin/users`
2. Find the user in the list
3. View their deletion status if they have a pending request

---

## 🚨 Actions You Can Take

### Cancel a Deletion Request
1. Go to `/super-admin/deletion-requests`
2. Find the user in the table
3. Click "Cancel Request" button
4. Confirm the action
5. User's account deletion will be cancelled

**What happens:**
- The deletion scheduled date is removed
- User can continue using their account
- The record is removed from the deletion requests list

---

## 📊 Understanding the Data

### Fields in Deletion Details

| Field | Meaning |
|-------|---------|
| **User Name & Email** | The account requesting deletion |
| **Role** | Their role in the system (user, admin, etc.) |
| **Request Date** | When they initiated the deletion request |
| **Scheduled Deletion** | The exact date/time account will be permanently deleted |
| **Days Remaining** | Countdown timer (max 30 days) |

### Example Display
```
Name: John Doe
Email: john@example.com
Role: User
Request Date: Feb 23, 2026
Scheduled Deletion: Mar 25, 2026 10:30 AM
Days Remaining: 30 days
```

---

## 🛠️ Backend Details (For Developers)

### API Endpoints

#### Get All Pending Deletion Requests
```http
GET /api/super-admin/users/deletion/pending?page=1&limit=20

Response:
{
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "accountSettings": {
        "deleteRequestedAt": "2026-02-23T10:00:00Z",
        "deletionScheduledAt": "2026-03-25T10:00:00Z"
      },
      "deletionDetails": {
        "requestedAt": "2026-02-23T10:00:00Z",
        "scheduledFor": "2026-03-25T10:00:00Z",
        "daysRemaining": 30
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### Cancel User Deletion Request
```http
POST /api/super-admin/users/{userId}/deletion/cancel

Response:
{
  "message": "Account deletion request cancelled successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## 🔐 Permissions Required

- **Role:** Super Admin only
- **Access:** Full access to all deletion request data
- **Actions:** Ability to cancel deletion requests

---

## 📋 Retention & Cleanup

### Timeline Explanation

1. **User Requests Deletion**: Account marked for deletion
2. **30-Day Grace Period**: User can cancel request by logging in
3. **After 30 Days**: Account is automatically and permanently deleted
4. **Data Removal**: All user data, bookings, and preferences are purged

### What Gets Deleted
- User profile
- All bookings (with refunds if applicable)
- Settings and preferences
- Activity logs related to user
- Contact submissions
- Payment history (anonymized)

---

## 📞 Support Notes

### Questions Users Might Ask

**Q: Can I recover my account after deletion?**
A: Only within the 30-day grace period. They can cancel from settings page.

**Q: What happens to my bookings?**
A: Refunds are issued automatically if applicable. Events are cancelled.

**Q: Can admins stop the deletion?**
A: Yes, use the "Cancel Request" button on this dashboard.

---

## 🎯 Key Features

✅ **Admin Dashboard**: Dedicated page for deletion requests  
✅ **Real-time Tracking**: Days remaining counter  
✅ **Urgent Alerts**: Color-coded urgency levels  
✅ **Quick Actions**: One-click cancel option  
✅ **Complete Audit**: All deletion requests logged  
✅ **Pagination**: Handle large user bases efficiently  

---

## 📝 Notes

- Deletion requests are tracked in `User.accountSettings.deletionScheduledAt`
- A background job will handle automatic deletion after 30 days (configure cron job)
- All cancellations are logged in the audit trail
- Users receive confirmation emails when deletion is scheduled/cancelled


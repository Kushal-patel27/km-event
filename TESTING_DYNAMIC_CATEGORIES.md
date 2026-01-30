# Quick Testing Guide - Dynamic Category Feature

## Prerequisites
1. Ensure server is running: `cd server && npm start`
2. Ensure frontend is running: `cd Frontend-EZ && npm run dev`
3. Database connection is active

## Test Steps

### Step 1: Initialize Default Categories
The server automatically seeds default categories on startup. Check console for:
```
Seeding default categories...
✓ Category "Music" initialized
✓ Category "Sports" initialized
...
✓ Default categories seeded successfully
```

### Step 2: Verify Categories API
Test in browser or Postman:
```bash
GET http://localhost:5000/api/categories/all
```

Expected response:
```json
[
  {
    "_id": "...",
    "name": "Music",
    "isDefault": true,
    "usageCount": 0
  },
  ...
]
```

### Step 3: Test Custom Category Creation (Frontend)

#### A. Login as Organizer
1. Navigate to `http://localhost:5173/login`
2. Login with organizer credentials

#### B. Create Event Request with Custom Category
1. Go to `http://localhost:5173/create-event`
2. Fill in event details:
   - Title: "Test Tech Meetup"
   - Description: "A test event"
   - Date: Any future date
   - Location: "Mumbai"
   
3. **Category Selection**:
   - Select "Other" from category dropdown
   - Notice the "Custom Category" field appears
   - Enter: "Tech Meetup"
   
4. Fill remaining fields:
   - Total Tickets: 100
   - Phone: Your phone number
   
5. Click "Next: Select Plan"
6. Select a plan (e.g., Standard)
7. Click "Submit Event Request"

#### C. Verify Category Creation
1. Wait for success message
2. Refresh the page
3. Check category dropdown - "Tech Meetup" should now appear!

### Step 4: Test Category Reuse
1. Create another event request
2. In category dropdown, you should see "Tech Meetup" as an option
3. Select it directly (no need to use "Other")
4. Submit the request

### Step 5: Verify in Admin Panel
1. Login as admin: `http://localhost:5173/admin/events`
2. Create or edit an event
3. Check category dropdown includes "Tech Meetup"

### Step 6: Verify in Super Admin Panel
1. Login as super admin
2. Go to events management
3. Edit an event
4. Category dropdown should include all categories including custom ones

### Step 7: Test Duplicate Prevention
1. Create another event with "Other"
2. Enter "tech meetup" (lowercase)
3. Submit request
4. Check database - should reuse existing category, not create duplicate

## Expected Behaviors

### ✅ Success Criteria
- [ ] Default categories load on server startup
- [ ] Categories API returns all active categories
- [ ] Custom category field appears when "Other" selected
- [ ] Validation error if "Other" selected but no custom name provided
- [ ] Custom category is created after event submission
- [ ] New category appears in dropdown immediately
- [ ] Case-insensitive duplicate prevention works
- [ ] Usage count increments when category is reused
- [ ] Admin panels show updated categories

### ❌ Error Cases to Test
1. **Empty Custom Category**: Select "Other" but leave custom field empty → Should show validation error
2. **Duplicate Category**: Create "Gaming" then try "gaming" → Should reuse existing
3. **Network Failure**: Disconnect internet → Should use fallback categories
4. **Invalid Characters**: Try special characters in category name → Should be trimmed/sanitized

## Database Verification

### Check Categories Collection
```javascript
// In MongoDB shell or Compass
db.categories.find().pretty()
```

Expected:
```javascript
{
  "_id": ObjectId("..."),
  "name": "Tech Meetup",
  "isDefault": false,
  "createdBy": ObjectId("user_id"),
  "usageCount": 2,
  "isActive": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### Check Event Request
```javascript
db.eventrequests.findOne({ category: "Tech Meetup" })
```

Should show event request with custom category.

## API Testing with cURL

### Get All Categories
```bash
curl http://localhost:5000/api/categories/all
```

### Create Category (Authenticated)
```bash
curl -X POST http://localhost:5000/api/categories/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Poetry Slam"}'
```

### Initialize Default Categories (Super Admin)
```bash
curl -X POST http://localhost:5000/api/categories/initialize \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### Get All Categories (Admin)
```bash
curl http://localhost:5000/api/categories/admin/all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Troubleshooting

### Categories Not Loading
1. Check browser console for errors
2. Verify API endpoint: `http://localhost:5000/api/categories/all`
3. Check if server is running
4. Verify categoryRoutes is registered in server.js

### Custom Category Not Saving
1. Check browser Network tab for API call
2. Look for errors in server console
3. Verify Category model is imported in eventRequestController
4. Check database connection

### Dropdown Not Updating
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check if API returns new category
4. Verify frontend fetchCategories is called

## Performance Testing

### Load Test
Create 100 categories and verify:
- API response time < 200ms
- Dropdown renders smoothly
- No memory leaks
- Database queries are efficient

### Stress Test
- Multiple users creating same category simultaneously
- Verify only one category is created (no race conditions)
- Check database locks are handled properly

## Security Testing

### Test Invalid Inputs
```javascript
// XSS attempt
category: "<script>alert('xss')</script>"

// SQL injection attempt (won't work with MongoDB but still test)
category: "'; DROP TABLE categories; --"

// Very long input
category: "A".repeat(10000)

// Empty/whitespace
category: "   "
```

All should be handled gracefully.

## Success Indicators

After completing all tests:
1. ✅ Server starts without errors
2. ✅ Default categories are seeded
3. ✅ Frontend loads categories dynamically
4. ✅ Custom categories can be created
5. ✅ Categories appear in all forms
6. ✅ Duplicates are prevented
7. ✅ Usage count tracks correctly
8. ✅ No console errors
9. ✅ Database has correct schema
10. ✅ All admin panels updated

## Next Steps After Testing

If all tests pass:
1. ✅ Feature is production-ready
2. Document any edge cases found
3. Consider adding rate limiting for category creation
4. Plan for category moderation if needed
5. Monitor category usage in production

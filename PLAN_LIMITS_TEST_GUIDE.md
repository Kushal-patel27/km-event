# Plan Limits - Quick Test Scenarios

## 🎯 Quick Visual Test

### Scenario 1: Create Basic Plan with 0.5GB Storage

**Steps:**
1. Go to http://localhost:5174/admin/subscription-dashboard
2. Click "Plans" tab
3. Click "Create Plan" button
4. Fill in:
   - Plan Name: `Starter`
   - Display Name: `Starter Plan`
   - Description: `Perfect for getting started`
   - Commission: `30`%
   - Monthly Fee: `0`
   - **Events per Month**: `1`
   - **Storage (GB)**: `0.5`
   - **Custom Branding**: `Disabled`
   - **Priority Support**: `Disabled`
5. Click "Create Plan"

**Expected Result:**
```
Starter Plan
Perfect for getting started

Commission    | Monthly Fee
30%           | ₹0

Event Limit   | Ticket Limit
Unlimited     | Unlimited

Events/Month  | Storage
1             | 0.5 GB

Custom Brand. | Priority Sup.
✗ Disabled    | ✗ Disabled
```

---

### Scenario 2: Create Premium Plan with 2.5GB Storage

**Steps:**
1. Click "Create Plan" again
2. Fill in:
   - Plan Name: `Premium`
   - Display Name: `Premium Plan`
   - Description: `Complete event solution`
   - Commission: `20`%
   - Monthly Fee: `999`
   - Event Limit: `10`
   - Ticket Limit: `1000`
   - **Events per Month**: `5`
   - **Storage (GB)**: `2.5`
   - **Custom Branding**: `Enabled`
   - **Priority Support**: `Enabled`
   - Check "Mark as Most Popular"
3. Click "Create Plan"

**Expected Result:**
```
Premium Plan  [Most Popular]
Complete event solution

Commission    | Monthly Fee
20%           | ₹999

Event Limit   | Ticket Limit
10            | 1000

Events/Month  | Storage
5             | 2.5 GB

Custom Brand. | Priority Sup.
✓ Enabled     | ✓ Enabled
```

---

### Scenario 3: Edit Existing Plan

**Steps:**
1. Find the "Starter" plan card
2. Click "Edit" button
3. Change:
   - **Storage (GB)**: `1.5`
   - **Custom Branding**: `Enabled`
4. Click "Update Plan"

**Expected Result:**
- Storage updates to "1.5 GB"
- Custom Branding shows "✓ Enabled"

---

## 🔍 Visual Verification Points

### In the Form (Modal):
- [ ] Storage input accepts decimals (try: 0.5, 1.5, 2.5)
- [ ] Events per Month only accepts integers (try: 1, 2, 3)
- [ ] Custom Branding dropdown has Disabled/Enabled
- [ ] Priority Support dropdown has Disabled/Enabled
- [ ] All fields pre-populate when editing

### In the Plan Card:
- [ ] Storage displays with "GB" suffix
- [ ] Custom Branding shows ✓/✗ icon
- [ ] Priority Support shows ✓/✗ icon
- [ ] Events/Month shows as integer or "Unlimited"
- [ ] All 8 fields visible in 2-column grid

### In Browser Console:
- [ ] No errors on page load
- [ ] No errors when opening form
- [ ] No errors when submitting
- [ ] No errors when editing

---

## 🧪 Edge Case Tests

### Test Decimal Validation:
1. Open Create Plan form
2. Try Storage values:
   - `0.1` ✅ Should accept
   - `0.5` ✅ Should accept
   - `1.0` ✅ Should accept
   - `2.5` ✅ Should accept
   - `10.75` ✅ Should accept

### Test Integer Validation:
1. Try Events per Month values:
   - `1` ✅ Should accept
   - `5` ✅ Should accept
   - `10` ✅ Should accept
   - Negative numbers ❌ Should reject (min=1)

### Test Boolean Toggles:
1. Custom Branding:
   - Select "Disabled" → Submit → Should save as `false`
   - Edit → Change to "Enabled" → Submit → Should save as `true`
   - Card should show ✗ Disabled or ✓ Enabled
2. Priority Support:
   - Same behavior as Custom Branding

---

## 📊 Database Verification

To verify data is saved correctly, check MongoDB:

```javascript
// Example document in SubscriptionPlan collection
{
  "_id": "...",
  "name": "Premium",
  "displayName": "Premium Plan",
  "description": "Complete event solution",
  "commissionPercentage": 20,
  "monthlyFee": 999,
  "eventLimit": 10,
  "ticketLimit": 1000,
  "limits": {
    "eventsPerMonth": 5,
    "storageGB": 2.5,           // ✅ Saved as decimal
    "customBranding": true,      // ✅ Saved as boolean
    "prioritySupport": true      // ✅ Saved as boolean
  },
  "mostPopular": true,
  "isActive": true
}
```

---

## ✅ Success Criteria

All of these should be TRUE:

1. ✅ Can create plan with 0.5 GB storage
2. ✅ Can create plan with 1, 2, 3+ events per month
3. ✅ Custom Branding dropdown works
4. ✅ Priority Support dropdown works
5. ✅ Plan cards show all 4 limit fields
6. ✅ Storage displays with GB suffix
7. ✅ Booleans show ✓ Enabled / ✗ Disabled
8. ✅ Edit form loads existing values correctly
9. ✅ Update plan saves changes
10. ✅ No console errors

---

## 🎬 Quick Demo Flow

**60-Second Test:**

1. Open `/admin/subscription-dashboard` → Plans tab
2. Click "Create Plan"
3. Fill "Basic" plan:
   - Name: Basic
   - Description: Basic plan
   - Storage: **0.5**
   - Events/Month: **1**
   - Both toggles: **Disabled**
4. Submit → Check card shows "0.5 GB" and "✗ Disabled"
5. Click "Edit" on that plan
6. Change Storage to **2.5**
7. Enable Custom Branding
8. Submit → Check card shows "2.5 GB" and "✓ Enabled"

**Result**: If all display correctly → ✅ FEATURE WORKS!

---

*Ready to test at http://localhost:5174/admin/subscription-dashboard*

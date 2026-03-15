# Push Notification Checklist (Admin -> Mobile)

This file is a practical runbook to implement and verify Firebase push notifications end-to-end for:
- Admin web page: /admin/send-notification
- Backend API: /api/admin/send-notification
- Mobile app token registration: /api/users/save-fcm-token

## 1. Current Status

- UI route exists and is protected for admin users.
- Backend push controller is implemented with:
  - input validation
  - token deduplication
  - chunked sending (500 per FCM batch)
  - stale token cleanup
  - actionable error responses
- Push health endpoint exists: GET /api/admin/push-notification/health
- Missing real Firebase credential is still the only hard blocker.

## 2. Required Environment Setup

Edit server/.env and configure one option below.

### Option A (Recommended): FIREBASE_SERVICE_ACCOUNT_JSON

Set the full service account JSON as one line:

FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

### Option B: FIREBASE_SERVICE_ACCOUNT_PATH

Set absolute path to local JSON file:

FIREBASE_SERVICE_ACCOUNT_PATH=E:/secrets/firebase-service-account.json

Restart backend after any env change.

## 3. Backend Startup Check

Run from server folder:

```powershell
node --input-type=module -e "import dotenv from 'dotenv'; dotenv.config({path:'./.env'}); const m = await import('./config/firebaseAdmin.js'); try { m.getFirebaseAdmin(); console.log('PUSH_HEALTH:CONFIGURED'); } catch (e) { console.log('PUSH_HEALTH:NOT_CONFIGURED'); console.log(e.message); }"
```

Expected:
- PASS: PUSH_HEALTH:CONFIGURED
- FAIL: PUSH_HEALTH:NOT_CONFIGURED + reason

## 4. Mobile Token Registration Check

Mobile app must call:
- POST /api/users/save-fcm-token
- Auth required (Bearer token)
- Body: { "fcmToken": "<device-token>" }

Success response should include:
- success: true
- message: FCM token saved successfully

If tokens are not being saved, admin device list will remain empty.

## 5. Admin API Health Check

Call as admin/super_admin:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/push-notification/health" -Headers @{ Authorization = "Bearer <ADMIN_JWT>" }
```

Expected success shape:

```json
{
  "success": true,
  "configured": true,
  "registeredDevices": 1
}
```

If configured is false, fix Firebase env first.

## 6. Admin UI Verification

Open:
- http://localhost:5173/admin/send-notification

Checklist:
1. Push health banner shows configured state.
2. Registered Devices card shows non-zero count (if mobile token saved).
3. Quick Templates are visible and fill title/message when clicked.
4. Send button is disabled when push service is not configured.
5. Sending shows success with sent/failed counts.

## 7. End-to-End Send Test

Use UI or API.

### API test (single user)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/admin/send-notification" -Headers @{ Authorization = "Bearer <ADMIN_JWT>"; "Content-Type" = "application/json" } -Body '{"title":"Test Push","message":"Hello from admin","target":"user","userId":"<USER_ID>"}'
```

### API test (all users)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/admin/send-notification" -Headers @{ Authorization = "Bearer <ADMIN_JWT>"; "Content-Type" = "application/json" } -Body '{"title":"System Update","message":"This is a broadcast test","target":"all"}'
```

Expected response fields:
- success
- sent
- failed
- cleanedInvalidTokens
- batches

## 8. Common Errors and Fixes

### 503 Push notifications are not configured
- Cause: Firebase credentials missing/invalid.
- Fix: set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH correctly; restart backend.

### 403 You do not have permission
- Cause: non-admin role trying to access admin push routes.
- Fix: login as admin or super_admin.

### 429 Too many requests
- Cause: push rate limit exceeded.
- Fix: wait for limiter window to reset.

### 200 with sent: 0 and message about no registered tokens
- Cause: no valid FCM tokens in DB.
- Fix: ensure mobile app logs in and saves token via /api/users/save-fcm-token.

### Invalid credential/authentication error from Firebase
- Cause: expired/revoked service account key.
- Fix: generate a new key in Firebase project and update env value.

## 9. Definition of Done

Mark complete only when all pass:
1. Backend startup check returns PUSH_HEALTH:CONFIGURED.
2. /api/admin/push-notification/health returns configured true.
3. Admin page shows configured push health.
4. At least one device appears in registered devices.
5. Test notification is received on mobile app.
6. Response shows sent > 0 for target user/device.

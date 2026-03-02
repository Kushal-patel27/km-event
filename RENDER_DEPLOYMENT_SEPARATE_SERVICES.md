# Render Deployment Guide - Separate Frontend & Backend Services

## Issues Fixed
1. **✅ 404 on page reload** - SPA routing not working for routes like `/events`
2. **✅ Favicon 404** - Frontend favicon now properly served
3. **✅ Environment URLs** - Production URLs properly configured

---

## Deployment Setup

### Prerequisites
- Both backend and frontend pushed to GitHub/GitLab/Bitbucket
- Render account with connected git repository

---

## Step 1: Deploy Backend Service

### 1a. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your backend repository (e.g., `km-event/server`)
4. Configure:
   - **Name**: `km-events-api` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to your users

### 1b. Add Environment Variables

In the Render dashboard, go to **Environment** and add:

```
NODE_ENV=production
PORT=5000
MONGO_URI=<your_mongo_connection_string>
JWT_SECRET=<your_jwt_secret>
RAZORPAY_KEY_ID=<your_razorpay_key>
RAZORPAY_KEY_SECRET=<your_razorpay_secret>
SESSION_SECRET=<your_session_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_secret>
GOOGLE_CALLBACK_URL=https://km-events-api.onrender.com/api/auth/google/callback
FRONTEND_URL=https://km-events.onrender.com
```

⚠️ **Important**: Replace `km-events.onrender.com` with your actual frontend URL

### 1c. Deploy

Click **Deploy** and wait for the service to become live. Note the URL (e.g., `https://km-events-api.onrender.com`)

---

## Step 2: Deploy Frontend Service

### 2a. Create New Static Site

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Select your frontend repository (e.g., `km-event/Frontend-EZ`)
4. Configure:
   - **Name**: `km-events`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: Select Node.js version 18+ if needed

### 2b. Add Environment Variables

In the Render dashboard, go to **Environment** and add:

```
VITE_API_URL=https://km-events-api.onrender.com
VITE_PRICE_CURRENCY=INR
```

⚠️ **Important**: The `VITE_API_URL` must match your backend service URL from Step 1

### 2c. Deploy

Click **Deploy** and wait for the build to complete.

---

## Step 3: Verify SPA Routing Configuration

The following files must be present in your Frontend-EZ for Render to support SPA routing:

### ✅ `Frontend-EZ/render.yaml`
```yaml
routes:
  - type: rewrite
    source: "/*"
    destination: "/index.html"
  - type: static
    source: "/dist"
    destination: "/"
```

This file tells Render to serve `index.html` for all routes, enabling React Router to handle client-side routing.

### ✅ `Frontend-EZ/public/_redirects`
```
/*    /index.html   200
```

(This is for Netlify, but doesn't hurt to have it)

### ✅ `Frontend-EZ/index.html` - Favicon configured
```html
<link rel="icon" type="image/png" href="/assets/logo.png" />
<link rel="apple-touch-icon" href="/assets/logo.png" />
<link rel="shortcut icon" type="image/png" href="/assets/logo.png" />
```

---

## Step 4: Update Your Code

### Frontend Environment Variables

**File**: `Frontend-EZ/.env`

```env
# Development
VITE_API_URL=http://localhost:5000
VITE_PRICE_CURRENCY=INR

# Production - Update these with your actual Render service URLs:
# VITE_API_URL=https://km-events-api.onrender.com
```

When deploying to Render, update the production comment with your actual API URL.

### Backend Environment Variables

**File**: `server/.env`

```env
# Frontend URL (Used for OAuth callbacks, CORS, etc.)
FRONTEND_URL=http://localhost:5173

# Production - Update for Render:
# FRONTEND_URL=https://km-events.onrender.com
```

---

## Step 5: Test Your Deployment

### ✅ Test Page Reload on Routes

1. Go to `https://km-events.onrender.com/events`
2. Refresh the page (F5 or Cmd+R)
3. ✅ Should show the events page (not 404)

### ✅ Test API Connectivity

1. Open browser DevTools (F12) → Network tab
2. Create a booking or perform an API action
3. Check that requests go to your backend API URL
4. ✅ Should see successful responses

### ✅ Test Favicon

1. Check browser tab icon
2. Check DevTools → Network tab for `/favicon.ico`
3. ✅ Should load without 404

### ✅ Test OAuth (if configured)

1. Try Google Login
2. ✅ Should redirect correctly and work

---

## Troubleshooting

### Issue: Still getting 404 on page reload

**Solution**:
1. Ensure `render.yaml` is in the root of `Frontend-EZ` folder
2. Restart the Render deployment:
   - Go to your Static Site settings
   - Scroll to "Manual Deploy"
   - Click "Deploy latest commit"

### Issue: API calls failing (Cross-origin errors)

**Solution**:
1. Check backend `.env` has correct `FRONTEND_URL`
2. Update CORS configuration if needed in `server/server.js`:
   ```javascript
   cors({
     origin: ["https://km-events.onrender.com", "http://localhost:5173"],
     credentials: true
   })
   ```

### Issue: Favicon still showing 404

**Solution**:
1. Ensure `/assets/logo.png` exists in `Frontend-EZ/public/assets/`
2. Run build locally: `npm run build`
3. Check `dist/assets/logo.png` exists
4. Redeploy

### Issue: Environment variables not loading

**Solution**:
1. In Render dashboard, go to service settings
2. Verify all env vars are set in **Environment** tab
3. Restart the service: Click "Manual Restart" button
4. Wait 2-3 minutes for changes to take effect

---

## File Checklist

Before deployment, ensure these files exist:

- ✅ `Frontend-EZ/render.yaml` - SPA routing config
- ✅ `Frontend-EZ/.env` - Environment variables with production comments
- ✅ `Frontend-EZ/public/assets/logo.png` - Favicon source
- ✅ `Frontend-EZ/index.html` - Contains favicon links
- ✅ `server/.env` - Backend environment config
- ✅ `server/server.js` - Has CORS configuration

---

## Environment URLs Reference

After deployment, you'll have:

| Service | Type | URL Example |
|---------|------|-------------|
| Frontend | Static Site | `https://km-events.onrender.com` |
| Backend API | Web Service | `https://km-events-api.onrender.com` |

Update your environment variables with these actual URLs!

---

## Next Steps

1. ✅ Push all changes to git
2. ✅ Update Render environment variables with your actual URLs
3. ✅ Restart both services
4. ✅ Test all functionality
5. ✅ Monitor Render dashboard for any build errors

**Deployment complete!** Your app should now work correctly with SPA routing, proper API connectivity, and no page reload errors.

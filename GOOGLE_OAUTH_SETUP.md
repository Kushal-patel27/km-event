# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the K&M Events application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "K&M Events")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and then click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: K&M Events
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
8. Click "Save and Continue"
9. Add test users if you're in development mode
10. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "K&M Events Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173` (your frontend URL)
   - `http://localhost:5000` (your backend URL)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:5000/api/auth/google/callback`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

### Backend (.env file in /server directory)

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-random-session-secret
JWT_SECRET=your-jwt-secret
```

Replace the placeholders with your actual values:
- `GOOGLE_CLIENT_ID`: The Client ID from Step 4
- `GOOGLE_CLIENT_SECRET`: The Client Secret from Step 4
- `SESSION_SECRET`: A random string for session encryption
- `JWT_SECRET`: Your existing JWT secret

### Frontend (.env file in /Frontend-EZ directory)

The frontend .env should already have:
```env
VITE_API_URL=http://localhost:5000
```

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start your frontend development server:
   ```bash
   cd Frontend-EZ
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login`
4. Click "Sign in with Google"
5. You should be redirected to Google's consent screen
6. After authorizing, you'll be redirected back to your app

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen in Google Cloud Console to "Published" status
2. Update the authorized origins and redirect URIs to include your production URLs
3. Update environment variables with production URLs:
   ```env
   GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
   FRONTEND_URL=https://your-domain.com
   ```

## Troubleshooting

### Error: redirect_uri_mismatch
- Make sure the redirect URI in your Google Cloud Console exactly matches `GOOGLE_CALLBACK_URL`
- Check that there are no trailing slashes

### Error: invalid_client
- Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure there are no extra spaces in the .env file

### User is not redirected after authentication
- Check that `FRONTEND_URL` in backend .env matches your actual frontend URL
- Verify CORS is configured correctly in server.js

## How It Works

1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google` on the backend
3. Backend redirects to Google's OAuth consent screen
4. User authorizes the app
5. Google redirects back to `/api/auth/google/callback`
6. Backend creates/finds user and generates JWT token
7. Backend redirects to frontend `/auth/callback` with token in URL
8. Frontend extracts token and saves to auth context
9. User is logged in and redirected to home page

## Security Notes

- Never commit `.env` files to version control
- Use strong, random values for `SESSION_SECRET` and `JWT_SECRET`
- In production, always use HTTPS
- Regularly rotate your secrets
- Keep your Google Cloud credentials secure

# Quick Start: Google OAuth Setup

## Step 1: Get Google Credentials (5 minutes)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure consent screen if prompted (use External, add your email)
6. Select "Web application"
7. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
8. Click "Create" and copy the Client ID and Client Secret

## Step 2: Update Backend .env

Edit `server/.env` and add:

```env
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=any-random-string-here
```

## Step 3: Restart Your Servers

```bash
# Terminal 1 - Backend (if already running, restart it)
cd server
npm run dev

# Terminal 2 - Frontend (if already running, restart it)  
cd Frontend-EZ
npm run dev
```

## Step 4: Test It Out

1. Open http://localhost:5173/login
2. Click "Sign in with Google"
3. Authorize the app
4. You should be logged in!

## That's It! 🎉

For detailed setup and troubleshooting, see:
- `GOOGLE_OAUTH_SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details

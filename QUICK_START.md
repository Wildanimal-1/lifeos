# Quick Start Guide

## Step 1: Google OAuth Setup (5 minutes)

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: **LifeOS**
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Configure OAuth consent screen:
   - User type: External
   - Add test users (your email)
   - Add scopes (paste these URLs):
     ```
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/calendar.events
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```
5. Create OAuth Client ID:
   - Type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`
6. Copy your Client ID and Client Secret

### Update Your .env File

Open `.env` in your project root and add:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 2: Connect Your Account

1. Open http://localhost:5173
2. Sign in to LifeOS
3. Go to Settings
4. Click "Connect Google Account"
5. Authorize the app (click "Allow" on Google's page)
6. Done! Your account is now connected

## Need More Help?

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions with screenshots and troubleshooting.

## What's Already Configured

✅ Supabase database (already set up in your .env)
✅ Authentication system
✅ Demo mode functionality
✅ Password visibility toggle

## What You Need to Add

❌ Google OAuth credentials (follow steps above)

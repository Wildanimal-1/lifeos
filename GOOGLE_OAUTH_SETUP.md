# Google OAuth Setup Guide for LifeOS

This guide will walk you through setting up Google OAuth to connect your Gmail and Google Calendar with LifeOS.

## Why OAuth is Needed

The yellow warning "No accounts connected" appears because LifeOS needs permission to access your:
- Gmail (for email triage and draft generation)
- Google Calendar (for event management and scheduling)

OAuth 2.0 is the secure, industry-standard way to grant these permissions without sharing your password.

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the project dropdown at the top (says "Select a project")
4. Click **"New Project"**
5. Enter project name: `LifeOS` (or any name you prefer)
6. Click **"Create"**
7. Wait for the project to be created (takes ~30 seconds)
8. Click **"Select Project"** when the notification appears

### Step 2: Enable Required APIs

**Enable Gmail API:**
1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type `Gmail API`
3. Click on **"Gmail API"** in the results
4. Click **"Enable"**
5. Wait for it to enable

**Enable Google Calendar API:**
1. Click **"Library"** again in the left sidebar
2. Search for `Google Calendar API`
3. Click on **"Google Calendar API"**
4. Click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**

**App Information:**
- App name: `LifeOS`
- User support email: Your email address
- App logo: (optional, skip for now)

**Developer contact information:**
- Email addresses: Your email address

4. Click **"Save and Continue"**

**Scopes:**
5. Click **"Add or Remove Scopes"**
6. In the "Manually add scopes" text box, paste these URLs one at a time:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
7. Click **"Add to Table"** for each scope
8. Click **"Update"**
9. Click **"Save and Continue"**

**Test Users:**
10. Click **"Add Users"**
11. Enter your email address (the one you'll use to test LifeOS)
12. Click **"Add"**
13. Click **"Save and Continue"**

**Summary:**
14. Review everything and click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** (at the top)
3. Select **"OAuth client ID"**

**Configure OAuth client:**
- Application type: **Web application**
- Name: `LifeOS Web Client`

**Authorized JavaScript origins:**
4. Click **"Add URI"**
5. Enter: `http://localhost:5173`
6. (For production, also add your production domain: `https://yourdomain.com`)

**Authorized redirect URIs:**
7. Click **"Add URI"**
8. Enter: `http://localhost:5173/auth/callback`
9. (For production, also add: `https://yourdomain.com/auth/callback`)

10. Click **"Create"**

**Copy Your Credentials:**
11. A modal will appear showing:
    - **Client ID** (looks like: `123456789-abc123xyz.apps.googleusercontent.com`)
    - **Client Secret** (looks like: `GOCSPX-abc123xyz`)
12. Click the **copy icon** next to each to copy them
13. Keep these safe - you'll need them in the next step!

### Step 5: Update Your .env File

1. Open your project folder in your code editor
2. Find the `.env` file in the root directory
3. Add these lines (or update if they exist):

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

4. Replace `paste_your_client_id_here` with your actual Client ID
5. Replace `paste_your_client_secret_here` with your actual Client Secret
6. **Save the file**

**Example (with fake credentials):**
```env
VITE_GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz456
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Step 6: Restart Your Development Server

**Important:** You must restart the server for the new environment variables to load!

1. Go to your terminal where the dev server is running
2. Press `Ctrl+C` to stop it
3. Run `npm run dev` to start it again
4. Wait for it to say "Local: http://localhost:5173"

### Step 7: Connect Your Google Account

1. Open your browser and go to `http://localhost:5173`
2. Sign in to LifeOS (if not already signed in)
3. Click **"Settings"** in the top right
4. Scroll down to the **"Connected Accounts"** section
5. The yellow warning should now show a blue **"Connect Google Account"** button
6. Click **"Connect Google Account"**

**Google Authorization Flow:**
7. You'll be redirected to Google's authorization page
8. Review the permissions LifeOS is requesting
9. You may see an **"unverified app"** warning - this is normal for development!
   - Click **"Advanced"**
   - Click **"Go to LifeOS (unsafe)"** - it's actually safe, just not verified by Google yet
10. Click **"Allow"** or **"Continue"** to grant permissions
11. You'll be redirected back to LifeOS
12. You should see a success message: "Successfully connected [your-email@gmail.com]"

### Step 8: Verify Connection

1. Check the Settings page - you should see your connected account
2. The yellow "No accounts connected" warning should be gone
3. Try a command like: `Show my urgent emails`
4. LifeOS should now be able to access your actual Gmail data!

---

## Troubleshooting

### "OAuth not configured" still showing

**Solution:**
- Make sure you copied the Client ID and Client Secret correctly
- Check for extra spaces or missing characters
- Verify the environment variable names are exact: `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET`
- Restart your dev server after updating `.env`

### "Invalid redirect URI" error

**Solution:**
- Go back to Google Cloud Console → Credentials
- Click on your OAuth client
- Check that `http://localhost:5173/auth/callback` is in the Authorized redirect URIs list
- Make sure there are no trailing slashes or extra characters
- The URI must match exactly what's in your `.env` file

### "Access blocked: This app's request is invalid"

**Solution:**
- This means a scope is misconfigured
- Go to Google Cloud Console → OAuth consent screen
- Verify all 5 scopes are added correctly
- Make sure you're using the test user email you added

### "Error 400: redirect_uri_mismatch"

**Solution:**
- The redirect URI in your request doesn't match what's registered in Google Cloud
- Check your `.env` file: `VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback`
- Check Google Cloud Console → Credentials → Your OAuth Client → Authorized redirect URIs
- They must match exactly (including http vs https, port number, path)

### "Access denied" or "User cancelled authorization"

**Solution:**
- You clicked "Cancel" on Google's authorization page
- Simply try connecting again from Settings
- Make sure to click "Allow" or "Continue" when asked for permissions

### Connected but no emails showing

**Solution:**
- Check that Gmail API is enabled in Google Cloud Console
- Verify the `gmail.readonly` scope was granted
- Check browser console (F12) for any error messages
- Try disconnecting and reconnecting your account

---

## Important Security Notes

### Do NOT commit your .env file to Git!

Your `.env` file contains sensitive credentials. It should already be in `.gitignore`, but double-check:

1. Open `.gitignore` file
2. Make sure it contains `.env` on its own line
3. Never share your Client Secret publicly

### Unverified App Warning

During development, Google shows an "unverified app" warning. This is **normal and expected**. To remove it:

1. Your app needs to be publicly available (deployed)
2. You need a privacy policy and terms of service
3. Submit your app for Google's verification process
4. Verification takes 4-6 weeks

For personal use and testing, you can safely bypass this warning by clicking "Advanced" → "Go to LifeOS".

### Production Deployment

When deploying to production:

1. Add your production domain to Authorized JavaScript origins
2. Add your production callback URL to Authorized redirect URIs
3. Update your `.env` on the server with production values
4. Consider submitting for Google verification
5. Switch OAuth consent screen from "Testing" to "In Production"

---

## What's Next?

Once connected, LifeOS can:

✅ **Email Features:**
- Read your inbox for triage
- Identify urgent emails
- Generate draft replies
- Send emails (when auto-send is enabled)

✅ **Calendar Features:**
- View your calendar events
- Create deep-work blocks
- Optimize your schedule
- Propose time changes

Try these commands:
- `Show my urgent emails`
- `Draft a reply to [email subject]`
- `Auto-plan my week with deep work blocks`
- `Schedule study time for [subject]`

---

## Need Help?

If you're stuck:

1. Check the browser console (F12) for error messages
2. Review the Google Cloud Console for any configuration issues
3. Make sure all 5 scopes are added in OAuth consent screen
4. Verify your test user email is added
5. Try disconnecting and reconnecting your account

Remember: The demo account (`lifeos.demo@gmail.com`) uses mock data and doesn't need OAuth. This setup is only for connecting your real Google account!

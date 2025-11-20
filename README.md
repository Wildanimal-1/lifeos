# LifeOS - Multi-Agent Personal Operating System

LifeOS is an intelligent multi-agent orchestration system that automates email triage, calendar management, and study planning through natural language commands. Built with React, TypeScript, and Supabase.

## Live Demo

🚀 **[View Live Demo](#)** (Coming soon)

## Screenshots

### Main Dashboard
![LifeOS Dashboard](public/screenshots/execution-results.png)
*Complete execution results with email summary, calendar timeline, and study plan*

### Command Interface
![Command Interface](public/screenshots/command-interface.png)
*Natural language command input with voice mode support and example commands*

### Calendar Management
![Calendar Management](public/screenshots/calendar-management.png)
*Calendar optimization with deep-work blocks and proposed schedule changes*

### Dashboard Overview
![Dashboard Overview](public/screenshots/dashboard-main.png)
*Main dashboard interface with multi-agent orchestration status*

## New Features (v2.0)

### 🎯 Auto-Planner
- **Auto-plan Week/Day**: Automatically schedule deep-work blocks and study sessions
- **Preview Mode**: See proposed changes before applying them (`Auto-plan my week (preview only)`)
- **Apply Mode**: Automatically reschedule low-priority events (`Auto-plan my week with deep work blocks`)
- **Smart Scheduling**: Creates 3 deep-work blocks per day (90 min max)
- **Study Block Integration**: Fits study sessions into optimal time slots

### 📄 Smart Weekly PDF Report
- **One-Click Export**: Generate professional PDF reports via print
- **Comprehensive Sections**: Execution plan, email summary, calendar timeline, study plan, metrics
- **Print-Optimized**: Clean typography for A4 printing
- **Browser-Based**: Uses window.print() for instant PDF generation

### 🎤 Voice Mode (JARVIS)
- **Speech Recognition**: Speak commands using Web Speech API (en-IN)
- **Real-Time Transcription**: See your spoken words as text
- **Text-to-Speech**: Hear execution summaries spoken back
- **Visual Feedback**: Animated waveform indicator while listening
- **Fallback Support**: Text input available if browser doesn't support speech

### 📱 Premium Responsive UI
- **Mobile-First Design**: Optimized for 360px, 768px, and 1200px+ screens
- **Animated Indicators**: Visual feedback during agent execution
- **Timeline View**: Interactive weekly timeline component
- **Accessible**: Full keyboard navigation and screen reader support
- **Reduced Motion**: Respects `prefers-reduced-motion` settings

## Core Features

### Multi-Agent System
- **IntentParser**: Analyzes commands including auto-plan intents
- **EmailAgent**: Triages inbox and drafts intelligent replies
- **CalendarAgent**: Creates deep-work blocks and optimizes schedules
- **StudyAgent**: Generates study blocks with time estimates
- **DashboardAgent**: Compiles unified dashboard

### Key Capabilities
- Natural language and voice command processing
- Auto-planner with preview and apply modes
- Email triage with draft generation
- Deep-work block scheduling (3 per day, 90 min max)
- Study plan generation with flashcards
- Complete audit logging
- User preferences (timezone: Asia/Kolkata by default)
- Safety-first (auto_send=false by default)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Quick Setup

```bash
# Clone and install
git clone <repository-url>
cd lifeos
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo1234`

### Example Commands

**Full Week Planning:**
```
Plan my week: reply to urgent emails, reschedule low-priority meetings, and create a study plan for my ML midterm
```

**Auto-Plan Preview (no changes applied):**
```
Auto-plan my week (preview only)
```

**Auto-Plan with Deep Work Blocks:**
```
Auto-plan my week with deep work blocks
```

**Email Triage:**
```
Triage my inbox and draft replies for urgent emails
```

**Study Plan:**
```
Create a study plan for my ML midterm exam
```

### Voice Commands

1. Click **"Enable Voice Mode"**
2. Click **"Start Voice Input"**
3. Speak your command clearly (e.g., "Plan my week")
4. Click **"Stop Listening"** when done
5. Hear the execution summary spoken back in en-IN

### PDF Export

1. Execute any command
2. Scroll to results
3. Click browser's Print button or use Ctrl+P/Cmd+P
4. Select "Save as PDF" as destination
5. PDF includes execution plan, summaries, and audit log

### Settings

Configure in Settings panel:
- **Calendar ID**: Default "primary"
- **Study Notes Link**: Google Docs URL or local path
- **Work Hours**: Default "09:00-18:00"
- **Timezone**: Default "Asia/Kolkata"
- **Auto-send**: Default false (safe mode)

## Sample Test Commands

### 1. Full Run (Text)
```
Plan my week: triage urgent emails, reschedule low-priority meetings, and create a 7-day study plan for my ML midterm.
```
**Expected**: execution_plan, email summaries, proposed changes, study blocks, dashboard, audit_log

### 2. Auto-Plan Preview
```
Auto-plan my week (preview only)
```
**Expected**: Deep-work blocks and study sessions proposed, no calendar changes applied

### 3. Auto-Plan Apply
```
Auto-plan my week with deep work blocks
```
**Expected**: Calendar changes proposed (mock data shows simulation)

### 4. Voice Command
- Enable Voice Mode
- Speak: "Plan my week"
- **Expected**: Transcription displayed, execution runs, TTS speaks summary

### 5. PDF Export
- Run any command
- Press Ctrl+P/Cmd+P or use Print button
- **Expected**: Printable PDF with all execution details

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Voice**: Web Speech API
- **Icons**: Lucide React
- **Build**: Vite

### Database Schema
- `user_contexts` - User preferences
- `executions` - Execution history
- `audit_logs` - Agent action logs
- `email_drafts` - Email replies
- `calendar_proposals` - Schedule changes
- `study_plans` - Study materials

### Agent Flow (Auto-Planner)
```
1. IntentParser → detects "auto_plan_week"
2. StudyAgent → generates study_blocks with priorities
3. CalendarAgent → creates deep-work blocks + fits study sessions
4. DashboardAgent → compiles timeline view
5. Return: proposed_changes + changed_events (if auto_execute=true)
```

## Project Structure
```
src/
├── agents/               # Multi-agent system
│   ├── intentParser.ts   # Parses auto-plan intents
│   ├── emailAgent.ts     # Email triage
│   ├── calendarAgent.ts  # Deep-work scheduling
│   ├── studyAgent.ts     # Study blocks generation
│   ├── dashboardAgent.ts # Output compilation
│   └── orchestrator.ts   # Coordination + voice
├── components/           # React components
│   ├── CommandInput.tsx  # Text + voice input
│   ├── VoiceMode.tsx     # Speech recognition UI
│   ├── DashboardView.tsx # Results display
│   ├── TimelineView.tsx  # Weekly calendar
│   ├── PDFReportView.tsx # Print-optimized view
│   ├── AuthForm.tsx      # Authentication
│   └── Settings.tsx      # User preferences
└── lib/
    ├── supabase.ts       # DB client
    └── mockData.ts       # Sample data
```

## Browser Compatibility

### Voice Mode Support
| Browser | Speech Recognition | Text-to-Speech |
|---------|-------------------|----------------|
| Chrome  | ✅ Full          | ✅ Full        |
| Edge    | ✅ Full          | ✅ Full        |
| Safari  | ⚠️ Limited       | ✅ Full        |
| Firefox | ❌ Not supported | ✅ Full        |

**Note**: Fallback to text input available for all browsers

### Responsive Breakpoints
- Mobile: 360px+
- Tablet: 768px+
- Desktop: 1200px+
- Wide: 1536px+

## Security

- ✅ Row Level Security (RLS) on all tables
- ✅ auto_send=false by default
- ✅ Preview mode for calendar changes
- ✅ Complete audit trail
- ✅ Email bodies redacted in UI
- ✅ Authenticated access only

## Mock Data

When OAuth not connected:
- 6 realistic sample emails
- 6 calendar events (today/tomorrow)
- ML midterm study notes (7 weeks)
- Auto-generated deep-work blocks

## Channel Integrations

LifeOS supports multiple communication channels for notifications and command input. This section describes how to enable WhatsApp/SMS via Twilio and Gmail access via OAuth.

### WhatsApp & SMS (via Twilio)

#### Prerequisites
1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. **Twilio Phone Number**: Purchase a phone number with SMS/WhatsApp capabilities
3. **WhatsApp Business API Approval**: Required for WhatsApp messaging (see warnings below)

#### Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

#### Setup Steps

1. **Get Twilio Credentials**
   - Log in to [Twilio Console](https://console.twilio.com)
   - Copy your Account SID and Auth Token from the dashboard
   - Note your purchased phone number

2. **Configure Phone Number**
   - Navigate to Phone Numbers → Manage → Active Numbers
   - Select your number
   - Under "Messaging Configuration", set webhook URL (if using edge functions)
   - Enable SMS and/or WhatsApp capabilities

3. **Test SMS**
   ```bash
   # Send test message via Twilio CLI
   twilio api:core:messages:create \
     --from "+1234567890" \
     --to "+your-phone" \
     --body "LifeOS test message"
   ```

#### WhatsApp Business API Warnings

⚠️ **Important Considerations for WhatsApp:**

- **Sandbox Mode**: Twilio provides a WhatsApp sandbox for testing. Users must opt-in by sending a code to the sandbox number.
- **Production Access**: Requires WhatsApp Business API approval from Meta (formerly Facebook)
- **Approval Process**: Can take 1-2 weeks and requires business verification
- **Message Templates**: Production WhatsApp requires pre-approved message templates for outbound messages
- **Pricing**: WhatsApp messages are priced differently from SMS (check Twilio pricing)
- **Rate Limits**: WhatsApp has stricter rate limits than SMS
- **24-Hour Window**: Can only send template messages outside 24-hour customer service window

**For Testing**: Use [Twilio Sandbox for WhatsApp](https://www.twilio.com/console/sms/whatsapp/sandbox) to test without approval.

**For Production**: Apply for WhatsApp Business API access through [Twilio Console](https://www.twilio.com/console/sms/whatsapp/senders).

#### SMS vs WhatsApp Comparison

| Feature | SMS | WhatsApp |
|---------|-----|----------|
| Setup Time | Immediate | Days to weeks (approval) |
| Cost | ~$0.0075/msg | ~$0.005/msg (varies by country) |
| Rich Media | No | Yes (images, documents) |
| Delivery Status | Basic | Read receipts |
| Rate Limits | High | Moderate |
| Approval Required | No | Yes (production) |

### Gmail OAuth Integration

#### Prerequisites
1. **Google Cloud Project**: Create at [console.cloud.google.com](https://console.cloud.google.com)
2. **Gmail API Access**: Enable Gmail API in your project
3. **OAuth 2.0 Credentials**: Create OAuth client ID

#### Environment Variables

Add these to your `.env` file:

```env
# Gmail OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

#### Setup Steps

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable billing (required for production use)

2. **Enable Gmail API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type (or "Internal" for Google Workspace)
   - Fill in required fields:
     - App name: "LifeOS"
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` (read emails)
     - `https://www.googleapis.com/auth/gmail.send` (send emails)
     - `https://www.googleapis.com/auth/gmail.modify` (draft emails)
   - Add test users (your email addresses for testing)

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "LifeOS Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
   - Copy Client ID and Client Secret

5. **Update Environment Variables**
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

6. **Test OAuth Flow**
   - Restart your development server
   - Click "Connect Gmail" in Settings
   - Authorize the app with your Google account
   - Verify emails appear in dashboard

#### OAuth Scopes Explained

| Scope | Purpose | Access Level |
|-------|---------|--------------|
| `gmail.readonly` | Read emails for triage | Read-only |
| `gmail.send` | Send drafted replies | Write |
| `gmail.modify` | Create drafts, mark as read | Read/Write |
| `gmail.labels` | Organize with labels | Write |

**Recommended**: Start with `gmail.readonly` for testing, add write scopes as needed.

#### Publishing Your App

⚠️ **Unverified App Warning**: During development, users will see an "unverified app" warning when authorizing. To remove this:

1. **Submit for Verification** (Google's OAuth App Verification)
   - Navigate to OAuth consent screen
   - Click "Publish App"
   - Submit for verification if using sensitive scopes
   - Verification takes 4-6 weeks
   - Requires privacy policy and homepage URLs

2. **Requirements for Verification**
   - Published privacy policy (must include data handling practices)
   - Published terms of service
   - Homepage with clear description
   - Domain verification
   - Video demo of OAuth flow
   - Justification for each scope requested

3. **Testing Without Verification**
   - Use "Testing" status during development
   - Add up to 100 test users manually
   - Test users can authorize without warnings
   - No time limit on testing status

#### Gmail API Quotas

| Resource | Free Tier Limit |
|----------|-----------------|
| Queries per day | 1,000,000,000 |
| Queries per 100 seconds | 250 |
| Send messages per day | 2,000 (per user) |

**Note**: Most LifeOS usage will be well within free tier limits.

### Complete Environment Variables Reference

Here's a complete `.env.example` with all channel integrations:

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio (Optional - for SMS/WhatsApp)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Gmail OAuth (Optional - for live email)
VITE_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# Google Calendar (Optional - for live calendar)
VITE_GOOGLE_CALENDAR_API_KEY=your_api_key
```

### Troubleshooting

#### Twilio Issues
- **"Authentication Error"**: Verify Account SID and Auth Token are correct
- **"Phone number not verified"**: During trial, verify recipient numbers in Twilio Console
- **WhatsApp opt-in required**: Sandbox users must send join code first
- **Message not delivered**: Check Twilio logs in Console for delivery status

#### Gmail OAuth Issues
- **"Redirect URI mismatch"**: Ensure redirect URI exactly matches in Google Console and `.env`
- **"Access denied"**: Check OAuth consent screen has correct scopes enabled
- **"Invalid client"**: Verify Client ID is correct and app isn't deleted
- **"Unverified app" warning**: Expected during testing; add users as test users or submit for verification
- **Token expired**: Implement refresh token flow (tokens expire after 1 hour)

## Future Enhancements

- [ ] Google Calendar API integration
- [ ] Server-side PDF with Puppeteer
- [ ] Google Sheets audit sync
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app
- [ ] Telegram bot integration
- [ ] Slack notifications

## Contributing

Contributions welcome! Open an issue or PR.

## License

MIT

## Acknowledgments

Built with Bolt.new - AI-powered development platform

---

**Version**: 2.0.0
**Last Updated**: November 2025
**Default Timezone**: Asia/Kolkata
**Demo**: lifeos.demo@gmail.com / demo1234

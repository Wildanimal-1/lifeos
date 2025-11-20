# LifeOS - Multi-Agent Personal Operating System

LifeOS is an intelligent multi-agent orchestration system that automates email triage, calendar management, and study planning through natural language commands. Built with React, TypeScript, and Supabase.

## Live Demo

🚀 **[View Live Demo](#)** (Coming soon)

## Screenshots

![LifeOS Dashboard](public/Screenshot%202025-11-19%20000434.png)
*Main dashboard showing execution results*

![Command Interface](public/Screenshot%202025-11-19%20000416.png)
*Natural language command input with examples*

![Calendar Management](public/Screenshot%202025-11-19%20000426.png)
*Calendar optimization and timeline view*

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

## Future Enhancements

- [ ] Gmail OAuth for live email
- [ ] Google Calendar API integration
- [ ] Server-side PDF with Puppeteer
- [ ] Google Sheets audit sync
- [ ] Email sending (SMTP)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app

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

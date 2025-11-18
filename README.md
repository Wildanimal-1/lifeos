# LifeOS - Multi-Agent Personal Automation System

LifeOS is an intelligent multi-agent orchestration system that automates email triage, calendar management, and study planning through natural language commands. Built with React, TypeScript, and Supabase.

## Features

### Multi-Agent System
- **IntentParser**: Analyzes natural language commands and determines which agents to activate
- **EmailAgent**: Triages inbox, identifies urgent emails, and drafts intelligent replies
- **CalendarAgent**: Analyzes calendar events, detects conflicts, and proposes optimized schedules
- **StudyAgent**: Creates structured study plans, generates flashcards, and practice questions
- **DashboardAgent**: Compiles all outputs into a unified dashboard with quick actions

### Key Capabilities
- Natural language command processing
- Intelligent email triage and auto-reply drafting
- Calendar optimization with deep-work block scheduling
- Automated study plan generation with flashcards (Anki-compatible CSV)
- Complete audit logging for transparency
- Execution history tracking
- User preferences and timezone management
- Safety-first approach (auto_send=false by default)

## Architecture

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Real-time updates with Supabase

### Backend
- Supabase PostgreSQL database
- Row Level Security (RLS) for data protection
- Agent-based architecture with clear separation of concerns

### Database Schema
- `user_contexts`: User preferences and settings
- `executions`: Orchestrator execution logs
- `audit_logs`: Complete agent action history
- `email_drafts`: Generated email replies
- `calendar_proposals`: Calendar optimization suggestions
- `study_plans`: Study schedules and materials

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd lifeos
   npm install
   ```

2. **Configure Supabase**
   - Create a new Supabase project at https://supabase.com
   - The database schema has already been applied
   - Copy your project URL and anon key

3. **Environment Variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## Usage

### Authentication
1. Sign up with email and password
2. Default settings are automatically created (Asia/Kolkata timezone, auto_send=false)

### Example Commands

**Full Week Planning:**
```
Plan my week: reply to urgent emails, reschedule low-priority meetings, and create a study plan for my ML midterm starting Monday.
```

**Email Triage:**
```
Triage my inbox and draft replies for urgent emails
```

**Calendar Optimization:**
```
Reschedule low-priority calendar events to create focused work blocks
```

**Study Plan:**
```
Create a study plan for my ML midterm exam
```

### Settings
Access the Settings panel to configure:
- Calendar ID (default: "primary")
- Study notes link (Google Docs URL or local file)
- Work hours (default: 09:00-18:00)
- Timezone (default: Asia/Kolkata)
- Auto-send preference (default: false)

### Dashboard
The dashboard displays:
- Email summary (urgent emails, drafts created, replies sent)
- Calendar summary (today's events, proposed changes)
- Study plan summary (subject, days planned, flashcards count)
- Quick actions (download flashcards CSV, view drafts, review proposals)
- Complete audit log with timestamps

### Safety Features
- **auto_send=false**: Email replies are drafted but not sent by default
- **Calendar proposals**: Changes are suggested but not applied without confirmation
- **Audit logging**: Every agent action is recorded with input/output summaries
- **RLS security**: Users can only access their own data

## Mock Data
When OAuth is not connected, the system uses realistic mock data:
- 6 sample emails (urgent, normal, and low priority)
- 6 calendar events across today and tomorrow
- ML midterm study notes covering 7 weeks of material

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Build Tool**: Vite

## Project Structure
```
src/
├── agents/
│   ├── intentParser.ts      # Command parsing logic
│   ├── emailAgent.ts         # Email triage and drafting
│   ├── calendarAgent.ts      # Calendar analysis
│   ├── studyAgent.ts         # Study plan generation
│   ├── dashboardAgent.ts     # Output compilation
│   └── orchestrator.ts       # Main coordination logic
├── components/
│   ├── AuthForm.tsx          # Authentication UI
│   ├── CommandInput.tsx      # Natural language input
│   ├── DashboardView.tsx     # Results display
│   └── Settings.tsx          # User preferences
├── lib/
│   ├── supabase.ts           # Supabase client config
│   └── mockData.ts           # Mock email/calendar data
└── App.tsx                   # Main application
```

## Agent Details

### IntentParser
- Extracts intent from natural language
- Identifies required agents
- Parses parameters (timeframe, priority, subject)
- Handles ambiguous commands with clarifications

### EmailAgent
- Fetches latest unread emails (mock or OAuth)
- Scores priority by sender, subject, and conflicts
- Generates contextual replies using templates
- Respects auto_send preference

### CalendarAgent
- Analyzes calendar for specified timeframe
- Detects low-priority events
- Proposes rescheduling into deep-work blocks (90 min max)
- Provides ICS export format

### StudyAgent
- Parses study notes (Markdown format)
- Creates 7-day study schedule
- Generates 20 flashcards with Q&A format
- Creates 5 practice questions with answers
- Exports Anki-compatible CSV

### DashboardAgent
- Compiles all agent outputs
- Creates quick action links
- Summarizes audit log
- Provides snapshot JSON

## Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Authenticated access required for all operations
- No email bodies exposed in dashboard (redacted)
- Auto-send disabled by default

## Future Enhancements
- Gmail OAuth integration
- Google Calendar API integration
- PDF export for study materials
- Google Docs integration for study notes
- Email sending via SMTP
- Advanced natural language processing
- Multi-language support
- Mobile responsive design improvements

## Demo Credentials
```
Email: demo@example.com
Password: demo1234
```

## License
MIT

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## Support
For issues or questions, please open a GitHub issue or contact the maintainers.

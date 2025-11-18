import { EmailAgentOutput } from './emailAgent';
import { CalendarAgentOutput } from './calendarAgent';
import { StudyAgentOutput } from './studyAgent';
import { AuditLog } from '../lib/supabase';

export interface DashboardSnapshot {
  email_summary: {
    top_urgent: any[];
    drafts_count: number;
    replies_sent: number;
  };
  calendar_summary: {
    events_today: number;
    proposed_changes: number;
    next_event?: any;
  };
  study_summary?: {
    subject: string;
    days_planned: number;
    flashcards_count: number;
    practice_questions_count: number;
  };
  quick_actions: QuickAction[];
  audit_summary: {
    total_actions: number;
    agents_used: string[];
  };
}

export interface QuickAction {
  label: string;
  type: string;
  data?: any;
}

export class DashboardAgent {
  async execute(
    emailOutput: EmailAgentOutput | null,
    calendarOutput: CalendarAgentOutput | null,
    studyOutput: StudyAgentOutput | null,
    auditLogs: AuditLog[]
  ): Promise<DashboardSnapshot> {
    const snapshot: DashboardSnapshot = {
      email_summary: {
        top_urgent: [],
        drafts_count: 0,
        replies_sent: 0
      },
      calendar_summary: {
        events_today: 0,
        proposed_changes: 0
      },
      quick_actions: [],
      audit_summary: {
        total_actions: auditLogs.length,
        agents_used: [...new Set(auditLogs.map(log => log.agent))]
      }
    };

    if (emailOutput) {
      snapshot.email_summary = {
        top_urgent: emailOutput.top_urgent.slice(0, 5),
        drafts_count: emailOutput.drafts.length,
        replies_sent: emailOutput.replies_sent_count
      };

      emailOutput.drafts.forEach((draft, idx) => {
        snapshot.quick_actions.push({
          label: `View Draft ${idx + 1}: ${draft.subject}`,
          type: 'email_draft',
          data: draft
        });
      });
    }

    if (calendarOutput) {
      const today = new Date();
      const todayEvents = calendarOutput.events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate.toDateString() === today.toDateString();
      });

      const upcomingEvents = calendarOutput.events
        .filter(e => new Date(e.start) > today)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      snapshot.calendar_summary = {
        events_today: todayEvents.length,
        proposed_changes: calendarOutput.proposed_changes.length,
        next_event: upcomingEvents[0] || null
      };

      calendarOutput.proposed_changes.forEach((change, idx) => {
        snapshot.quick_actions.push({
          label: `Review Calendar Change ${idx + 1}`,
          type: 'calendar_proposal',
          data: change
        });
      });
    }

    if (studyOutput) {
      snapshot.study_summary = {
        subject: 'ML Midterm',
        days_planned: studyOutput.study_schedule.length,
        flashcards_count: studyOutput.flashcards.length,
        practice_questions_count: studyOutput.practice_questions.length
      };

      snapshot.quick_actions.push({
        label: 'Download Flashcards CSV',
        type: 'download_csv',
        data: { csv: studyOutput.flashcards_csv }
      });

      snapshot.quick_actions.push({
        label: 'View Study Schedule',
        type: 'study_schedule',
        data: studyOutput.study_schedule
      });
    }

    return snapshot;
  }
}

import { supabase, UserContext } from '../lib/supabase';

interface WeeklyCompileOptions {
  userId: string;
  userContext: UserContext;
  weekStart?: Date;
}

interface WeeklySnapshot {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  execution_plan: string;
  weekly_plan: any;
  email_summary: any;
  study_plan: any;
  metrics: any;
  timeline: any[];
  dashboard_snapshot: any;
  pdf_path: string;
  public_url: string;
  created_at: string;
  updated_at: string;
}

function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function compileWeeklySnapshot(
  options: WeeklyCompileOptions
): Promise<WeeklySnapshot> {
  const { userId, userContext, weekStart: customWeekStart } = options;

  const targetDate = customWeekStart || new Date();
  const { weekStart, weekEnd } = getWeekBounds(targetDate);

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  const { data: existing } = await supabase
    .from('weekly_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStartStr)
    .maybeSingle();

  if (existing) {
    return existing as WeeklySnapshot;
  }

  const { data: recentExecution } = await supabase
    .from('executions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: weeklyExecutions } = await supabase
    .from('executions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false });

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', weekStart.toISOString())
    .lte('timestamp', weekEnd.toISOString())
    .order('timestamp', { ascending: true });

  const executionPlan = generateWeeklyExecutionPlan(
    weeklyExecutions || [],
    weekStart,
    weekEnd
  );

  const weeklyPlan = generateWeeklyPlan(
    recentExecution,
    weeklyExecutions || []
  );

  const emailSummary = aggregateEmailSummary(weeklyExecutions || []);
  const studyPlan = aggregateStudyPlan(weeklyExecutions || []);
  const metrics = calculateWeeklyMetrics(weeklyExecutions || [], auditLogs || []);
  const timeline = generateWeeklyTimeline(weeklyExecutions || [], auditLogs || []);

  const dashboardSnapshot = {
    email_summary: emailSummary,
    calendar_summary: weeklyPlan.calendar_summary || {},
    study_summary: studyPlan,
    timeline: timeline,
    metrics: metrics
  };

  const { data: snapshot, error } = await supabase
    .from('weekly_snapshots')
    .insert({
      user_id: userId,
      week_start: weekStartStr,
      week_end: weekEndStr,
      execution_plan: executionPlan,
      weekly_plan: weeklyPlan,
      email_summary: emailSummary,
      study_plan: studyPlan,
      metrics: metrics,
      timeline: timeline,
      dashboard_snapshot: dashboardSnapshot,
      pdf_path: '',
      public_url: ''
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create weekly snapshot: ${error.message}`);
  }

  return snapshot as WeeklySnapshot;
}

function generateWeeklyExecutionPlan(
  executions: any[],
  weekStart: Date,
  weekEnd: Date
): string {
  const startStr = weekStart.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const endStr = weekEnd.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (executions.length === 0) {
    return `Weekly Report for ${startStr} - ${endStr}\n\nNo commands executed this week. Run a command to see your weekly activity.`;
  }

  const commandSummary = executions
    .map((exec, idx) => {
      const date = new Date(exec.created_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return `${idx + 1}. ${date}: ${exec.user_command || 'Command executed'}`;
    })
    .join('\n');

  return `Weekly Report for ${startStr} - ${endStr}\n\nCommands executed this week:\n${commandSummary}\n\nTotal executions: ${executions.length}\nStatus: All systems operational`;
}

function generateWeeklyPlan(recentExecution: any, weeklyExecutions: any[]): any {
  if (!recentExecution?.dashboard_snapshot) {
    return {
      calendar_summary: {
        events_today: 0,
        events_this_week: weeklyExecutions.length,
        proposed_changes: 0
      }
    };
  }

  return {
    calendar_summary: recentExecution.dashboard_snapshot.calendar_summary || {
      events_today: 0,
      events_this_week: weeklyExecutions.length,
      proposed_changes: 0
    },
    timeline: recentExecution.dashboard_snapshot.timeline || []
  };
}

function aggregateEmailSummary(executions: any[]): any {
  let totalUrgent = 0;
  let totalDrafts = 0;
  let totalReplies = 0;
  const urgentEmails: any[] = [];

  executions.forEach(exec => {
    if (exec.dashboard_snapshot?.email_summary) {
      const summary = exec.dashboard_snapshot.email_summary;
      totalUrgent += summary.top_urgent?.length || 0;
      totalDrafts += summary.drafts_count || 0;
      totalReplies += summary.replies_sent || 0;

      if (summary.top_urgent) {
        urgentEmails.push(...summary.top_urgent);
      }
    }
  });

  const uniqueUrgent = urgentEmails.filter((email, index, self) =>
    index === self.findIndex((e) => e.subject === email.subject && e.from === email.from)
  ).slice(0, 5);

  return {
    top_urgent: uniqueUrgent,
    drafts_count: totalDrafts,
    replies_sent: totalReplies,
    total_urgent: totalUrgent
  };
}

function aggregateStudyPlan(executions: any[]): any {
  const studyPlans: any[] = [];

  executions.forEach(exec => {
    if (exec.dashboard_snapshot?.study_summary) {
      studyPlans.push(exec.dashboard_snapshot.study_summary);
    }
  });

  if (studyPlans.length === 0) {
    return {
      subject: 'No study plans this week',
      days_planned: 0,
      flashcards_count: 0
    };
  }

  const mostRecent = studyPlans[0];
  const totalDays = studyPlans.reduce((sum, plan) => sum + (plan.days_planned || 0), 0);
  const totalFlashcards = studyPlans.reduce((sum, plan) => sum + (plan.flashcards_count || 0), 0);

  return {
    subject: mostRecent.subject || 'Multiple subjects',
    days_planned: totalDays,
    flashcards_count: totalFlashcards,
    plans_created: studyPlans.length
  };
}

function calculateWeeklyMetrics(executions: any[], auditLogs: any[]): any {
  return {
    total_commands: executions.length,
    successful_executions: executions.filter(e => e.status === 'completed').length,
    failed_executions: executions.filter(e => e.status === 'failed').length,
    total_actions: auditLogs.length,
    unique_agents: [...new Set(auditLogs.map(log => log.agent))].length,
    avg_execution_time: executions.length > 0
      ? Math.round(executions.reduce((sum, e) => sum + (e.execution_time || 0), 0) / executions.length)
      : 0
  };
}

function generateWeeklyTimeline(executions: any[], auditLogs: any[]): any[] {
  const timeline: any[] = [];

  const dayMap = new Map<string, any[]>();

  executions.forEach(exec => {
    const date = new Date(exec.created_at);
    const dayKey = date.toISOString().split('T')[0];

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }

    dayMap.get(dayKey)!.push({
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      command: exec.user_command || 'Command executed',
      status: exec.status,
      execution_id: exec.id
    });
  });

  dayMap.forEach((events, dayKey) => {
    timeline.push({
      date: dayKey,
      events: events,
      total: events.length
    });
  });

  return timeline.sort((a, b) => a.date.localeCompare(b.date));
}

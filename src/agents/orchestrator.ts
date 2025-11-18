import { supabase, UserContext, AuditLog } from '../lib/supabase';
import { IntentParser, ParsedIntent } from './intentParser';
import { EmailAgent } from './emailAgent';
import { CalendarAgent } from './calendarAgent';
import { StudyAgent } from './studyAgent';
import { DashboardAgent } from './dashboardAgent';

export interface OrchestratorInput {
  user_command: string;
  user_context: UserContext;
}

export interface OrchestratorOutput {
  execution_id: string;
  execution_plan: string;
  audit_log: AuditLog[];
  final_summary: string;
  dashboard_snapshot: any;
}

export class Orchestrator {
  private intentParser = new IntentParser();
  private emailAgent = new EmailAgent();
  private calendarAgent = new CalendarAgent();
  private studyAgent = new StudyAgent();
  private dashboardAgent = new DashboardAgent();

  private async logAction(
    userId: string,
    agent: string,
    action: string,
    inputSummary: string,
    outputSummary: string
  ): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        agent,
        action,
        input_summary: inputSummary,
        output_summary: outputSummary
      })
      .select()
      .single();

    if (error) throw error;
    return data as AuditLog;
  }

  private buildExecutionPlan(intent: ParsedIntent): string {
    const steps: string[] = [];
    let stepNum = 1;

    if (intent.required_agents.includes('EmailAgent')) {
      steps.push(`${stepNum}) EmailAgent: Triage inbox, draft replies for urgent emails${intent.params.auto_send ? ' and send' : ''}.`);
      stepNum++;
    }

    if (intent.required_agents.includes('CalendarAgent')) {
      steps.push(`${stepNum}) CalendarAgent: Analyze calendar for ${intent.params.timeframe}, propose rescheduling low-priority events into deep-work blocks.`);
      stepNum++;
    }

    if (intent.required_agents.includes('StudyAgent')) {
      const subject = intent.params.subject || 'specified topic';
      steps.push(`${stepNum}) StudyAgent: Create 7-day study plan for ${subject}, generate flashcards and practice questions.`);
      stepNum++;
    }

    steps.push(`${stepNum}) DashboardAgent: Compile all outputs into dashboard snapshot with quick actions.`);

    return steps.join(' ');
  }

  async execute(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const { user_command, user_context } = input;
    const auditLogs: AuditLog[] = [];

    const { data: execution, error: execError } = await supabase
      .from('executions')
      .insert({
        user_id: user_context.user_id,
        user_command,
        status: 'running'
      })
      .select()
      .single();

    if (execError) throw execError;
    const executionId = execution.id;

    try {
      const intent = this.intentParser.parse(user_command, user_context.auto_send);

      const log1 = await this.logAction(
        user_context.user_id,
        'IntentParser',
        'parse_command',
        `Command: "${user_command}"`,
        `Intent: ${intent.intent}, Agents: ${intent.required_agents.join(', ')}`
      );
      auditLogs.push(log1);

      const executionPlan = this.buildExecutionPlan(intent);

      await supabase
        .from('executions')
        .update({ execution_plan: executionPlan })
        .eq('id', executionId);

      let emailOutput = null;
      let calendarOutput = null;
      let studyOutput = null;

      if (intent.required_agents.includes('EmailAgent')) {
        emailOutput = await this.emailAgent.execute(
          user_context.email_oauth,
          user_context.auto_send
        );

        const log = await this.logAction(
          user_context.user_id,
          'EmailAgent',
          'triage_and_draft',
          `Processing inbox with auto_send=${user_context.auto_send}`,
          `Drafted ${emailOutput.drafts.length} replies, found ${emailOutput.top_urgent.length} urgent emails`
        );
        auditLogs.push(log);

        for (const draft of emailOutput.drafts) {
          await supabase.from('email_drafts').insert({
            execution_id: executionId,
            to_address: draft.to,
            subject: draft.subject,
            draft_body: draft.full_draft,
            priority_score: 5,
            sent: user_context.auto_send
          });
        }
      }

      if (intent.required_agents.includes('CalendarAgent')) {
        calendarOutput = await this.calendarAgent.execute(
          user_context.calendar_id,
          user_context.auto_send,
          intent.params.timeframe || 'week'
        );

        const log = await this.logAction(
          user_context.user_id,
          'CalendarAgent',
          'analyze_and_propose',
          `Analyzing ${intent.params.timeframe} calendar`,
          `Inspected ${calendarOutput.events_inspected_count} events, proposed ${calendarOutput.proposed_changes.length} changes`
        );
        auditLogs.push(log);

        for (const proposal of calendarOutput.proposed_changes) {
          await supabase.from('calendar_proposals').insert({
            execution_id: executionId,
            event_id: proposal.eventId,
            old_slot: proposal.oldSlot,
            new_slot: proposal.newSlot,
            reason: proposal.reason,
            applied: user_context.auto_send
          });
        }
      }

      if (intent.required_agents.includes('StudyAgent')) {
        studyOutput = await this.studyAgent.execute(
          user_context.study_notes_link,
          intent.params.subject || 'General Study',
          user_context.work_hours
        );

        const log = await this.logAction(
          user_context.user_id,
          'StudyAgent',
          'create_study_plan',
          `Creating plan for ${intent.params.subject || 'General Study'}`,
          `Generated ${studyOutput.study_schedule.length}-day schedule, ${studyOutput.flashcards.length} flashcards, ${studyOutput.practice_questions.length} practice questions`
        );
        auditLogs.push(log);

        await supabase.from('study_plans').insert({
          execution_id: executionId,
          subject: intent.params.subject || 'General Study',
          schedule: studyOutput.study_schedule,
          flashcards_csv: studyOutput.flashcards_csv,
          practice_questions: studyOutput.practice_questions
        });
      }

      const dashboardSnapshot = await this.dashboardAgent.execute(
        emailOutput,
        calendarOutput,
        studyOutput,
        auditLogs
      );

      const log = await this.logAction(
        user_context.user_id,
        'DashboardAgent',
        'compile_snapshot',
        'Compiling all agent outputs',
        `Created dashboard with ${dashboardSnapshot.quick_actions.length} quick actions`
      );
      auditLogs.push(log);

      const finalSummary = this.generateFinalSummary(
        emailOutput,
        calendarOutput,
        studyOutput,
        user_context.auto_send
      );

      await supabase
        .from('executions')
        .update({
          status: 'completed',
          final_summary: finalSummary,
          dashboard_snapshot: dashboardSnapshot,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      return {
        execution_id: executionId,
        execution_plan: executionPlan,
        audit_log: auditLogs,
        final_summary: finalSummary,
        dashboard_snapshot: dashboardSnapshot
      };

    } catch (error) {
      await supabase
        .from('executions')
        .update({ status: 'failed' })
        .eq('id', executionId);

      throw error;
    }
  }

  private generateFinalSummary(
    emailOutput: any,
    calendarOutput: any,
    studyOutput: any,
    autoSend: boolean
  ): string {
    const parts: string[] = [];

    if (emailOutput) {
      parts.push(`Drafted ${emailOutput.drafts.length} email replies${autoSend ? ' and sent them' : ' (auto_send=false)'}`);
    }

    if (calendarOutput) {
      parts.push(`Proposed ${calendarOutput.proposed_changes.length} calendar optimizations to create focused work blocks`);
    }

    if (studyOutput) {
      parts.push(`Created comprehensive study plan with ${studyOutput.flashcards.length} flashcards and ${studyOutput.practice_questions.length} practice questions`);
    }

    return parts.join('. ') + '. Dashboard and audit log available for review.';
  }
}

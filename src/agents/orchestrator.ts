import { supabase, UserContext, AuditLog } from '../lib/supabase';
import { oauthManager } from '../lib/oauthManager';
import { IntentParser, ParsedIntent } from './intentParser';
import { EmailAgent } from './emailAgent';
import { CalendarAgent } from './calendarAgent';
import { StudyAgent } from './studyAgent';
import { DashboardAgent } from './dashboardAgent';

export interface OrchestratorInput {
  user_command: string;
  user_context: UserContext;
  oauth_account_id: string;
  options?: {
    source?: 'text' | 'speech';
    auto_execute?: boolean;
  };
}

export interface OrchestratorOutput {
  execution_id: string;
  execution_plan: string;
  audit_log: AuditLog[];
  final_summary: string;
  dashboard_snapshot: any;
  voice_summary_text?: string;
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
    outputSummary: string,
    oauthAccountId?: string,
    userEmail?: string,
    draftsCreated?: number,
    eventsChanged?: number,
    runId?: string
  ): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        agent,
        action,
        input_summary: inputSummary,
        output_summary: outputSummary,
        oauth_account_id: oauthAccountId,
        user_email: userEmail,
        drafts_created: draftsCreated,
        events_changed: eventsChanged,
        run_id: runId
      })
      .select()
      .single();

    if (error) throw error;
    return data as AuditLog;
  }

  private buildExecutionPlan(intent: ParsedIntent): string {
    const steps: string[] = [];
    let stepNum = 1;

    if (intent.intent === 'auto_plan_week' || intent.intent === 'auto_plan_day') {
      steps.push(`${stepNum}) StudyAgent: Generate study blocks with time estimates and priorities.`);
      stepNum++;
      steps.push(`${stepNum}) CalendarAgent: Create ${intent.params.preview_only ? 'preview of' : ''} deep-work blocks and fit study sessions${intent.params.auto_execute ? ', applying changes to calendar' : ''}.`);
      stepNum++;
      steps.push(`${stepNum}) DashboardAgent: Compile weekly plan with proposed changes and timeline view.`);
      return steps.join(' ');
    }

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
    const { user_command, user_context, oauth_account_id } = input;
    const auditLogs: AuditLog[] = [];

    const validation = await oauthManager.validateAccountContext(
      user_context.user_id,
      oauth_account_id
    );

    if (!validation.valid) {
      throw new Error(
        `Account context validation failed: ${validation.message}. Cannot execute without valid OAuth account.`
      );
    }

    const account = validation.account!;
    const effectiveAutoSend = user_context.demo_mode ? false : user_context.auto_send;

    if (user_context.demo_mode) {
      const demoLog = await this.logAction(
        user_context.user_id,
        'Orchestrator',
        'demo_mode_check',
        'Demo Mode: ENABLED',
        'Using mock data, auto_send forced to false, preventing outgoing messages to non-demo accounts'
      );
      auditLogs.push(demoLog);
    }

    const { data: execution, error: execError } = await supabase
      .from('executions')
      .insert({
        user_id: user_context.user_id,
        user_command,
        oauth_account_id,
        account_email: account.email,
        status: 'running'
      })
      .select()
      .single();

    if (execError) throw execError;
    const executionId = execution.id;

    try {
      const intent = this.intentParser.parse(user_command, effectiveAutoSend);

      const log1 = await this.logAction(
        user_context.user_id,
        'IntentParser',
        'parse_command',
        `Command: "${user_command}"`,
        `Intent: ${intent.intent}, Agents: ${intent.required_agents.join(', ')}`,
        oauth_account_id,
        account.email,
        undefined,
        undefined,
        executionId
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
          false
        );

        const log = await this.logAction(
          user_context.user_id,
          'EmailAgent',
          'triage_and_draft',
          `Processing inbox with auto_send=false (enforced), run_id=${executionId}`,
          `Drafted ${emailOutput.drafts.length} replies (all set to auto_send=false), found ${emailOutput.top_urgent.length} urgent emails`,
          oauth_account_id,
          account.email,
          emailOutput.drafts.length,
          undefined,
          executionId
        );
        auditLogs.push(log);

        for (const draft of emailOutput.drafts) {
          await supabase.from('email_drafts').insert({
            execution_id: executionId,
            to_address: draft.to,
            subject: draft.subject,
            draft_body: draft.body,
            priority_score: 5,
            sent: false,
            auto_send: false,
            from_account_id: oauth_account_id,
            confirmed_by_user: false
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
          `Generated ${studyOutput.study_schedule.length}-day schedule, ${studyOutput.flashcards.length} flashcards, ${studyOutput.practice_questions.length} practice questions, ${studyOutput.study_blocks?.length || 0} study blocks`,
          oauth_account_id,
          account.email,
          undefined,
          undefined,
          executionId
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

      if (intent.required_agents.includes('CalendarAgent')) {
        const autoPlanOptions = (intent.intent === 'auto_plan_week' || intent.intent === 'auto_plan_day') ? {
          auto_execute: intent.params.auto_execute || false,
          deep_work_hours: intent.params.deep_work_hours,
          max_block_minutes: intent.params.max_block_minutes
        } : undefined;

        calendarOutput = await this.calendarAgent.execute(
          user_context.calendar_id,
          intent.params.auto_execute || user_context.auto_send,
          intent.params.timeframe || 'week',
          autoPlanOptions
        );

        const log = await this.logAction(
          user_context.user_id,
          'CalendarAgent',
          'analyze_and_propose',
          `Analyzing ${intent.params.timeframe} calendar`,
          `Inspected ${calendarOutput.events_inspected_count} events, proposed ${calendarOutput.proposed_changes.length} changes`,
          oauth_account_id,
          account.email,
          undefined,
          calendarOutput.proposed_changes.length,
          executionId
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
        `Created dashboard with ${dashboardSnapshot.quick_actions.length} quick actions`,
        oauth_account_id,
        account.email,
        undefined,
        undefined,
        executionId
      );
      auditLogs.push(log);

      await oauthManager.logAccountUsage(
        oauth_account_id,
        user_context.user_id,
        'orchestrator_execution',
        `/execute/${executionId}`
      );

      const finalSummary = this.generateFinalSummary(
        emailOutput,
        calendarOutput,
        studyOutput,
        intent.params.auto_execute || user_context.auto_send
      );

      const voiceSummaryText = input.options?.source === 'speech' ? finalSummary : undefined;

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
        dashboard_snapshot: dashboardSnapshot,
        voice_summary_text: voiceSummaryText
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
      parts.push(`Drafted ${emailOutput.drafts.length} email replies (auto_send=false, review required)`);
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

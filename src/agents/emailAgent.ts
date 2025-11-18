import { generateMockEmails, MockEmail } from '../lib/mockData';

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  priority: string;
  date: string;
}

export interface EmailReply {
  to: string;
  subject: string;
  draft_snippet: string;
  full_draft: string;
}

export interface EmailAgentOutput {
  replies_sent_count: number;
  drafts: EmailReply[];
  summaries: EmailSummary[];
  top_urgent: EmailSummary[];
}

export class EmailAgent {
  private generateReply(email: MockEmail): EmailReply {
    const templates = {
      urgent: `Thank you for your email regarding "${email.subject}". I have received this and will respond with full details shortly. This is acknowledged as high priority.`,
      normal: `Thank you for reaching out. I appreciate your email about "${email.subject}" and will review it carefully. I'll get back to you within 24-48 hours.`,
      low: `Thank you for your email. I've noted the information regarding "${email.subject}" and will review it when time permits.`
    };

    const replyBody = templates[email.priority] || templates.normal;

    return {
      to: email.from,
      subject: `Re: ${email.subject}`,
      draft_snippet: replyBody.substring(0, 100) + '...',
      full_draft: replyBody
    };
  }

  async execute(emailOAuth: string | undefined, autoSend: boolean): Promise<EmailAgentOutput> {
    const mockEmails = generateMockEmails();

    const urgentEmails = mockEmails.filter(e => e.priority === 'urgent');
    const normalEmails = mockEmails.filter(e => e.priority === 'normal');

    const emailsToReply = [...urgentEmails, ...normalEmails.slice(0, 2)];

    const drafts = emailsToReply.map(email => this.generateReply(email));

    const summaries: EmailSummary[] = mockEmails.map(email => ({
      id: email.id,
      from: email.from,
      subject: email.subject,
      snippet: email.snippet,
      priority: email.priority,
      date: email.date.toISOString()
    }));

    const topUrgent = summaries
      .filter(s => s.priority === 'urgent')
      .slice(0, 5);

    return {
      replies_sent_count: autoSend ? drafts.length : 0,
      drafts,
      summaries,
      top_urgent: topUrgent
    };
  }
}

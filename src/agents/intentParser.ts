export interface ParsedIntent {
  intent: string;
  required_agents: string[];
  params: {
    timeframe?: 'today' | 'week' | 'month';
    priority?: 'urgent' | 'normal' | 'low';
    subject?: string;
    auto_send: boolean;
  };
  clarifications?: string[];
}

export class IntentParser {
  parse(userCommand: string, autoSend: boolean = false): ParsedIntent {
    const lowerCommand = userCommand.toLowerCase();
    const requiredAgents: string[] = [];
    const params: any = {
      auto_send: autoSend
    };

    if (lowerCommand.includes('email') || lowerCommand.includes('reply') || lowerCommand.includes('inbox')) {
      requiredAgents.push('EmailAgent');
    }

    if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule') || lowerCommand.includes('meeting') || lowerCommand.includes('reschedule')) {
      requiredAgents.push('CalendarAgent');
    }

    if (lowerCommand.includes('study') || lowerCommand.includes('exam') || lowerCommand.includes('midterm') || lowerCommand.includes('flashcard')) {
      requiredAgents.push('StudyAgent');
    }

    if (lowerCommand.includes('today')) {
      params.timeframe = 'today';
    } else if (lowerCommand.includes('week')) {
      params.timeframe = 'week';
    } else if (lowerCommand.includes('month')) {
      params.timeframe = 'month';
    } else {
      params.timeframe = 'week';
    }

    if (lowerCommand.includes('urgent')) {
      params.priority = 'urgent';
    } else if (lowerCommand.includes('low priority') || lowerCommand.includes('low-priority')) {
      params.priority = 'low';
    } else {
      params.priority = 'normal';
    }

    const subjectMatch = lowerCommand.match(/(?:for|about|regarding)\s+(?:my\s+)?([a-z\s]+?)(?:\s+starting|\s+exam|\s+midterm|$)/i);
    if (subjectMatch) {
      params.subject = subjectMatch[1].trim();
    }

    let intent = 'general_assist';
    if (requiredAgents.includes('EmailAgent') && requiredAgents.includes('CalendarAgent') && requiredAgents.includes('StudyAgent')) {
      intent = 'plan_week';
    } else if (requiredAgents.includes('EmailAgent')) {
      intent = 'email_management';
    } else if (requiredAgents.includes('CalendarAgent')) {
      intent = 'calendar_management';
    } else if (requiredAgents.includes('StudyAgent')) {
      intent = 'create_study_plan';
    }

    requiredAgents.push('DashboardAgent');

    return {
      intent,
      required_agents: requiredAgents,
      params
    };
  }
}

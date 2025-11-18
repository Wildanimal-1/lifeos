import { generateMockCalendarEvents, MockCalendarEvent } from '../lib/mockData';

export interface CalendarChange {
  eventId: string;
  oldSlot: string;
  newSlot: string;
  reason: string;
}

export interface CalendarAgentOutput {
  events_inspected_count: number;
  proposed_changes: CalendarChange[];
  changed_events_count: number;
  events: MockCalendarEvent[];
}

export class CalendarAgent {
  private formatTimeSlot(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return `${start.toLocaleString('en-US', options)} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private suggestDeepWorkSlot(currentDate: Date): Date {
    const slots = [
      { hour: 9, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 16, minute: 30 }
    ];

    const randomSlot = slots[Math.floor(Math.random() * slots.length)];
    const newDate = new Date(currentDate);
    newDate.setHours(randomSlot.hour, randomSlot.minute, 0, 0);

    return newDate;
  }

  async execute(calendarId: string, autoApply: boolean, timeframe: string): Promise<CalendarAgentOutput> {
    const events = generateMockCalendarEvents();

    const now = new Date();
    const endDate = new Date();
    if (timeframe === 'today') {
      endDate.setDate(endDate.getDate() + 1);
    } else if (timeframe === 'week') {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    const relevantEvents = events.filter(e => e.start >= now && e.start <= endDate);

    const lowPriorityEvents = relevantEvents.filter(e => e.priority === 'low');

    const proposedChanges: CalendarChange[] = lowPriorityEvents.map(event => {
      const newStart = this.suggestDeepWorkSlot(event.start);
      const duration = event.end.getTime() - event.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      return {
        eventId: event.id,
        oldSlot: this.formatTimeSlot(event.start, event.end),
        newSlot: this.formatTimeSlot(newStart, newEnd),
        reason: `Low priority event rescheduled to create focused deep-work block. Original slot can be used for high-value tasks.`
      };
    });

    return {
      events_inspected_count: relevantEvents.length,
      proposed_changes: proposedChanges,
      changed_events_count: autoApply ? proposedChanges.length : 0,
      events: relevantEvents
    };
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserContext {
  id: string;
  user_id: string;
  email_oauth?: string;
  calendar_id: string;
  study_notes_link?: string;
  auto_send: boolean;
  demo_mode: boolean;
  work_hours: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  agent: string;
  action: string;
  input_summary?: string;
  output_summary?: string;
  timestamp: string;
}

export interface Execution {
  id: string;
  user_id: string;
  user_command: string;
  execution_plan?: string;
  final_summary?: string;
  dashboard_snapshot?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface EmailDraft {
  id: string;
  execution_id: string;
  to_address: string;
  subject: string;
  draft_body: string;
  priority_score: number;
  sent: boolean;
  created_at: string;
}

export interface CalendarProposal {
  id: string;
  execution_id: string;
  event_id: string;
  old_slot: string;
  new_slot: string;
  reason?: string;
  applied: boolean;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  execution_id: string;
  subject: string;
  schedule: any;
  flashcards_csv?: string;
  practice_questions?: any;
  created_at: string;
}

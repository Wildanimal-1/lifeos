/*
  # LifeOS Multi-Agent System Schema

  ## Overview
  Creates the database schema for LifeOS orchestrator and agents system.

  ## New Tables
  
  ### 1. `user_contexts`
  Stores user preferences and OAuth credentials
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `email_oauth` (text) - Gmail OAuth token
  - `calendar_id` (text) - Google Calendar ID
  - `study_notes_link` (text) - Link to study materials
  - `auto_send` (boolean) - Auto-send email replies
  - `work_hours` (text) - Working hours preference
  - `timezone` (text) - User timezone
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `audit_logs`
  Records all agent actions for transparency
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `agent` (text) - Agent name
  - `action` (text) - Action performed
  - `input_summary` (text) - Input data summary
  - `output_summary` (text) - Output data summary
  - `timestamp` (timestamptz)

  ### 3. `executions`
  Tracks orchestrator execution plans and results
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `user_command` (text) - Original command
  - `execution_plan` (text) - Generated plan
  - `final_summary` (text) - Execution summary
  - `dashboard_snapshot` (jsonb) - Complete output
  - `status` (text) - pending/running/completed/failed
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 4. `email_drafts`
  Stores drafted email replies
  - `id` (uuid, primary key)
  - `execution_id` (uuid, references executions)
  - `to_address` (text)
  - `subject` (text)
  - `draft_body` (text)
  - `priority_score` (integer)
  - `sent` (boolean)
  - `created_at` (timestamptz)

  ### 5. `calendar_proposals`
  Stores calendar rescheduling proposals
  - `id` (uuid, primary key)
  - `execution_id` (uuid, references executions)
  - `event_id` (text)
  - `old_slot` (text)
  - `new_slot` (text)
  - `reason` (text)
  - `applied` (boolean)
  - `created_at` (timestamptz)

  ### 6. `study_plans`
  Stores generated study schedules and materials
  - `id` (uuid, primary key)
  - `execution_id` (uuid, references executions)
  - `subject` (text)
  - `schedule` (jsonb)
  - `flashcards_csv` (text)
  - `practice_questions` (jsonb)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users only
*/

-- Create user_contexts table
CREATE TABLE IF NOT EXISTS user_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_oauth text,
  calendar_id text DEFAULT 'primary',
  study_notes_link text,
  auto_send boolean DEFAULT false,
  work_hours text DEFAULT '09:00-18:00',
  timezone text DEFAULT 'Asia/Kolkata',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context"
  ON user_contexts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context"
  ON user_contexts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context"
  ON user_contexts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent text NOT NULL,
  action text NOT NULL,
  input_summary text,
  output_summary text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create executions table
CREATE TABLE IF NOT EXISTS executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_command text NOT NULL,
  execution_plan text,
  final_summary text,
  dashboard_snapshot jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own executions"
  ON executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions"
  ON executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions"
  ON executions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create email_drafts table
CREATE TABLE IF NOT EXISTS email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES executions(id) ON DELETE CASCADE NOT NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  draft_body text NOT NULL,
  priority_score integer DEFAULT 0,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read drafts from own executions"
  ON email_drafts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = email_drafts.execution_id
      AND executions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert drafts for own executions"
  ON email_drafts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = email_drafts.execution_id
      AND executions.user_id = auth.uid()
    )
  );

-- Create calendar_proposals table
CREATE TABLE IF NOT EXISTS calendar_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES executions(id) ON DELETE CASCADE NOT NULL,
  event_id text NOT NULL,
  old_slot text NOT NULL,
  new_slot text NOT NULL,
  reason text,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read proposals from own executions"
  ON calendar_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = calendar_proposals.execution_id
      AND executions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert proposals for own executions"
  ON calendar_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = calendar_proposals.execution_id
      AND executions.user_id = auth.uid()
    )
  );

-- Create study_plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES executions(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  schedule jsonb NOT NULL,
  flashcards_csv text,
  practice_questions jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read study plans from own executions"
  ON study_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = study_plans.execution_id
      AND executions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert study plans for own executions"
  ON study_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM executions
      WHERE executions.id = study_plans.execution_id
      AND executions.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_drafts_execution_id ON email_drafts(execution_id);
CREATE INDEX IF NOT EXISTS idx_calendar_proposals_execution_id ON calendar_proposals(execution_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_execution_id ON study_plans(execution_id);
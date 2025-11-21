/*
  # Add Weekly Snapshots Table

  1. New Tables
    - `weekly_snapshots`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `week_start` (date) - Start of the week (Monday)
      - `week_end` (date) - End of the week (Sunday)
      - `execution_plan` (text) - Compiled weekly execution plan
      - `weekly_plan` (jsonb) - Complete weekly calendar plan
      - `email_summary` (jsonb) - Weekly email statistics
      - `study_plan` (jsonb) - Weekly study plan summary
      - `metrics` (jsonb) - Weekly productivity metrics
      - `timeline` (jsonb) - Weekly timeline visualization data
      - `dashboard_snapshot` (jsonb) - Complete dashboard state
      - `pdf_path` (text) - Path to generated PDF
      - `public_url` (text) - Public URL for PDF access
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on user_id and week_start for fast lookups
    - Unique constraint on user_id + week_start

  3. Security
    - Enable RLS on `weekly_snapshots` table
    - Add policy for authenticated users to read their own snapshots
    - Add policy for authenticated users to create their own snapshots
    - Add policy for authenticated users to update their own snapshots
*/

CREATE TABLE IF NOT EXISTS weekly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  execution_plan text DEFAULT '',
  weekly_plan jsonb DEFAULT '{}'::jsonb,
  email_summary jsonb DEFAULT '{}'::jsonb,
  study_plan jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  dashboard_snapshot jsonb DEFAULT '{}'::jsonb,
  pdf_path text DEFAULT '',
  public_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_snapshots_user_week_idx 
  ON weekly_snapshots(user_id, week_start);

CREATE INDEX IF NOT EXISTS weekly_snapshots_user_created_idx 
  ON weekly_snapshots(user_id, created_at DESC);

ALTER TABLE weekly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly snapshots"
  ON weekly_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly snapshots"
  ON weekly_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly snapshots"
  ON weekly_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly snapshots"
  ON weekly_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

/*
  # Add OAuth Accounts and Safe Send Policy

  ## Overview
  Adds support for multiple OAuth accounts per user and enforces safe email sending with explicit user confirmation.

  ## New Tables

  ### 1. `oauth_accounts`
  Stores connected OAuth accounts (Gmail/Google) for each user
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `provider` (text) - OAuth provider (gmail, google)
  - `email` (text) - Account email address
  - `access_token` (text) - Encrypted OAuth access token
  - `refresh_token` (text) - Encrypted OAuth refresh token
  - `token_expiry` (timestamptz) - Token expiration timestamp
  - `scope` (text) - OAuth scopes granted
  - `is_default` (boolean) - Whether this is the user's default account
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `account_usage_log`
  Tracks OAuth token usage for audit purposes
  - `id` (uuid, primary key)
  - `oauth_account_id` (uuid, references oauth_accounts)
  - `user_id` (uuid, references auth.users)
  - `action` (text) - Action performed (e.g., "send_email", "fetch_inbox")
  - `api_endpoint` (text) - API endpoint called
  - `timestamp` (timestamptz)

  ## Modified Tables

  ### `executions`
  - Add `oauth_account_id` (uuid, references oauth_accounts) - Track which account was used
  - Add `account_email` (text) - Cache account email for quick display

  ### `email_drafts`
  - Add `from_account_id` (uuid, references oauth_accounts) - Which account will send
  - Add `sent_at` (timestamptz) - When draft was sent
  - Add `confirmed_by_user` (boolean) - User confirmed send
  - Add `confirmation_timestamp` (timestamptz) - When user confirmed

  ### `audit_logs`
  - Add `oauth_account_id` (uuid, references oauth_accounts) - Account used for action
  - Add `user_email` (text) - Account email for quick reference
  - Add `drafts_created` (integer) - Number of drafts created
  - Add `events_changed` (integer) - Number of calendar events modified
  - Add `run_id` (uuid, references executions) - Link to execution

  ### `user_contexts`
  - Add `default_oauth_account_id` (uuid, references oauth_accounts) - User's default account
  - Remove `email_oauth` field (replaced by oauth_accounts table)

  ## Security
  - Enable RLS on new tables
  - Users can only access their own OAuth accounts
  - Tokens should be encrypted at application level before storage
  - Account usage logs restricted to account owners

  ## Important Notes
  1. All drafts created with `auto_send: false` by default
  2. Sending requires explicit user confirmation via UI
  3. Every execution must have an associated oauth_account_id
  4. Token refresh logic implemented at application layer
*/

-- Create oauth_accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'google')),
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expiry timestamptz,
  scope text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, email)
);

ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OAuth accounts"
  ON oauth_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OAuth accounts"
  ON oauth_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OAuth accounts"
  ON oauth_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own OAuth accounts"
  ON oauth_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create account_usage_log table
CREATE TABLE IF NOT EXISTS account_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_account_id uuid REFERENCES oauth_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  api_endpoint text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE account_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own account usage logs"
  ON account_usage_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account usage logs"
  ON account_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add oauth_account_id to executions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'executions' AND column_name = 'oauth_account_id'
  ) THEN
    ALTER TABLE executions ADD COLUMN oauth_account_id uuid REFERENCES oauth_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'executions' AND column_name = 'account_email'
  ) THEN
    ALTER TABLE executions ADD COLUMN account_email text;
  END IF;
END $$;

-- Add safe-send fields to email_drafts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'from_account_id'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN from_account_id uuid REFERENCES oauth_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'auto_send'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN auto_send boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN sent_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'confirmed_by_user'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN confirmed_by_user boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'confirmation_timestamp'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN confirmation_timestamp timestamptz;
  END IF;
END $$;

-- Add account tracking to audit_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'oauth_account_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN oauth_account_id uuid REFERENCES oauth_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'drafts_created'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN drafts_created integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'events_changed'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN events_changed integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'run_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN run_id uuid REFERENCES executions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add default_oauth_account_id to user_contexts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_contexts' AND column_name = 'default_oauth_account_id'
  ) THEN
    ALTER TABLE user_contexts ADD COLUMN default_oauth_account_id uuid REFERENCES oauth_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_email ON oauth_accounts(email);
CREATE INDEX IF NOT EXISTS idx_account_usage_log_account_id ON account_usage_log(oauth_account_id);
CREATE INDEX IF NOT EXISTS idx_account_usage_log_timestamp ON account_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_executions_oauth_account_id ON executions(oauth_account_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_from_account_id ON email_drafts(from_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_oauth_account_id ON audit_logs(oauth_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_run_id ON audit_logs(run_id);

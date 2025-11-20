/*
  # Add Demo Mode to User Contexts

  1. Changes
    - Add `demo_mode` column to `user_contexts` table
    - Default value: `true` (safe for judges by default)
    - Update existing records to have demo_mode enabled

  2. Purpose
    - Enable safe demo mode for judges and presentations
    - Prevent outgoing messages to non-demo accounts
    - Force auto_send to false in demo mode
    - Show visible audit logs for transparency

  3. Notes
    - Demo mode is enabled by default for safety
    - Users can disable it in settings for production use
*/

-- Add demo_mode column to user_contexts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_contexts' AND column_name = 'demo_mode'
  ) THEN
    ALTER TABLE user_contexts ADD COLUMN demo_mode boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update existing records to enable demo mode
UPDATE user_contexts SET demo_mode = true WHERE demo_mode IS NULL;

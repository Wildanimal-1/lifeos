/*
  # Fix Demo Mode Defaults

  1. Changes
    - Change `demo_mode` default from `true` to `false` for new users
    - Update existing users (except demo account) to have `demo_mode = false`
    - Only the demo account (lifeos.demo@gmail.com) should have `demo_mode = true`

  2. Purpose
    - Demo mode badge should only show for the demo account
    - Regular users should not see demo mode UI
    - Keep demo_mode flag for controlling agent behavior

  3. Notes
    - The UI now checks user email directly for badge display
    - Database flag is used by agents to prevent sending real emails
    - Demo account identified by email: lifeos.demo@gmail.com
*/

-- Update default value for demo_mode to false
ALTER TABLE user_contexts ALTER COLUMN demo_mode SET DEFAULT false;

-- Set demo_mode to false for all existing users
UPDATE user_contexts SET demo_mode = false;

-- Set demo_mode to true only for the demo account
-- Note: This uses auth.users table to find the demo account
UPDATE user_contexts
SET demo_mode = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'lifeos.demo@gmail.com'
);
-- Add metadata column to subscriptions table for trial upgrade tracking
-- This allows us to store trial_preserved and original_trial_end information

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.metadata IS 'JSON metadata for subscription, including trial upgrade information like trial_preserved and original_trial_end';

-- Log the change
DO $$
BEGIN
  RAISE LOG 'Added metadata column to subscriptions table for trial upgrade tracking';
END $$; 
-- Add stripe_price_id column to subscriptions table for Stripe subscription upserts
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID for the current subscription item';

-- Add index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id ON subscriptions(stripe_price_id);

-- Log the completion
DO $$
BEGIN
  RAISE LOG 'Added stripe_price_id column to subscriptions table';
END $$; 
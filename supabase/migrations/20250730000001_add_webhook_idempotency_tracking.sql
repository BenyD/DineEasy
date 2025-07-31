-- Add webhook events table for idempotency tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  error_message TEXT,
  created_at_utc TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- Add RLS policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role can manage webhook events
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add unique partial index to prevent duplicate active subscriptions per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS unique_restaurant_active_subscription 
ON subscriptions (restaurant_id, status) 
WHERE status IN ('active', 'trialing');

-- Add column to track Stripe account deletion
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS stripe_account_deleted BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_deleted ON restaurants(stripe_account_deleted);

-- Add comment for documentation
COMMENT ON TABLE webhook_events IS 'Tracks Stripe webhook events for idempotency and audit purposes';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID for idempotency';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: processing, processed, failed';
COMMENT ON COLUMN restaurants.stripe_account_deleted IS 'Indicates if Stripe Connect account was deleted'; 
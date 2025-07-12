-- Consolidate subscription migrations only (restaurant paying platform)
-- This migration handles subscriptions for restaurants paying DineEasy platform
-- NOTE: Stripe Connect (customer payments to restaurant) are handled separately

-- 0. Drop ALL existing subscription related objects to avoid conflicts
-- Functions
DROP FUNCTION IF EXISTS get_restaurant_by_stripe_customer(text) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_by_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_restaurant_subscription_status(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS complete_restaurant_onboarding(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS upsert_subscription(text, uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, jsonb) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_stripe_status(uuid) CASCADE;

-- Policies
DROP POLICY IF EXISTS "Allow admin access to subscriptions" ON subscriptions;

-- Indexes (we'll recreate them)
DROP INDEX IF EXISTS idx_restaurants_stripe_customer_id;
DROP INDEX IF EXISTS idx_restaurants_subscription_status;
DROP INDEX IF EXISTS idx_restaurants_onboarding_completed;

-- 1. Ensure all required subscription columns exist (RESTAURANT PAYING PLATFORM)
DO $$
BEGIN
    -- Subscription fields (restaurant paying platform)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_customer_id text;
        RAISE LOG 'Added stripe_customer_id column for subscription payments';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN subscription_status text default 'incomplete';
        RAISE LOG 'Added subscription_status column';
    END IF;

    -- General onboarding field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN onboarding_completed boolean default false;
        RAISE LOG 'Added onboarding_completed column';
    END IF;
END $$;

-- 2. Ensure subscriptions table has all required columns
DO $$
BEGIN
    -- Add stripe_price_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN stripe_price_id text;
        RAISE LOG 'Added stripe_price_id column to subscriptions table';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
        RAISE LOG 'Added metadata column to subscriptions table';
    END IF;

    -- Ensure stripe_subscription_id has a unique constraint for upsert functionality
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'subscriptions' 
        AND constraint_name = 'subscriptions_stripe_subscription_id_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
        RAISE LOG 'Added unique constraint on stripe_subscription_id';
    END IF;

    -- Ensure the table has the correct primary key structure
    -- Check if we need to fix the ID column structure
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'internal_id'
    ) THEN
        -- Drop the internal_id column and make stripe_subscription_id the primary key
        ALTER TABLE subscriptions DROP COLUMN IF EXISTS internal_id;
        ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
        ALTER TABLE subscriptions ADD PRIMARY KEY (stripe_subscription_id);
        RAISE LOG 'Fixed subscriptions table primary key structure';
    END IF;

    -- Add check constraint for timestamps if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'subscriptions' 
        AND constraint_name = 'check_subscription_timestamps'
        AND constraint_type = 'CHECK'
    ) THEN
        ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_timestamps
        CHECK (
            current_period_start IS NOT NULL OR 
            current_period_end IS NOT NULL OR 
            trial_start IS NOT NULL OR 
            trial_end IS NOT NULL
        );
        RAISE LOG 'Added check_subscription_timestamps constraint';
    END IF;
END $$;

-- 3. Create comprehensive indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer_id ON restaurants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_onboarding_completed ON restaurants(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id ON subscriptions(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id ON subscriptions(restaurant_id);

-- 4. Core Subscription Functions (RESTAURANT PAYING PLATFORM)

-- Function to find restaurant by Stripe customer ID (for subscription webhooks)
CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_customer(p_stripe_customer_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_customer_id text,
  subscription_status text
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_customer_id,
    r.subscription_status
  FROM restaurants r
  WHERE r.stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get restaurant by ID (for webhook validation)
CREATE OR REPLACE FUNCTION get_restaurant_by_id(p_restaurant_id uuid)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_customer_id text,
  subscription_status text
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_customer_id,
    r.subscription_status
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update restaurant subscription status
CREATE OR REPLACE FUNCTION update_restaurant_subscription_status(
  p_restaurant_id uuid,
  p_subscription_status text,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    subscription_status = p_subscription_status,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  -- Update stripe_customer_id if provided
  IF p_stripe_customer_id IS NOT NULL THEN
    UPDATE restaurants
    SET
      stripe_customer_id = p_stripe_customer_id,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete restaurant onboarding
CREATE OR REPLACE FUNCTION complete_restaurant_onboarding(
  p_restaurant_id uuid,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_account_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    onboarding_completed = true,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  -- Update Stripe customer ID if provided
  IF p_stripe_customer_id IS NOT NULL THEN
    UPDATE restaurants
    SET
      stripe_customer_id = p_stripe_customer_id,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
  
  -- Update Stripe account ID if provided
  IF p_stripe_account_id IS NOT NULL THEN
    UPDATE restaurants
    SET
      stripe_account_id = p_stripe_account_id,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert subscription (for webhook processing)
-- This function matches the webhook call signature exactly
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_stripe_subscription_id text,
  p_restaurant_id uuid,
  p_plan text,
  p_interval text,
  p_status text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_current_period_start timestamp with time zone,
  p_current_period_end timestamp with time zone,
  p_trial_start timestamp with time zone,
  p_trial_end timestamp with time zone,
  p_cancel_at timestamp with time zone,
  p_canceled_at timestamp with time zone,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_current_time timestamp with time zone := now();
  v_has_timestamps boolean := false;
BEGIN
  SET search_path = public;
  
  -- Check if we have any timestamps to satisfy the constraint
  v_has_timestamps := (
    p_current_period_start IS NOT NULL OR 
    p_current_period_end IS NOT NULL OR 
    p_trial_start IS NOT NULL OR 
    p_trial_end IS NOT NULL
  );
  
  -- If no timestamps are provided, use current time as fallback
  IF NOT v_has_timestamps THEN
    p_current_period_start := v_current_time;
    p_current_period_end := v_current_time + interval '1 month';
  END IF;
  
  -- For trial subscriptions, use trial timestamps as fallbacks for current period
  IF p_status = 'trialing' THEN
    IF p_current_period_start IS NULL AND p_trial_start IS NOT NULL THEN
      p_current_period_start := p_trial_start;
    END IF;
    IF p_current_period_end IS NULL AND p_trial_end IS NOT NULL THEN
      p_current_period_end := p_trial_end;
    END IF;
  END IF;
  
  -- Final fallback: ensure we have at least current_period_start
  IF p_current_period_start IS NULL THEN
    p_current_period_start := v_current_time;
  END IF;
  IF p_current_period_end IS NULL THEN
    p_current_period_end := p_current_period_start + interval '1 month';
  END IF;
  
  INSERT INTO subscriptions (
    id,
    restaurant_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan,
    interval,
    status,
    stripe_price_id,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end,
    cancel_at,
    canceled_at,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_restaurant_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_plan::subscription_plan,
    p_interval::subscription_interval,
    p_status,
    p_stripe_price_id,
    p_current_period_start,
    p_current_period_end,
    p_trial_start,
    p_trial_end,
    p_cancel_at,
    p_canceled_at,
    p_metadata,
    now(),
    now()
  )
  ON CONFLICT (stripe_subscription_id)
  DO UPDATE SET
    plan = EXCLUDED.plan,
    interval = EXCLUDED.interval,
    status = EXCLUDED.status,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    cancel_at = EXCLUDED.cancel_at,
    canceled_at = EXCLUDED.canceled_at,
    metadata = EXCLUDED.metadata,
    updated_at = now();
    
  -- Update restaurant subscription status
  UPDATE restaurants
  SET
    subscription_status = p_status,
    stripe_customer_id = p_stripe_customer_id,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive subscription status only
CREATE OR REPLACE FUNCTION get_restaurant_subscription_status(p_restaurant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  stripe_customer_id text,
  subscription_status text,
  has_subscription boolean,
  onboarding_completed boolean
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.email,
    r.stripe_customer_id,
    r.subscription_status,
    COALESCE(r.subscription_status IN ('active', 'trialing'), false) as has_subscription,
    COALESCE(r.onboarding_completed, false) as onboarding_completed
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create comprehensive view for subscription overview only
CREATE OR REPLACE VIEW restaurant_subscription_overview AS
SELECT
  r.id,
  r.name,
  r.email,
  -- Subscription status (restaurant paying platform)
  r.stripe_customer_id,
  r.subscription_status,
  CASE WHEN r.subscription_status IN ('active', 'trialing') THEN true ELSE false END as has_active_subscription,
  -- Onboarding status
  r.onboarding_completed,
  -- Timestamps
  r.created_at,
  r.updated_at
FROM restaurants r;

-- 6. Add RLS policies for subscriptions
CREATE POLICY "Allow admin access to subscriptions" ON subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Grant necessary permissions for subscription functions
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_customer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_subscription_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_restaurant_onboarding(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_subscription(text, uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_subscription_status(uuid) TO authenticated;

-- 8. Add comprehensive comments for subscription documentation
COMMENT ON COLUMN restaurants.stripe_customer_id IS 'Stripe customer ID for subscription payments (restaurant paying platform)';
COMMENT ON COLUMN restaurants.subscription_status IS 'Current subscription status: incomplete, pending, active, trialing, canceled, etc.';
COMMENT ON COLUMN restaurants.onboarding_completed IS 'Whether the restaurant has completed the full onboarding process';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID for the current subscription item';
COMMENT ON COLUMN subscriptions.metadata IS 'JSON metadata for subscription, including trial upgrade information';

COMMENT ON FUNCTION get_restaurant_by_stripe_customer(text) IS 'Find restaurant by Stripe customer ID for subscription webhooks';
COMMENT ON FUNCTION get_restaurant_by_id(uuid) IS 'Get restaurant by ID for webhook validation';
COMMENT ON FUNCTION update_restaurant_subscription_status(uuid, text, text) IS 'Update restaurant subscription status and optionally Stripe customer ID';
COMMENT ON FUNCTION complete_restaurant_onboarding(uuid, text, text) IS 'Mark restaurant onboarding as completed and optionally update Stripe IDs';
COMMENT ON FUNCTION upsert_subscription(text, uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, jsonb) IS 'Upsert subscription record and update restaurant status';
COMMENT ON FUNCTION get_restaurant_subscription_status(uuid) IS 'Get comprehensive subscription status for a restaurant';

-- 9. Log completion
DO $$
BEGIN
  RAISE LOG 'Subscription consolidation migration completed successfully';
  RAISE LOG 'All subscription functions, views, and policies have been recreated';
  RAISE LOG 'Subscriptions table schema is now consistent with webhook expectations';
  RAISE LOG 'NOTE: Stripe Connect (customer payments to restaurant) are handled separately';
END $$; 
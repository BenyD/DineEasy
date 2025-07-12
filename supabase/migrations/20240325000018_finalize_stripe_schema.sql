-- Finalize Stripe schema for restaurants table
-- This migration ensures all Stripe-related fields are properly set up for both
-- subscriptions (restaurant paying platform) and Stripe Connect (customers paying restaurant)

-- 1. Ensure all required Stripe columns exist with proper defaults
DO $$
BEGIN
    -- Subscription-related fields (restaurant paying platform)
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

    -- Stripe Connect fields (customers paying restaurant)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_id text;
        RAISE LOG 'Added stripe_account_id column for Stripe Connect';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_enabled'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_enabled boolean default false;
        RAISE LOG 'Added stripe_account_enabled column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_requirements'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_requirements jsonb;
        RAISE LOG 'Added stripe_account_requirements column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_created_at'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_created_at timestamp with time zone;
        RAISE LOG 'Added stripe_account_created_at column';
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

-- 2. Create comprehensive indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer_id ON restaurants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id ON restaurants(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_onboarding_completed ON restaurants(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_enabled ON restaurants(stripe_account_enabled);

-- 3. Create comprehensive function to get restaurant Stripe status
CREATE OR REPLACE FUNCTION get_restaurant_stripe_status(p_restaurant_id uuid)
RETURNS TABLE (
  restaurant_id uuid,
  restaurant_name text,
  -- Subscription fields (restaurant paying platform)
  stripe_customer_id text,
  subscription_status text,
  -- Stripe Connect fields (customers paying restaurant)
  stripe_account_id text,
  stripe_account_enabled boolean,
  stripe_account_requirements jsonb,
  stripe_account_created_at timestamp with time zone,
  -- General
  onboarding_completed boolean,
  -- Computed fields
  has_subscription boolean,
  has_stripe_connect boolean,
  can_accept_payments boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    -- Subscription fields
    r.stripe_customer_id,
    r.subscription_status,
    -- Stripe Connect fields
    r.stripe_account_id,
    r.stripe_account_enabled,
    r.stripe_account_requirements,
    r.stripe_account_created_at,
    -- General
    r.onboarding_completed,
    -- Computed fields
    CASE WHEN r.stripe_customer_id IS NOT NULL AND r.subscription_status IN ('active', 'trialing') THEN true ELSE false END as has_subscription,
    CASE WHEN r.stripe_account_id IS NOT NULL THEN true ELSE false END as has_stripe_connect,
    CASE WHEN r.stripe_account_id IS NOT NULL AND r.stripe_account_enabled = true THEN true ELSE false END as can_accept_payments
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to update restaurant subscription status
CREATE OR REPLACE FUNCTION update_restaurant_subscription_status(
  p_restaurant_id uuid,
  p_subscription_status text,
  p_stripe_customer_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
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
  
  RAISE LOG 'Updated restaurant % subscription status to %', p_restaurant_id, p_subscription_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to update Stripe Connect status
CREATE OR REPLACE FUNCTION update_restaurant_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_stripe_account_enabled boolean,
  p_stripe_account_requirements jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_stripe_account_enabled,
    stripe_account_requirements = COALESCE(p_stripe_account_requirements, stripe_account_requirements),
    stripe_account_created_at = CASE 
      WHEN stripe_account_created_at IS NULL THEN now()
      ELSE stripe_account_created_at
    END,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  RAISE LOG 'Updated restaurant % Stripe Connect status: account_id=%, enabled=%', 
    p_restaurant_id, p_stripe_account_id, p_stripe_account_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to complete restaurant onboarding
CREATE OR REPLACE FUNCTION complete_restaurant_onboarding(
  p_restaurant_id uuid,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_account_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
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
  
  RAISE LOG 'Completed onboarding for restaurant %', p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_restaurant_stripe_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_subscription_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_stripe_connect_status(uuid, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_restaurant_onboarding(uuid, text, text) TO authenticated;

-- 8. Add comprehensive comments for documentation
COMMENT ON COLUMN restaurants.stripe_customer_id IS 'Stripe customer ID for subscription payments (restaurant paying platform)';
COMMENT ON COLUMN restaurants.subscription_status IS 'Current subscription status: incomplete, pending, active, trialing, canceled, etc.';
COMMENT ON COLUMN restaurants.stripe_account_id IS 'Stripe Connect account ID for receiving customer payments';
COMMENT ON COLUMN restaurants.stripe_account_enabled IS 'Whether the Stripe Connect account can accept charges';
COMMENT ON COLUMN restaurants.stripe_account_requirements IS 'Stripe Connect account verification requirements and status';
COMMENT ON COLUMN restaurants.stripe_account_created_at IS 'When the Stripe Connect account was created';
COMMENT ON COLUMN restaurants.onboarding_completed IS 'Whether the restaurant has completed the full onboarding process';

COMMENT ON FUNCTION get_restaurant_stripe_status(uuid) IS 'Get comprehensive Stripe status for a restaurant including subscription and Connect status';
COMMENT ON FUNCTION update_restaurant_subscription_status(uuid, text, text) IS 'Update restaurant subscription status and optionally Stripe customer ID';
COMMENT ON FUNCTION update_restaurant_stripe_connect_status(uuid, text, boolean, jsonb) IS 'Update restaurant Stripe Connect account status';
COMMENT ON FUNCTION complete_restaurant_onboarding(uuid, text, text) IS 'Mark restaurant onboarding as completed and optionally update Stripe IDs';

-- 9. Create a view for easy Stripe status queries
CREATE OR REPLACE VIEW restaurant_stripe_overview AS
SELECT
  r.id,
  r.name,
  r.email,
  -- Subscription status
  r.stripe_customer_id,
  r.subscription_status,
  CASE WHEN r.subscription_status IN ('active', 'trialing') THEN true ELSE false END as has_active_subscription,
  -- Stripe Connect status
  r.stripe_account_id,
  r.stripe_account_enabled,
  CASE WHEN r.stripe_account_id IS NOT NULL THEN true ELSE false END as has_stripe_connect,
  CASE WHEN r.stripe_account_enabled = true THEN true ELSE false END as can_accept_payments,
  -- Onboarding status
  r.onboarding_completed,
  -- Timestamps
  r.created_at,
  r.updated_at
FROM restaurants r;

-- 10. Log completion
DO $$
BEGIN
  RAISE LOG 'Finalized Stripe schema for restaurants table';
  RAISE LOG 'Added comprehensive functions and views for Stripe management';
  RAISE LOG 'Separated subscription payments (restaurant->platform) from Stripe Connect (customers->restaurant)';
END $$; 
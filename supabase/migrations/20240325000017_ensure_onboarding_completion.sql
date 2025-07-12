-- Ensure proper onboarding completion with all Stripe data
-- This migration ensures the database can properly handle onboarding completion

-- 1. Ensure all required columns exist for onboarding completion
DO $$
BEGIN
    -- Add stripe_customer_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_customer_id text;
    END IF;

    -- Add onboarding_completed if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN onboarding_completed boolean default false;
    END IF;

    -- Add subscription_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN subscription_status text default 'incomplete';
    END IF;
END $$;

-- 2. Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer_id ON restaurants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_onboarding_completed ON restaurants(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);

-- 3. Create function to update restaurant onboarding status
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS update_restaurant_onboarding_completion(uuid, text, boolean);

CREATE OR REPLACE FUNCTION update_restaurant_onboarding_completion(
  p_restaurant_id uuid,
  p_stripe_customer_id text DEFAULT NULL,
  p_onboarding_completed boolean DEFAULT true
)
RETURNS void AS $$
BEGIN
  -- Add debug logging
  RAISE LOG 'Updating restaurant % onboarding completion with stripe_customer_id: %', 
    p_restaurant_id, p_stripe_customer_id;
  
  UPDATE restaurants
  SET
    onboarding_completed = p_onboarding_completed,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  -- If stripe_customer_id is provided, update it as well
  IF p_stripe_customer_id IS NOT NULL THEN
    UPDATE restaurants
    SET
      stripe_customer_id = p_stripe_customer_id,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
  
  -- Log the result
  IF NOT FOUND THEN
    RAISE LOG 'No restaurant found to update with id: %', p_restaurant_id;
  ELSE
    RAISE LOG 'Successfully updated restaurant % onboarding completion', p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to verify restaurant Stripe data integrity
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS verify_restaurant_stripe_data(uuid);

CREATE OR REPLACE FUNCTION verify_restaurant_stripe_data(p_restaurant_id uuid)
RETURNS TABLE (
  restaurant_id uuid,
  restaurant_name text,
  stripe_customer_id text,
  stripe_account_id text,
  subscription_status text,
  onboarding_completed boolean,
  has_valid_customer boolean,
  has_valid_account boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.stripe_customer_id,
    r.stripe_account_id,
    r.subscription_status,
    r.onboarding_completed,
    CASE WHEN r.stripe_customer_id IS NOT NULL THEN true ELSE false END as has_valid_customer,
    CASE WHEN r.stripe_account_id IS NOT NULL THEN true ELSE false END as has_valid_account
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get restaurant by Stripe customer ID (if not exists)
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_restaurant_by_stripe_customer(text);

CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_customer(p_stripe_customer_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_customer_id text,
  stripe_account_id text,
  stripe_account_enabled boolean,
  subscription_status text,
  onboarding_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_customer_id,
    r.stripe_account_id,
    r.stripe_account_enabled,
    r.subscription_status,
    r.onboarding_completed
  FROM restaurants r
  WHERE r.stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION update_restaurant_onboarding_completion(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_restaurant_stripe_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_customer(text) TO authenticated;

-- 7. Add comments for documentation
COMMENT ON FUNCTION update_restaurant_onboarding_completion(uuid, text, boolean) IS 'Update restaurant onboarding completion status and optionally Stripe customer ID';
COMMENT ON FUNCTION verify_restaurant_stripe_data(uuid) IS 'Verify restaurant Stripe data integrity and completeness';
COMMENT ON FUNCTION get_restaurant_by_stripe_customer(text) IS 'Get restaurant by Stripe customer ID with comprehensive data';

-- 8. Log the completion
DO $$
BEGIN
  RAISE LOG 'Onboarding completion migration completed';
  RAISE LOG 'All necessary functions and indexes are now in place';
END $$; 
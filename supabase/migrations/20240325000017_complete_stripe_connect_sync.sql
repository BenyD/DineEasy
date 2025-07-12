-- Complete Stripe Connect synchronization and edge case handling
-- This migration ensures all webhook events and database functions are properly set up

-- 0. Drop any existing functions and views that might conflict
-- This ensures clean recreation of all functions and views
DROP FUNCTION IF EXISTS get_restaurant_stripe_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS handle_stripe_account_deauthorization(text) CASCADE;
DROP FUNCTION IF EXISTS refresh_stripe_account_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_stripe_connect_setup(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_payment_stats(uuid, integer) CASCADE;
DROP VIEW IF EXISTS restaurant_stripe_overview CASCADE;

-- 1. Ensure all Stripe Connect functions are properly created with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_account(p_stripe_account_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_account_enabled boolean
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_account_id,
    r.stripe_account_enabled
  FROM restaurants r
  WHERE r.stripe_account_id = p_stripe_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enhanced update function with better error handling
CREATE OR REPLACE FUNCTION update_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_charges_enabled boolean,
  p_requirements jsonb
)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_charges_enabled,
    stripe_account_requirements = p_requirements,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurant with id % not found', p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get comprehensive Stripe status
CREATE OR REPLACE FUNCTION get_restaurant_stripe_status(p_restaurant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  stripe_customer_id text,
  subscription_status text,
  stripe_account_id text,
  stripe_account_enabled boolean,
  stripe_account_requirements jsonb,
  has_subscription boolean,
  has_stripe_connect boolean,
  can_accept_payments boolean,
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
    r.stripe_account_id,
    r.stripe_account_enabled,
    r.stripe_account_requirements,
    COALESCE(r.subscription_status IN ('active', 'trialing'), false) as has_subscription,
    COALESCE(r.stripe_account_id IS NOT NULL, false) as has_stripe_connect,
    COALESCE(r.stripe_account_enabled, false) as can_accept_payments,
    COALESCE(r.onboarding_completed, false) as onboarding_completed
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to handle account deauthorization
CREATE OR REPLACE FUNCTION handle_stripe_account_deauthorization(p_stripe_account_id text)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    stripe_account_enabled = false,
    stripe_account_requirements = jsonb_build_object(
      'disabled', true,
      'reason', 'deauthorized',
      'deauthorized_at', now()
    ),
    updated_at = now()
  WHERE stripe_account_id = p_stripe_account_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'No restaurant found for deauthorized account: %', p_stripe_account_id;
  ELSE
    RAISE LOG 'Successfully disabled deauthorized account: %', p_stripe_account_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to refresh account status from Stripe
CREATE OR REPLACE FUNCTION refresh_stripe_account_status(p_restaurant_id uuid)
RETURNS TABLE (
  charges_enabled boolean,
  payouts_enabled boolean,
  details_submitted boolean,
  requirements jsonb
) AS $$
DECLARE
  v_stripe_account_id text;
BEGIN
  SET search_path = public;
  
  -- Get the Stripe account ID
  SELECT stripe_account_id INTO v_stripe_account_id
  FROM restaurants
  WHERE id = p_restaurant_id;
  
  IF v_stripe_account_id IS NULL THEN
    RAISE EXCEPTION 'No Stripe account found for restaurant %', p_restaurant_id;
  END IF;
  
  -- Note: This function would need to be called from application code
  -- that has access to the Stripe API to actually fetch the status
  -- For now, we return the stored status
  
  RETURN QUERY
  SELECT
    r.stripe_account_enabled as charges_enabled,
    COALESCE((r.stripe_account_requirements->>'payouts_enabled')::boolean, false) as payouts_enabled,
    COALESCE((r.stripe_account_requirements->>'details_submitted')::boolean, false) as details_submitted,
    r.stripe_account_requirements as requirements
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id ON restaurants(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer_id ON restaurants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_enabled ON restaurants(stripe_account_enabled);

-- 7. Create a view for comprehensive Stripe overview
CREATE OR REPLACE VIEW restaurant_stripe_overview AS
SELECT
  r.id,
  r.name,
  r.email,
  r.stripe_customer_id,
  r.subscription_status,
  r.stripe_account_id,
  r.stripe_account_enabled,
  r.stripe_account_requirements,
  r.onboarding_completed,
  CASE 
    WHEN r.subscription_status IN ('active', 'trialing') THEN true 
    ELSE false 
  END as has_active_subscription,
  CASE 
    WHEN r.stripe_account_id IS NOT NULL THEN true 
    ELSE false 
  END as has_stripe_connect,
  CASE 
    WHEN r.stripe_account_enabled = true THEN true 
    ELSE false 
  END as can_accept_payments,
  CASE 
    WHEN r.onboarding_completed = true THEN true 
    ELSE false 
  END as onboarding_completed
FROM restaurants r;

-- 8. Add RLS policies for the new functions
DROP POLICY IF EXISTS "Users can view their own restaurant stripe status" ON restaurants;
CREATE POLICY "Users can view their own restaurant stripe status" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own restaurant stripe status" ON restaurants;
CREATE POLICY "Users can update their own restaurant stripe status" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_account(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_stripe_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_stripe_account_deauthorization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_stripe_account_status(uuid) TO authenticated;

-- 10. Create a function to validate Stripe Connect setup
CREATE OR REPLACE FUNCTION validate_stripe_connect_setup(p_restaurant_id uuid)
RETURNS TABLE (
  is_valid boolean,
  missing_fields text[],
  recommendations text[]
) AS $$
DECLARE
  v_restaurant record;
  v_missing_fields text[] := '{}';
  v_recommendations text[] := '{}';
BEGIN
  SET search_path = public;
  
  SELECT * INTO v_restaurant
  FROM restaurants
  WHERE id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['restaurant_not_found'], ARRAY['Restaurant not found'];
    RETURN;
  END IF;
  
  -- Check if Stripe account exists
  IF v_restaurant.stripe_account_id IS NULL THEN
    v_missing_fields := array_append(v_missing_fields, 'stripe_account_id');
    v_recommendations := array_append(v_recommendations, 'Connect your Stripe account');
  END IF;
  
  -- Check if account is enabled
  IF v_restaurant.stripe_account_enabled = false THEN
    v_missing_fields := array_append(v_missing_fields, 'account_verification');
    v_recommendations := array_append(v_recommendations, 'Complete account verification');
  END IF;
  
  -- Check requirements
  IF v_restaurant.stripe_account_requirements IS NOT NULL THEN
    IF v_restaurant.stripe_account_requirements ? 'currently_due' THEN
      v_missing_fields := array_append(v_missing_fields, 'requirements');
      v_recommendations := array_append(v_recommendations, 'Complete required verification steps');
    END IF;
  END IF;
  
  -- Determine if setup is valid
  IF array_length(v_missing_fields, 1) = 0 THEN
    RETURN QUERY SELECT true, v_missing_fields, v_recommendations;
  ELSE
    RETURN QUERY SELECT false, v_missing_fields, v_recommendations;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_stripe_connect_setup(uuid) TO authenticated;

-- 11. Add comments for documentation
COMMENT ON FUNCTION get_restaurant_by_stripe_account(text) IS 'Find restaurant by Stripe Connect account ID for webhook processing';
COMMENT ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) IS 'Update restaurant Stripe Connect status and requirements';
COMMENT ON FUNCTION get_restaurant_stripe_status(uuid) IS 'Get comprehensive Stripe status for a restaurant';
COMMENT ON FUNCTION handle_stripe_account_deauthorization(text) IS 'Handle Stripe account deauthorization events';
COMMENT ON FUNCTION refresh_stripe_account_status(uuid) IS 'Refresh Stripe account status from stored data';
COMMENT ON FUNCTION validate_stripe_connect_setup(uuid) IS 'Validate Stripe Connect setup and provide recommendations';

-- 12. Create a function to get payment statistics
CREATE OR REPLACE FUNCTION get_restaurant_payment_stats(p_restaurant_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE (
  total_transactions bigint,
  total_amount numeric,
  card_transactions bigint,
  card_amount numeric,
  cash_transactions bigint,
  cash_amount numeric,
  average_order_value numeric
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    COUNT(*) as total_transactions,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE payment_method = 'card') as card_transactions,
    COALESCE(SUM(amount) FILTER (WHERE payment_method = 'card'), 0) as card_amount,
    COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_transactions,
    COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0) as cash_amount,
    COALESCE(AVG(amount), 0) as average_order_value
  FROM payments
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= now() - interval '1 day' * p_days
    AND status = 'succeeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_restaurant_payment_stats(uuid, integer) TO authenticated;

COMMENT ON FUNCTION get_restaurant_payment_stats(uuid, integer) IS 'Get payment statistics for a restaurant over a specified number of days'; 
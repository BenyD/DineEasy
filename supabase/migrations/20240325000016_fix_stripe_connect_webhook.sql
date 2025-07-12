-- Fix Stripe Connect webhook handling and add better debugging
-- This migration ensures the webhook can properly find and update restaurants

-- 1. Ensure the get_restaurant_by_stripe_account function is properly created
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
  -- Add debug logging
  RAISE LOG 'Looking for restaurant with stripe_account_id: %', p_stripe_account_id;
  
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
  
  -- Log the result
  IF NOT FOUND THEN
    RAISE LOG 'No restaurant found for stripe_account_id: %', p_stripe_account_id;
  ELSE
    RAISE LOG 'Found restaurant for stripe_account_id: %', p_stripe_account_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the update_stripe_connect_status function is properly created
CREATE OR REPLACE FUNCTION update_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_charges_enabled boolean,
  p_requirements jsonb
)
RETURNS void AS $$
BEGIN
  -- Add debug logging
  RAISE LOG 'Updating restaurant % with stripe_account_id: %, charges_enabled: %', 
    p_restaurant_id, p_stripe_account_id, p_charges_enabled;
  
  UPDATE restaurants
  SET
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_charges_enabled,
    stripe_account_requirements = p_requirements,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  -- Log the result
  IF NOT FOUND THEN
    RAISE LOG 'No restaurant found to update with id: %', p_restaurant_id;
  ELSE
    RAISE LOG 'Successfully updated restaurant %', p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to debug Stripe Connect issues
CREATE OR REPLACE FUNCTION debug_stripe_connect_status(p_stripe_account_id text DEFAULT NULL)
RETURNS TABLE (
  restaurant_id uuid,
  restaurant_name text,
  stripe_account_id text,
  stripe_account_enabled boolean,
  stripe_account_created_at timestamp with time zone,
  owner_email text
) AS $$
BEGIN
  IF p_stripe_account_id IS NULL THEN
    -- Return all restaurants with Stripe accounts
    RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.stripe_account_id,
      r.stripe_account_enabled,
      r.stripe_account_created_at,
      r.email
    FROM restaurants r
    WHERE r.stripe_account_id IS NOT NULL
    ORDER BY r.stripe_account_created_at DESC;
  ELSE
    -- Return specific restaurant
    RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.stripe_account_id,
      r.stripe_account_enabled,
      r.stripe_account_created_at,
      r.email
    FROM restaurants r
    WHERE r.stripe_account_id = p_stripe_account_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_account(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_stripe_connect_status(text) TO authenticated;

-- 5. Ensure the index exists for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id_lookup ON restaurants(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- 6. Add a comment for documentation
COMMENT ON FUNCTION get_restaurant_by_stripe_account(text) IS 'Find restaurant by Stripe Connect account ID with debug logging';
COMMENT ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) IS 'Update restaurant Stripe Connect status with debug logging';
COMMENT ON FUNCTION debug_stripe_connect_status(text) IS 'Debug function to check Stripe Connect status for restaurants';

-- 7. Log the completion
DO $$
BEGIN
  RAISE LOG 'Stripe Connect webhook fix migration completed';
  RAISE LOG 'Added debug logging and improved error handling';
END $$; 
-- Fix function overloading conflicts
-- This migration resolves the PGRST203 error by ensuring unique function signatures

-- 1. Drop all conflicting functions first
DROP FUNCTION IF EXISTS update_restaurant_subscription_status(uuid, text);
DROP FUNCTION IF EXISTS update_restaurant_subscription_status(uuid, text, text);
DROP FUNCTION IF EXISTS update_restaurant_subscription_status(uuid, text, text, text);

-- 2. Create the main subscription status update function with optional customer ID
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

-- 3. Create a simple version for backward compatibility
CREATE OR REPLACE FUNCTION update_restaurant_subscription_status_simple(
  p_restaurant_id uuid,
  p_subscription_status text
)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET
    subscription_status = p_subscription_status,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  RAISE LOG 'Updated restaurant % subscription status to % (simple)', p_restaurant_id, p_subscription_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION update_restaurant_subscription_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_subscription_status_simple(uuid, text) TO authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION update_restaurant_subscription_status(uuid, text, text) IS 'Update restaurant subscription status and optionally Stripe customer ID';
COMMENT ON FUNCTION update_restaurant_subscription_status_simple(uuid, text) IS 'Update restaurant subscription status only (backward compatibility)';

-- 6. Log completion
DO $$
BEGIN
  RAISE LOG 'Fixed function overloading conflicts';
  RAISE LOG 'Created unique function signatures for subscription status updates';
END $$; 
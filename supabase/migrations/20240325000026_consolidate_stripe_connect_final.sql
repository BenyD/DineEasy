-- Consolidate Stripe Connect migrations only (customer payments to restaurants)
-- This migration handles Stripe Connect accounts for restaurants to receive customer payments
-- NOTE: Subscriptions (restaurant paying platform) are handled separately

-- 0. Drop ALL existing Stripe Connect related objects to avoid conflicts
-- Functions
DROP FUNCTION IF EXISTS get_restaurant_by_stripe_account(text) CASCADE;
DROP FUNCTION IF EXISTS update_stripe_connect_status(uuid, text, boolean, jsonb) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_stripe_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS handle_stripe_account_deauthorization(text) CASCADE;
DROP FUNCTION IF EXISTS refresh_stripe_account_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_stripe_connect_setup(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_payment_stats(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS update_restaurant_stripe_connect_status(uuid, text, boolean, jsonb) CASCADE;
DROP FUNCTION IF EXISTS handle_stripe_account_update() CASCADE;
DROP FUNCTION IF EXISTS debug_stripe_connect_status(text) CASCADE;

-- Views
DROP VIEW IF EXISTS restaurant_stripe_overview CASCADE;

-- Triggers
DROP TRIGGER IF EXISTS stripe_account_updated ON restaurants;

-- Policies
DROP POLICY IF EXISTS "Users can view their own restaurant stripe status" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant stripe status" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant's Stripe Connect info" ON restaurants;
DROP POLICY IF EXISTS "Allow admin access to restaurants for Stripe updates" ON restaurants;

-- Indexes (we'll recreate them)
DROP INDEX IF EXISTS idx_restaurants_stripe_account_id;
DROP INDEX IF EXISTS idx_restaurants_stripe_account_enabled;
DROP INDEX IF EXISTS idx_restaurants_payment_methods;

-- 1. Ensure all required Stripe Connect columns exist (CUSTOMER PAYMENTS TO RESTAURANT)
DO $$
BEGIN
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

    -- Payment methods field (for restaurant to configure payment options)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'payment_methods'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN payment_methods jsonb DEFAULT '{"cardEnabled": true, "cashEnabled": true}'::jsonb;
        RAISE LOG 'Added payment_methods column';
    END IF;
END $$;

-- 2. Create comprehensive indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id ON restaurants(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_enabled ON restaurants(stripe_account_enabled);
CREATE INDEX IF NOT EXISTS idx_restaurants_payment_methods ON restaurants USING GIN (payment_methods);

-- 3. Core Stripe Connect Functions (CUSTOMER PAYMENTS TO RESTAURANT)

-- Function to find restaurant by Stripe account ID (for webhooks)
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

-- Function to update Stripe Connect status
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
    stripe_account_created_at = CASE 
      WHEN stripe_account_created_at IS NULL THEN now()
      ELSE stripe_account_created_at
    END,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurant with id % not found', p_restaurant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive Stripe Connect status only
CREATE OR REPLACE FUNCTION get_restaurant_stripe_connect_status(p_restaurant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_account_enabled boolean,
  stripe_account_requirements jsonb,
  has_stripe_connect boolean,
  can_accept_payments boolean,
  payment_methods jsonb
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.email,
    r.stripe_account_id,
    r.stripe_account_enabled,
    r.stripe_account_requirements,
    COALESCE(r.stripe_account_id IS NOT NULL, false) as has_stripe_connect,
    COALESCE(r.stripe_account_enabled = true, false) as can_accept_payments,
    r.payment_methods
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle Stripe account deauthorization
CREATE OR REPLACE FUNCTION handle_stripe_account_deauthorization(p_stripe_account_id text)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    stripe_account_id = NULL,
    stripe_account_enabled = false,
    stripe_account_requirements = NULL,
    updated_at = now()
  WHERE stripe_account_id = p_stripe_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh Stripe account status
CREATE OR REPLACE FUNCTION refresh_stripe_account_status(p_restaurant_id uuid)
RETURNS void AS $$
BEGIN
  SET search_path = public;
  
  -- This function would typically call Stripe API to refresh status
  -- For now, we just update the timestamp
  UPDATE restaurants
  SET updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate Stripe Connect setup
CREATE OR REPLACE FUNCTION validate_stripe_connect_setup(p_restaurant_id uuid)
RETURNS TABLE (
  is_valid boolean,
  missing_fields text[],
  recommendations text[]
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT
    CASE WHEN r.stripe_account_enabled = true THEN true ELSE false END as is_valid,
    ARRAY[]::text[] as missing_fields,
    ARRAY['Ensure all required business information is provided']::text[] as recommendations
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get restaurant payment stats (customer payments to restaurant)
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

-- 4. Create comprehensive view for Stripe Connect overview only
CREATE OR REPLACE VIEW restaurant_stripe_connect_overview AS
SELECT
  r.id,
  r.name,
  r.email,
  -- Stripe Connect status (customer payments to restaurant)
  r.stripe_account_id,
  r.stripe_account_enabled,
  CASE WHEN r.stripe_account_id IS NOT NULL THEN true ELSE false END as has_stripe_connect,
  CASE WHEN r.stripe_account_enabled = true THEN true ELSE false END as can_accept_payments,
  r.payment_methods,
  -- Timestamps
  r.created_at,
  r.updated_at
FROM restaurants r;

-- 5. Create trigger for Stripe Connect account updates
CREATE OR REPLACE FUNCTION handle_stripe_account_update()
RETURNS trigger AS $$
BEGIN
  SET search_path = public;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_account_updated
  BEFORE UPDATE OF stripe_account_id, stripe_account_enabled, stripe_account_requirements
  ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_account_update();

-- 6. Add RLS policies for Stripe Connect
CREATE POLICY "Users can view their own restaurant stripe connect status" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own restaurant stripe connect status" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Allow admin access to restaurants for Stripe Connect updates" ON restaurants
  FOR UPDATE USING (true) WITH CHECK (true);

-- 7. Grant necessary permissions for Stripe Connect functions
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_account(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_stripe_connect_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_stripe_account_deauthorization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_stripe_account_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_stripe_connect_setup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_payment_stats(uuid, integer) TO authenticated;

-- 8. Add comprehensive comments for Stripe Connect documentation
COMMENT ON COLUMN restaurants.stripe_account_id IS 'Stripe Connect account ID for receiving customer payments';
COMMENT ON COLUMN restaurants.stripe_account_enabled IS 'Whether the Stripe Connect account can accept charges';
COMMENT ON COLUMN restaurants.stripe_account_requirements IS 'Stripe Connect account verification requirements and status';
COMMENT ON COLUMN restaurants.stripe_account_created_at IS 'When the Stripe Connect account was created';
COMMENT ON COLUMN restaurants.payment_methods IS 'JSON object storing payment method preferences (cardEnabled, cashEnabled)';

COMMENT ON FUNCTION get_restaurant_by_stripe_account(text) IS 'Find restaurant by Stripe Connect account ID for webhook processing';
COMMENT ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) IS 'Update restaurant Stripe Connect status and requirements';
COMMENT ON FUNCTION get_restaurant_stripe_connect_status(uuid) IS 'Get comprehensive Stripe Connect status for a restaurant';
COMMENT ON FUNCTION handle_stripe_account_deauthorization(text) IS 'Handle Stripe account deauthorization events';
COMMENT ON FUNCTION refresh_stripe_account_status(uuid) IS 'Refresh Stripe account status from stored data';
COMMENT ON FUNCTION validate_stripe_connect_setup(uuid) IS 'Validate Stripe Connect setup and provide recommendations';
COMMENT ON FUNCTION get_restaurant_payment_stats(uuid, integer) IS 'Get payment statistics for a restaurant over a specified number of days';

-- 9. Log completion
DO $$
BEGIN
  RAISE LOG 'Stripe Connect consolidation migration completed successfully';
  RAISE LOG 'All Stripe Connect functions, views, and policies have been recreated';
  RAISE LOG 'NOTE: Subscriptions (restaurant paying platform) are handled separately';
END $$; 
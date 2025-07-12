-- Comprehensive Stripe Connect synchronization
-- This migration ensures all Stripe Connect features are properly supported

-- 1. Ensure all required Stripe Connect columns exist
DO $$
BEGIN
    -- Add stripe_account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_id text;
    END IF;

    -- Add stripe_account_enabled if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_enabled'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_enabled boolean default false;
    END IF;

    -- Add stripe_account_requirements if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_requirements'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_requirements jsonb;
    END IF;

    -- Add stripe_account_created_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_account_created_at'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_account_created_at timestamp with time zone;
    END IF;

    -- Add stripe_application_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'stripe_application_id'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN stripe_application_id text;
    END IF;

    -- Add onboarding_completed if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN onboarding_completed boolean default false;
    END IF;
END $$;

-- 2. Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_account_id ON restaurants(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_application_id ON restaurants(stripe_application_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_onboarding_completed ON restaurants(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_restaurants_country ON restaurants(country);

-- 3. Update or create the update_stripe_connect_status function
CREATE OR REPLACE FUNCTION update_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_charges_enabled boolean,
  p_requirements jsonb
)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_charges_enabled,
    stripe_account_requirements = p_requirements,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update or create the get_restaurant_by_stripe_account function
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

-- 5. Update or create the get_restaurant_by_stripe_application function
CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_application(p_stripe_application_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_application_id text,
  stripe_account_enabled boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_account_id,
    r.stripe_application_id,
    r.stripe_account_enabled
  FROM restaurants r
  WHERE r.stripe_application_id = p_stripe_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update or create the update_restaurant_stripe_application function
CREATE OR REPLACE FUNCTION update_restaurant_stripe_application(
  p_restaurant_id uuid,
  p_stripe_application_id text
)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET
    stripe_application_id = p_stripe_application_id,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get restaurant by Stripe customer ID
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
  stripe_account_enabled boolean
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
    r.stripe_account_enabled
  FROM restaurants r
  WHERE r.stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to update onboarding status
CREATE OR REPLACE FUNCTION update_restaurant_onboarding_status(
  p_restaurant_id uuid,
  p_onboarding_completed boolean
)
RETURNS void AS $$
BEGIN
  UPDATE restaurants
  SET
    onboarding_completed = p_onboarding_completed,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_account(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_application(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_stripe_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_restaurant_by_stripe_customer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_restaurant_onboarding_status(uuid, boolean) TO authenticated;

-- 10. Create or update the stripe account update trigger
CREATE OR REPLACE FUNCTION handle_stripe_account_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS stripe_account_updated ON restaurants;

-- Create the trigger
CREATE TRIGGER stripe_account_updated
  BEFORE UPDATE OF stripe_account_id, stripe_account_enabled, stripe_account_requirements, stripe_application_id
  ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_account_update();

-- 11. Add RLS policies for Stripe Connect operations
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own restaurant's Stripe Connect info" ON restaurants;
DROP POLICY IF EXISTS "Allow admin access to restaurants for Stripe updates" ON restaurants;

-- Allow authenticated users to update their own restaurant's Stripe Connect info
CREATE POLICY "Users can update their own restaurant's Stripe Connect info" ON restaurants
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow admin access for webhook operations
CREATE POLICY "Allow admin access to restaurants for Stripe updates" ON restaurants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 12. Add comments for documentation
COMMENT ON COLUMN restaurants.stripe_account_id IS 'Stripe Connect account ID for payment processing';
COMMENT ON COLUMN restaurants.stripe_account_enabled IS 'Whether the Stripe Connect account can accept charges';
COMMENT ON COLUMN restaurants.stripe_account_requirements IS 'Stripe Connect account requirements and verification status';
COMMENT ON COLUMN restaurants.stripe_account_created_at IS 'When the Stripe Connect account was created';
COMMENT ON COLUMN restaurants.stripe_application_id IS 'Stripe Connect application ID for linking account.application.authorized events';
COMMENT ON COLUMN restaurants.onboarding_completed IS 'Whether the restaurant has completed the full onboarding process';

-- 13. Log the completion
DO $$
BEGIN
  RAISE LOG 'Comprehensive Stripe Connect synchronization completed';
  RAISE LOG 'All Stripe Connect features are now properly supported';
END $$; 
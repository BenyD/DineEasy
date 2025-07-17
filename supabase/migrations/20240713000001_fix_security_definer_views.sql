-- Fix security definer views by recreating them with SECURITY INVOKER
-- This addresses the Supabase linter warnings about security concerns

-- Drop the existing views
DROP VIEW IF EXISTS restaurant_stripe_connect_overview;
DROP VIEW IF EXISTS restaurant_subscription_overview;

-- Recreate restaurant_stripe_connect_overview with SECURITY INVOKER
CREATE OR REPLACE VIEW restaurant_stripe_connect_overview 
WITH (security_invoker = true) AS
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

-- Recreate restaurant_subscription_overview with SECURITY INVOKER
CREATE OR REPLACE VIEW restaurant_subscription_overview 
WITH (security_invoker = true) AS
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

-- Add comments to explain the security model
COMMENT ON VIEW restaurant_stripe_connect_overview IS 'View for Stripe Connect status overview. Uses SECURITY INVOKER to respect RLS policies.';
COMMENT ON VIEW restaurant_subscription_overview IS 'View for subscription status overview. Uses SECURITY INVOKER to respect RLS policies.';

-- Log the fix
DO $$
BEGIN
  RAISE LOG 'Security definer views fixed - now using SECURITY INVOKER';
  RAISE LOG 'Views will now respect Row Level Security (RLS) policies';
  RAISE LOG 'Users can only see data they have permission to access';
END $$; 
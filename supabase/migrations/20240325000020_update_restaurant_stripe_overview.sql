-- Update restaurant_stripe_overview view with security_invoker and improved structure
-- This migration updates the view to use security_invoker for better security and performance

-- Drop the existing view
DROP VIEW IF EXISTS restaurant_stripe_overview;

-- Create the updated view with security_invoker
CREATE VIEW public.restaurant_stripe_overview WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  email,
  stripe_customer_id,
  subscription_status,
  CASE
    WHEN subscription_status = ANY (ARRAY['active'::text, 'trialing'::text]) THEN true
    ELSE false
  END AS has_active_subscription,
  stripe_account_id,
  stripe_account_enabled,
  CASE
    WHEN stripe_account_id IS NOT NULL THEN true
    ELSE false
  END AS has_stripe_connect,
  CASE
    WHEN stripe_account_enabled = true THEN true
    ELSE false
  END AS can_accept_payments,
  onboarding_completed,
  created_at,
  updated_at
FROM restaurants r;

-- Grant access to authenticated users
GRANT SELECT ON restaurant_stripe_overview TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW restaurant_stripe_overview IS 'Overview of restaurant Stripe integration status including subscription and Connect account information';

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Updated restaurant_stripe_overview view with security_invoker';
  RAISE LOG 'Improved view structure with better CASE statements and security';
END $$; 
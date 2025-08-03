-- Add stripe_checkout_session_id field to orders table for QR payments using Checkout Sessions
ALTER TABLE public.orders 
ADD COLUMN stripe_checkout_session_id text;

-- Add comment to explain the field
COMMENT ON COLUMN public.orders.stripe_checkout_session_id IS 'Stripe Checkout Session ID for QR payments using Checkout Sessions'; 
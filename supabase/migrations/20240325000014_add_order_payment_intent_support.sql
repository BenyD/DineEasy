-- Add Stripe payment intent support to orders table
-- This migration adds the missing column for tracking QR payments

-- ============================================================================
-- STEP 1: Add stripe_payment_intent_id column to orders table
-- ============================================================================

-- Add stripe_payment_intent_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent_id text;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create index on stripe_payment_intent_id for faster lookups
-- ============================================================================

-- Create index on stripe_payment_intent_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);

-- ============================================================================
-- STEP 3: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Stripe payment intent ID for QR payments';

-- ============================================================================
-- STEP 4: Verify the changes
-- ============================================================================

DO $$
DECLARE
  v_stripe_payment_intent_id_exists boolean;
BEGIN
  -- Check if stripe_payment_intent_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
  ) INTO v_stripe_payment_intent_id_exists;
  
  IF NOT v_stripe_payment_intent_id_exists THEN
    RAISE EXCEPTION 'stripe_payment_intent_id column was not added to orders table';
  END IF;
  
  RAISE LOG 'Order payment intent support migration completed successfully';
END $$; 
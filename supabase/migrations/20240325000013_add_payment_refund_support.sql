-- Add refund support and payment method settings to payments table
-- This migration adds missing columns for complete payment tracking

-- ============================================================================
-- STEP 1: Add refund_id column to payments table
-- ============================================================================

-- Add refund_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'refund_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN refund_id text;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add payment_methods column to restaurants table if missing
-- ============================================================================

-- Add payment_methods column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN payment_methods jsonb DEFAULT '{"cardEnabled": true, "cashEnabled": true}'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create index on refund_id for faster lookups
-- ============================================================================

-- Create index on refund_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_payments_refund_id ON payments(refund_id);

-- ============================================================================
-- STEP 4: Update RLS policies to include refund_id
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own restaurant payments" ON payments;
DROP POLICY IF EXISTS "Allow admin access to payments" ON payments;

-- Create comprehensive payment policies
CREATE POLICY "Users can view their own restaurant payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = payments.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Allow admin access to payments" ON payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN payments.refund_id IS 'Stripe refund ID when payment is refunded';
COMMENT ON COLUMN restaurants.payment_methods IS 'JSON object with payment method settings: {"cardEnabled": boolean, "cashEnabled": boolean}';

-- ============================================================================
-- STEP 6: Verify the changes
-- ============================================================================

DO $$
DECLARE
  v_refund_id_exists boolean;
  v_payment_methods_exists boolean;
BEGIN
  -- Check if refund_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'refund_id'
  ) INTO v_refund_id_exists;
  
  -- Check if payment_methods column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'payment_methods'
  ) INTO v_payment_methods_exists;
  
  IF NOT v_refund_id_exists THEN
    RAISE EXCEPTION 'refund_id column was not added to payments table';
  END IF;
  
  IF NOT v_payment_methods_exists THEN
    RAISE EXCEPTION 'payment_methods column was not added to restaurants table';
  END IF;
  
  RAISE LOG 'Payment refund support migration completed successfully';
END $$; 
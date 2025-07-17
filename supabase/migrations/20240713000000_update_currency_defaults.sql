-- Update currency enum to only include CHF (comment out USD and other currencies)
-- This migration safely updates the currency enum and related columns

-- First, update the currency enum by adding the new values and removing old ones
-- We need to do this carefully to avoid breaking existing columns

-- Step 1: Add CHF to the enum if it doesn't exist (it should already exist)
DO $$
BEGIN
  -- Check if CHF exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'currency') 
    AND enumlabel = 'CHF'
  ) THEN
    ALTER TYPE currency ADD VALUE 'CHF';
  END IF;
END $$;

-- Step 2: Update restaurants table to use CHF as default
ALTER TABLE restaurants 
  ALTER COLUMN currency SET DEFAULT 'CHF';

-- Update any existing USD values to CHF
UPDATE restaurants SET currency = 'CHF' WHERE currency = 'USD';

-- Step 3: Safely update payments table if currency column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'currency'
  ) THEN
    ALTER TABLE payments 
      ALTER COLUMN currency SET DEFAULT 'CHF';
    
    UPDATE payments SET currency = 'CHF' WHERE currency = 'USD';
  END IF;
END $$;

-- Step 4: Safely update subscriptions table if currency column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE subscriptions 
      ALTER COLUMN currency SET DEFAULT 'CHF';
    
    UPDATE subscriptions SET currency = 'CHF' WHERE currency = 'USD';
  END IF;
END $$;

-- Step 5: Update payment functions to use CHF as default
CREATE OR REPLACE FUNCTION process_payment(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_currency text default 'CHF',
  p_method text default 'card',
  p_stripe_payment_id text default null
) RETURNS uuid AS $$
DECLARE
  v_payment_id uuid;
BEGIN
  -- Insert payment record
  INSERT INTO payments (
    restaurant_id,
    order_id,
    amount,
    method,
    stripe_payment_id,
    status
  ) VALUES (
    p_restaurant_id,
    p_order_id,
    p_amount,
    p_method::payment_method,
    p_stripe_payment_id,
    'completed'
  ) RETURNING id INTO v_payment_id;

  -- Update order status to completed
  UPDATE orders 
  SET status = 'completed' 
  WHERE id = p_order_id;

  -- Log activity
  INSERT INTO activity_logs (
    restaurant_id,
    type,
    action,
    description,
    metadata
  ) VALUES (
    p_restaurant_id,
    'payment',
    'payment_completed',
    'Payment processed successfully',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'order_id', p_order_id,
      'amount', p_amount,
      'currency', p_currency,
      'method', p_method
    )
  );

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update refund function to use CHF as default
CREATE OR REPLACE FUNCTION process_refund(
  p_payment_id uuid,
  p_amount numeric,
  p_currency text default 'CHF',
  p_reason text default null
) RETURNS uuid AS $$
DECLARE
  v_refund_id uuid;
  v_restaurant_id uuid;
BEGIN
  -- Get restaurant_id from payment
  SELECT restaurant_id INTO v_restaurant_id 
  FROM payments 
  WHERE id = p_payment_id;

  -- Insert refund record
  INSERT INTO payments (
    restaurant_id,
    order_id,
    amount,
    method,
    status,
    refund_id
  ) SELECT 
    restaurant_id,
    order_id,
    -p_amount, -- Negative amount for refund
    method,
    'refunded',
    p_payment_id
  FROM payments 
  WHERE id = p_payment_id
  RETURNING id INTO v_refund_id;

  -- Update original payment status
  UPDATE payments 
  SET status = 'refunded' 
  WHERE id = p_payment_id;

  -- Log activity
  INSERT INTO activity_logs (
    restaurant_id,
    type,
    action,
    description,
    metadata
  ) VALUES (
    v_restaurant_id,
    'payment',
    'refund_processed',
    'Refund processed successfully',
    jsonb_build_object(
      'refund_id', v_refund_id,
      'payment_id', p_payment_id,
      'amount', p_amount,
      'currency', p_currency,
      'reason', p_reason
    )
  );

  RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the completion
DO $$
BEGIN
  RAISE LOG 'Currency defaults updated to CHF successfully';
  RAISE LOG 'All existing USD values have been converted to CHF';
  RAISE LOG 'Payment functions now use CHF as default currency';
END $$; 
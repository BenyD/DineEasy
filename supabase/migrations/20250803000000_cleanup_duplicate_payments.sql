-- Clean up duplicate payment records
-- This migration removes duplicate payment records that were created before the fix

-- First, let's identify duplicate payments for the same order
-- Keep the one with the most complete information (has stripe_payment_id if available)

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_payments AS
WITH payment_rankings AS (
  SELECT 
    id,
    order_id,
    restaurant_id,
    amount,
    status,
    method,
    stripe_payment_id,
    created_at,
    -- Rank payments by completeness (prefer those with stripe_payment_id)
    ROW_NUMBER() OVER (
      PARTITION BY order_id 
      ORDER BY 
        CASE WHEN stripe_payment_id IS NOT NULL THEN 1 ELSE 0 END DESC,
        created_at ASC
    ) as rn
  FROM payments
  WHERE order_id IN (
    -- Find orders with multiple payments
    SELECT order_id 
    FROM payments 
    GROUP BY order_id 
    HAVING COUNT(*) > 1
  )
)
SELECT id, order_id, restaurant_id, amount, status, method, stripe_payment_id, created_at
FROM payment_rankings 
WHERE rn > 1; -- Keep only the duplicates (not the first one)

-- Log the duplicates we're about to delete
DO $$
DECLARE
  duplicate_count INTEGER;
  payment_record RECORD;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_payments;
  RAISE NOTICE 'Found % duplicate payment records to clean up', duplicate_count;
  
  -- Log details of duplicates being removed
  FOR payment_record IN 
    SELECT * FROM duplicate_payments 
    ORDER BY order_id, created_at
  LOOP
    RAISE NOTICE 'Removing duplicate payment: ID=%, Order=%, Amount=%, Method=%, StripeID=%', 
      payment_record.id, 
      payment_record.order_id, 
      payment_record.amount, 
      payment_record.method, 
      payment_record.stripe_payment_id;
  END LOOP;
END $$;

-- Delete the duplicate payments
DELETE FROM payments 
WHERE id IN (SELECT id FROM duplicate_payments);

-- Log the cleanup results
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Successfully deleted % duplicate payment records', deleted_count;
END $$;

-- Drop the temporary table
DROP TABLE duplicate_payments; 
-- Fix card orders that were incorrectly marked as completed
-- Card orders should be "preparing" when payment is completed, not "completed"
-- Only mark as "completed" when the order is served

-- Update card orders that have stripe_payment_intent_id or stripe_checkout_session_id
-- and are marked as "completed" to "preparing" status
-- This affects orders that were processed before the webhook fix

UPDATE orders 
SET 
  status = 'preparing',
  updated_at = now()
WHERE 
  status = 'completed' 
  AND (
    stripe_payment_intent_id IS NOT NULL 
    OR stripe_checkout_session_id IS NOT NULL
  )
  AND id IN (
    -- Only update orders that have completed payments
    SELECT DISTINCT o.id 
    FROM orders o
    JOIN payments p ON o.id = p.order_id
    WHERE p.status = 'completed'
  );

-- Log the changes
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % card orders from "completed" to "active" status', updated_count;
END $$; 
-- Add order timeout tracking and cleanup functionality
-- This migration adds indexes and functions to help with order timeout management

-- Add index for efficient timeout queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON orders(status, created_at) 
WHERE status = 'pending';

-- Add index for table-specific timeout queries
CREATE INDEX IF NOT EXISTS idx_orders_table_status_created 
ON orders(table_id, status, created_at) 
WHERE status = 'pending';

-- Function to get abandoned orders for cleanup
CREATE OR REPLACE FUNCTION get_abandoned_orders(timeout_minutes INTEGER DEFAULT 30)
RETURNS TABLE (
  order_id UUID,
  table_id UUID,
  restaurant_id UUID,
  created_at TIMESTAMPTZ,
  age_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.table_id,
    o.restaurant_id,
    o.created_at,
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 as age_minutes
  FROM orders o
  WHERE o.status = 'pending'
    AND o.created_at < NOW() - INTERVAL '1 minute' * timeout_minutes
  ORDER BY o.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up abandoned orders
CREATE OR REPLACE FUNCTION cleanup_abandoned_orders(timeout_minutes INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  abandoned_order RECORD;
  cleaned_count INTEGER := 0;
BEGIN
  -- Get abandoned orders
  FOR abandoned_order IN 
    SELECT * FROM get_abandoned_orders(timeout_minutes)
  LOOP
    BEGIN
      -- Delete order items first
      DELETE FROM order_items WHERE order_id = abandoned_order.order_id;
      
      -- Delete the order
      DELETE FROM orders WHERE id = abandoned_order.order_id;
      
      cleaned_count := cleaned_count + 1;
      
      -- Log the cleanup (you can add this to a cleanup_logs table if needed)
      RAISE NOTICE 'Cleaned up abandoned order: % (age: % minutes)', 
        abandoned_order.order_id, 
        abandoned_order.age_minutes;
        
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other orders
      RAISE WARNING 'Failed to clean up order %: %', 
        abandoned_order.order_id, 
        SQLERRM;
    END;
  END LOOP;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order timeout status
CREATE OR REPLACE FUNCTION get_order_timeout_status(order_uuid UUID, timeout_minutes INTEGER DEFAULT 30)
RETURNS TABLE (
  is_timed_out BOOLEAN,
  age_minutes INTEGER,
  time_until_timeout INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.created_at < NOW() - INTERVAL '1 minute' * timeout_minutes as is_timed_out,
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 as age_minutes,
    GREATEST(0, timeout_minutes - EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60) as time_until_timeout
  FROM orders o
  WHERE o.id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_abandoned_orders(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_orders(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_timeout_status(UUID, INTEGER) TO authenticated;

-- Add RLS policies for the new functions
CREATE POLICY "Users can view abandoned orders for their restaurants" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r 
      WHERE r.id = orders.restaurant_id 
      AND r.owner_id = auth.uid()
    )
  );

-- Create a view for monitoring order timeouts
CREATE OR REPLACE VIEW order_timeout_monitor AS
SELECT 
  o.id as order_id,
  o.table_id,
  o.restaurant_id,
  o.status,
  o.created_at,
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 as age_minutes,
  CASE 
    WHEN o.status = 'pending' AND o.created_at < NOW() - INTERVAL '30 minutes' THEN 'ABANDONED'
    WHEN o.status = 'pending' AND o.created_at < NOW() - INTERVAL '15 minutes' THEN 'TIMEOUT_WARNING'
    WHEN o.status = 'pending' THEN 'ACTIVE'
    ELSE 'COMPLETED'
  END as timeout_status
FROM orders o
WHERE o.status = 'pending'
ORDER BY o.created_at ASC;

-- Grant access to the view
GRANT SELECT ON order_timeout_monitor TO authenticated;

-- Add RLS policy for the view
CREATE POLICY "Users can view timeout monitor for their restaurants" ON order_timeout_monitor
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r 
      WHERE r.id = order_timeout_monitor.restaurant_id 
      AND r.owner_id = auth.uid()
    )
  ); 
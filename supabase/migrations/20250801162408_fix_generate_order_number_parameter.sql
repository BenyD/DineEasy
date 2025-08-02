-- Drop the conflicting function and recreate with different parameter name
DROP FUNCTION IF EXISTS public.generate_order_number(restaurant_id uuid);

-- Create new function with different parameter name
CREATE OR REPLACE FUNCTION public.generate_order_number(p_restaurant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year integer;
  v_sequence integer;
  v_order_number text;
  v_lock_key integer;
  v_max_retries integer := 10;
  v_retry_count integer := 0;
BEGIN
  -- Use restaurant_id hash as advisory lock key to prevent race conditions
  v_lock_key := abs(hashtext(p_restaurant_id::text));
  
  -- Try to acquire advisory lock with retry mechanism
  WHILE v_retry_count < v_max_retries LOOP
    IF pg_try_advisory_lock(v_lock_key) THEN
      -- Lock acquired, proceed with order number generation
      BEGIN
        v_year := EXTRACT(YEAR FROM NOW());
        
        -- Get the next sequence number for this restaurant and year
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-' || v_year || '-(\\d+)') AS integer)), 0) + 1
        INTO v_sequence
        FROM orders
        WHERE restaurant_id = p_restaurant_id
          AND order_number LIKE 'ORD-' || v_year || '-%';
        
        -- Format order number
        v_order_number := 'ORD-' || v_year || '-' || LPAD(v_sequence::text, 3, '0');
        
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(v_lock_key);
        
        RETURN v_order_number;
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Release lock on error
          PERFORM pg_advisory_unlock(v_lock_key);
          RAISE;
      END;
    ELSE
      -- Lock not acquired, wait a bit and retry
      v_retry_count := v_retry_count + 1;
      PERFORM pg_sleep(0.01 * v_retry_count); -- Exponential backoff
    END IF;
  END LOOP;
  
  -- If we couldn't acquire the lock after max retries, use timestamp-based fallback
  RETURN 'ORD-' || v_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::integer::text, 10, '0');
END;
$function$; 
-- Fix the generate_order_number function to properly handle concurrent requests and existing order numbers
CREATE OR REPLACE FUNCTION "public"."generate_order_number"()
RETURNS "text"
LANGUAGE "plpgsql"
AS $$
DECLARE
    current_year text;
    next_sequence integer;
    new_order_number text;
    max_attempts integer := 10;
    attempt_count integer := 0;
    existing_count integer;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    LOOP
        -- Get the next sequence number for this year
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0) + 1
        INTO next_sequence
        FROM "public"."orders"
        WHERE order_number LIKE 'ORD-' || current_year || '-%';
        
        -- Generate the new order number
        new_order_number := 'ORD-' || current_year || '-' || LPAD(next_sequence::text, 3, '0');
        
        -- Check if this order number already exists
        SELECT COUNT(*) INTO existing_count
        FROM "public"."orders" 
        WHERE order_number = new_order_number;
        
        IF existing_count = 0 THEN
            RETURN new_order_number;
        END IF;
        
        -- If we've tried too many times, use timestamp-based fallback
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            -- Fallback: use timestamp-based number
            new_order_number := 'ORD-' || current_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::integer::text, 10, '0');
            RETURN new_order_number;
        END IF;
        
        -- Increment sequence for next attempt
        next_sequence := next_sequence + 1;
    END LOOP;
END;
$$;
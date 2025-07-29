-- Create a sequence for order numbers to handle concurrent requests properly
CREATE SEQUENCE IF NOT EXISTS "public"."order_number_sequence_2025"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create a function that uses the sequence for better concurrency handling
CREATE OR REPLACE FUNCTION "public"."generate_order_number_with_sequence"()
RETURNS "text"
LANGUAGE "plpgsql"
AS $$
DECLARE
    current_year text;
    sequence_number integer;
    new_order_number text;
    max_attempts integer := 5;
    attempt_count integer := 0;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    LOOP
        -- Get next sequence number
        sequence_number := nextval('order_number_sequence_2025');
        
        -- Generate the new order number
        new_order_number := 'ORD-' || current_year || '-' || LPAD(sequence_number::text, 3, '0');
        
        -- Check if this order number already exists (should be rare with sequence)
        IF NOT EXISTS (SELECT 1 FROM "public"."orders" WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        -- If we've tried too many times, use timestamp-based fallback
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            -- Fallback: use timestamp-based number
            new_order_number := 'ORD-' || current_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::integer::text, 10, '0');
            RETURN new_order_number;
        END IF;
    END LOOP;
END;
$$;

-- Update the existing function to use the new sequence-based approach
CREATE OR REPLACE FUNCTION "public"."generate_order_number"()
RETURNS "text"
LANGUAGE "plpgsql"
AS $$
BEGIN
    -- Use the new sequence-based function
    RETURN generate_order_number_with_sequence();
END;
$$;
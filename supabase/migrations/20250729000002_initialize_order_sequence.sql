-- Initialize the sequence to start from the next available order number
DO $$
DECLARE
    current_year text;
    max_sequence integer;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Find the maximum sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0)
    INTO max_sequence
    FROM "public"."orders"
    WHERE order_number LIKE 'ORD-' || current_year || '-%';
    
    -- Set the sequence to start from the next number
    IF max_sequence > 0 THEN
        EXECUTE 'ALTER SEQUENCE order_number_sequence_2025 RESTART WITH ' || (max_sequence + 1);
    END IF;
    
    RAISE NOTICE 'Order sequence initialized to start from: %', max_sequence + 1;
END $$;
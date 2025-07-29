-- Populate existing orders with order numbers for backward compatibility
-- This migration handles orders that were created before the order number system was implemented

DO $$
DECLARE
    order_record RECORD;
    current_year text;
    sequence_counter integer := 1;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Loop through all orders that don't have an order_number yet
    FOR order_record IN 
        SELECT id, created_at 
        FROM "public"."orders" 
        WHERE order_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        -- Generate order number for existing order
        UPDATE "public"."orders" 
        SET order_number = 'ORD-' || current_year || '-' || LPAD(sequence_counter::text, 3, '0')
        WHERE id = order_record.id;
        
        sequence_counter := sequence_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Populated % existing orders with order numbers', sequence_counter - 1;
END $$;

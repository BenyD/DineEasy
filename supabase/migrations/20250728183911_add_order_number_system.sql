-- Add order_number column to orders table for unique human-readable order IDs
ALTER TABLE "public"."orders" 
ADD COLUMN "order_number" "text" UNIQUE;

-- Add comment for the new column
COMMENT ON COLUMN "public"."orders"."order_number" IS 'Unique human-readable order number (e.g., ORD-2024-001)';

-- Create index for order_number for faster lookups
CREATE INDEX IF NOT EXISTS "orders_order_number_idx" ON "public"."orders" ("order_number");

-- Create function to generate unique order numbers
CREATE OR REPLACE FUNCTION "public"."generate_order_number"()
RETURNS "text"
LANGUAGE "plpgsql"
AS $$
DECLARE
    current_year text;
    next_sequence integer;
    new_order_number text;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0) + 1
    INTO next_sequence
    FROM "public"."orders"
    WHERE order_number LIKE 'ORD-' || current_year || '-%';
    
    -- Generate the new order number
    new_order_number := 'ORD-' || current_year || '-' || LPAD(next_sequence::text, 3, '0');
    
    RETURN new_order_number;
END;
$$;

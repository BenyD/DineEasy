-- Clean up unused order number functions
-- Keep only the restaurant-specific version that's actually being used

-- Drop unused functions
DROP FUNCTION IF EXISTS public.generate_order_number();
DROP FUNCTION IF EXISTS public.generate_order_number_with_sequence();

-- Verify the remaining function works
SELECT generate_order_number('f7ad5b2f-33c0-49e7-94c3-4fcc5c3e4037'::uuid); 
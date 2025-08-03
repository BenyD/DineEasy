-- Fix existing duplicate order numbers before adding unique constraint
-- Update the second order with duplicate order number
UPDATE orders 
SET order_number = 'ORD-2025-002'
WHERE id = '8b3c0c58-baed-42c8-931b-03e03e2501bf';

-- Now add the unique constraint
ALTER TABLE public.orders 
ADD CONSTRAINT unique_order_number_per_restaurant 
UNIQUE (restaurant_id, order_number); 
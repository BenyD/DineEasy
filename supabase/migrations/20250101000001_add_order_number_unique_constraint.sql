-- Add unique constraint on order_number to prevent duplicates
ALTER TABLE orders 
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Add index for better performance on order_number lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number); 
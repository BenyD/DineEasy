-- Migration: Add payment table constraints and indexes
-- Date: 2025-08-02
-- Description: Prevents duplicate payment records and improves query performance

-- Add unique constraint to prevent duplicate payment records per order
-- This ensures only one payment record can exist per order_id
ALTER TABLE payments 
ADD CONSTRAINT payments_order_id_unique 
UNIQUE (order_id);

-- Add index for better performance when querying by order_id
CREATE INDEX IF NOT EXISTS idx_payments_order_id 
ON payments (order_id);

-- Add index for better performance when querying by stripe_payment_id
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id 
ON payments (stripe_payment_id);

-- Add index for better performance when querying by status and method
CREATE INDEX IF NOT EXISTS idx_payments_status_method 
ON payments (status, method);

-- Add index for better performance when querying by restaurant_id
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id 
ON payments (restaurant_id);

-- Add index for better performance when querying by created_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_payments_created_at 
ON payments (created_at); 
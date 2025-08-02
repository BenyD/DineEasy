-- Rollback Migration: Remove payment table constraints and indexes
-- Date: 2025-08-02
-- Description: Removes constraints and indexes added in the previous migration

-- Drop indexes (in reverse order)
DROP INDEX IF EXISTS idx_payments_created_at;
DROP INDEX IF EXISTS idx_payments_restaurant_id;
DROP INDEX IF EXISTS idx_payments_status_method;
DROP INDEX IF EXISTS idx_payments_stripe_payment_id;
DROP INDEX IF EXISTS idx_payments_order_id;

-- Drop unique constraint
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_order_id_unique; 
-- Add payment_methods column to restaurants table for storing payment method preferences
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cardEnabled": true, "cashEnabled": true}'::jsonb;

-- Create index for payment_methods queries
CREATE INDEX IF NOT EXISTS idx_restaurants_payment_methods ON restaurants USING GIN (payment_methods);

-- Add comment for documentation
COMMENT ON COLUMN restaurants.payment_methods IS 'JSON object storing payment method preferences (cardEnabled, cashEnabled)';

-- Log the completion
DO $$
BEGIN
  RAISE LOG 'Added payment_methods column to restaurants table';
END $$; 
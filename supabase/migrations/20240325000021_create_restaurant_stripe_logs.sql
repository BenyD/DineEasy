-- Create restaurant_stripe_logs table for Stripe account change logging
CREATE TABLE IF NOT EXISTS restaurant_stripe_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamp with time zone DEFAULT now()
);

-- Add index for faster queries by restaurant
CREATE INDEX IF NOT EXISTS idx_stripe_logs_restaurant_id ON restaurant_stripe_logs(restaurant_id);

-- Add comment for documentation
COMMENT ON TABLE restaurant_stripe_logs IS 'Audit log of Stripe account changes for restaurants (account ID, enabled status, requirements, etc.)'; 
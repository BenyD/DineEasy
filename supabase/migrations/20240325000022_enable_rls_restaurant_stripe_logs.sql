-- Enable RLS on restaurant_stripe_logs table
ALTER TABLE restaurant_stripe_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for restaurant owners to view their own Stripe logs
CREATE POLICY "Restaurant owners can view their own Stripe logs" ON restaurant_stripe_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_stripe_logs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Create RLS policy for restaurant owners to insert their own Stripe logs
CREATE POLICY "Restaurant owners can insert their own Stripe logs" ON restaurant_stripe_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_stripe_logs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Create RLS policy for system/admin to manage all Stripe logs (for webhook operations)
CREATE POLICY "System can manage all Stripe logs" ON restaurant_stripe_logs
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Restaurant owners can view their own Stripe logs" ON restaurant_stripe_logs IS 'Allows restaurant owners to view Stripe account change logs for their own restaurant';
COMMENT ON POLICY "Restaurant owners can insert their own Stripe logs" ON restaurant_stripe_logs IS 'Allows restaurant owners to insert Stripe account change logs for their own restaurant';
COMMENT ON POLICY "System can manage all Stripe logs" ON restaurant_stripe_logs IS 'Allows system/service role to manage all Stripe logs for webhook operations and admin functions'; 
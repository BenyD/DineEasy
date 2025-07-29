-- Drop the existing restaurant owners policy and recreate it for authenticated users only
DROP POLICY "Restaurant owners can manage orders" ON orders;

-- Recreate the policy for authenticated users only
CREATE POLICY "Restaurant owners can manage orders" ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = orders.restaurant_id 
    AND r.owner_id = auth.uid()
  )
);
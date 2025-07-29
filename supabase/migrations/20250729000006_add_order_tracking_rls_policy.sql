-- Add a more permissive RLS policy for order tracking that allows public access
-- This policy allows anyone to read order status for tracking purposes
CREATE POLICY "Allow public order tracking" ON orders
FOR SELECT
TO public
USING (true);
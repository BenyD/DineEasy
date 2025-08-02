-- Fix QR Client Access Policies
-- Add public access policies for QR clients to access table and restaurant data without authentication

-- Drop existing restrictive policies for tables
DROP POLICY IF EXISTS "Users can view table layouts" ON "public"."tables";

-- Add new public access policy for tables (QR clients need to read table info)
CREATE POLICY "Public can view active tables for QR access" ON "public"."tables"
FOR SELECT
TO public
USING (is_active = true);

-- Drop existing restrictive policies for restaurants
DROP POLICY IF EXISTS "Users can view their own restaurants" ON "public"."restaurants";

-- Add new public access policy for restaurants (QR clients need to read restaurant info)
CREATE POLICY "Public can view active restaurants for QR access" ON "public"."restaurants"
FOR SELECT
TO public
USING (true);

-- Add back the owner-specific policies for authenticated users
CREATE POLICY "Restaurant owners can view their own restaurants" ON "public"."restaurants"
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Add back the owner-specific policies for tables
CREATE POLICY "Restaurant owners can view their own tables" ON "public"."tables"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = tables.restaurant_id 
    AND r.owner_id = auth.uid()
  )
);

-- Ensure menu items are publicly accessible for QR clients
-- (This policy already exists, but let's make sure it's working)
DROP POLICY IF EXISTS "Public can view active menu items" ON "public"."menu_items";
CREATE POLICY "Public can view active menu items" ON "public"."menu_items"
FOR SELECT
TO public
USING (is_available = true);

-- Add policy for menu categories to be publicly accessible
DROP POLICY IF EXISTS "Public can view active menu categories" ON "public"."menu_categories";
CREATE POLICY "Public can view active menu categories" ON "public"."menu_categories"
FOR SELECT
TO public
USING (is_active = true);

-- Add policy for allergens to be publicly accessible
DROP POLICY IF EXISTS "Public can view allergens" ON "public"."allergens";
CREATE POLICY "Public can view allergens" ON "public"."allergens"
FOR SELECT
TO public
USING (true);

-- Add policy for menu_items_allergens to be publicly accessible
DROP POLICY IF EXISTS "Public can view menu item allergens" ON "public"."menu_items_allergens";
CREATE POLICY "Public can view menu item allergens" ON "public"."menu_items_allergens"
FOR SELECT
TO public
USING (true);

-- Add policy for orders to be publicly accessible for QR clients (for order tracking)
DROP POLICY IF EXISTS "Public can view orders for QR tracking" ON "public"."orders";
CREATE POLICY "Public can view orders for QR tracking" ON "public"."orders"
FOR SELECT
TO public
USING (true);

-- Add policy for order_items to be publicly accessible for QR clients
DROP POLICY IF EXISTS "Public can view order items for QR tracking" ON "public"."order_items";
CREATE POLICY "Public can view order items for QR tracking" ON "public"."order_items"
FOR SELECT
TO public
USING (true);

-- Add policy for payments to be publicly accessible for QR clients (for payment status)
DROP POLICY IF EXISTS "Public can view payments for QR tracking" ON "public"."payments";
CREATE POLICY "Public can view payments for QR tracking" ON "public"."payments"
FOR SELECT
TO public
USING (true);

-- Add policy for feedback to be publicly accessible for QR clients
DROP POLICY IF EXISTS "Public can view feedback for QR access" ON "public"."feedback";
CREATE POLICY "Public can view feedback for QR access" ON "public"."feedback"
FOR SELECT
TO public
USING (true);

-- Add policy for public to insert orders (QR clients need to create orders)
DROP POLICY IF EXISTS "Public can create orders via QR" ON "public"."orders";
CREATE POLICY "Public can create orders via QR" ON "public"."orders"
FOR INSERT
TO public
WITH CHECK (true);

-- Add policy for public to insert order items
DROP POLICY IF EXISTS "Public can create order items via QR" ON "public"."order_items";
CREATE POLICY "Public can create order items via QR" ON "public"."order_items"
FOR INSERT
TO public
WITH CHECK (true);

-- Add policy for public to insert payments
DROP POLICY IF EXISTS "Public can create payments via QR" ON "public"."payments";
CREATE POLICY "Public can create payments via QR" ON "public"."payments"
FOR INSERT
TO public
WITH CHECK (true);

-- Add policy for public to insert feedback
DROP POLICY IF EXISTS "Public can create feedback via QR" ON "public"."feedback";
CREATE POLICY "Public can create feedback via QR" ON "public"."feedback"
FOR INSERT
TO public
WITH CHECK (true);

-- Add policy for public to update orders (for status updates)
DROP POLICY IF EXISTS "Public can update orders via QR" ON "public"."orders";
CREATE POLICY "Public can update orders via QR" ON "public"."orders"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add policy for public to update payments (for status updates)
DROP POLICY IF EXISTS "Public can update payments via QR" ON "public"."payments";
CREATE POLICY "Public can update payments via QR" ON "public"."payments"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add policy for public to update order items (for modifications)
DROP POLICY IF EXISTS "Public can update order items via QR" ON "public"."order_items";
CREATE POLICY "Public can update order items via QR" ON "public"."order_items"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add policy for public to update feedback
DROP POLICY IF EXISTS "Public can update feedback via QR" ON "public"."feedback";
CREATE POLICY "Public can update feedback via QR" ON "public"."feedback"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add policy for public to delete orders (for cancellations)
DROP POLICY IF EXISTS "Public can delete orders via QR" ON "public"."orders";
CREATE POLICY "Public can delete orders via QR" ON "public"."orders"
FOR DELETE
TO public
USING (true);

-- Add policy for public to delete order items
DROP POLICY IF EXISTS "Public can delete order items via QR" ON "public"."order_items";
CREATE POLICY "Public can delete order items via QR" ON "public"."order_items"
FOR DELETE
TO public
USING (true);

-- Add policy for public to delete payments
DROP POLICY IF EXISTS "Public can delete payments via QR" ON "public"."payments";
CREATE POLICY "Public can delete payments via QR" ON "public"."payments"
FOR DELETE
TO public
USING (true);

-- Add policy for public to delete feedback
DROP POLICY IF EXISTS "Public can delete feedback via QR" ON "public"."feedback";
CREATE POLICY "Public can delete feedback via QR" ON "public"."feedback"
FOR DELETE
TO public
USING (true);

-- Note: QR client access policies have been updated to allow public access
-- This enables QR clients to access table, restaurant, menu, and order data without authentication 
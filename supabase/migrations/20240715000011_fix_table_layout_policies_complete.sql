-- Comprehensive fix for table layout policies to avoid recursive dependencies
-- This migration ensures all table-related policies reference restaurants directly

-- First, ensure tables table has RLS enabled
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can update their table layouts" ON tables;
DROP POLICY IF EXISTS "Users can view their table layouts" ON tables;
DROP POLICY IF EXISTS "Restaurant owners can manage tables" ON tables;

-- Create comprehensive table policies that reference restaurants directly
CREATE POLICY "Restaurant owners can manage tables" ON tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Create specific policies for layout operations
CREATE POLICY "Users can update table layouts" ON tables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view table layouts" ON tables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Ensure the functions have proper security
GRANT EXECUTE ON FUNCTION update_table_layout(UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_table_layouts(JSONB) TO authenticated; 
-- Fix infinite recursion in restaurant_elements RLS policies
-- Drop the problematic staff-referencing policy
DROP POLICY IF EXISTS "Staff can view elements" ON restaurant_elements;

-- Create a simpler policy that doesn't reference the staff table
-- This policy allows authenticated users to view elements for restaurants they own
CREATE POLICY "Authenticated users can view elements" ON restaurant_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_elements.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Update the get_restaurant_elements function to be more secure
CREATE OR REPLACE FUNCTION get_restaurant_elements(p_restaurant_id UUID)
RETURNS TABLE (
  id UUID,
  restaurant_id UUID,
  type TEXT,
  name TEXT,
  x INTEGER,
  y INTEGER,
  width INTEGER,
  height INTEGER,
  rotation INTEGER,
  color TEXT,
  icon TEXT,
  locked BOOLEAN,
  visible BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Security check: ensure user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
    AND r.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: restaurant not found or not owned by user';
  END IF;

  RETURN QUERY
  SELECT 
    re.id,
    re.restaurant_id,
    re.type,
    re.name,
    re.x,
    re.y,
    re.width,
    re.height,
    re.rotation,
    re.color,
    re.icon,
    re.locked,
    re.visible,
    re.created_at,
    re.updated_at
  FROM restaurant_elements re
  WHERE re.restaurant_id = p_restaurant_id
  ORDER BY re.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the upsert_restaurant_elements function to be more secure
CREATE OR REPLACE FUNCTION upsert_restaurant_elements(
  p_restaurant_id UUID,
  p_elements JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  element JSONB;
BEGIN
  -- Security check: ensure user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
    AND r.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: restaurant not found or not owned by user';
  END IF;

  -- Delete existing elements for this restaurant
  DELETE FROM restaurant_elements WHERE restaurant_id = p_restaurant_id;

  -- Insert new elements
  FOR element IN SELECT * FROM jsonb_array_elements(p_elements)
  LOOP
    INSERT INTO restaurant_elements (
      restaurant_id,
      type,
      name,
      x,
      y,
      width,
      height,
      rotation,
      color,
      icon,
      locked,
      visible
    ) VALUES (
      p_restaurant_id,
      (element->>'type')::TEXT,
      (element->>'name')::TEXT,
      (element->>'x')::INTEGER,
      (element->>'y')::INTEGER,
      (element->>'width')::INTEGER,
      (element->>'height')::INTEGER,
      (element->>'rotation')::INTEGER,
      (element->>'color')::TEXT,
      (element->>'icon')::TEXT,
      (element->>'locked')::BOOLEAN,
      (element->>'visible')::BOOLEAN
    );
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_restaurant_elements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_restaurant_elements(UUID, JSONB) TO authenticated; 
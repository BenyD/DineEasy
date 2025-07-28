-- Add restaurant_elements table to store layout elements
CREATE TABLE IF NOT EXISTS restaurant_elements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrance', 'kitchen', 'bar', 'bathroom', 'counter', 'storage')),
  name TEXT NOT NULL,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 80,
  height INTEGER NOT NULL DEFAULT 60,
  rotation INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#10b981',
  icon TEXT NOT NULL DEFAULT 'Building2',
  locked BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_elements_restaurant_id ON restaurant_elements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_elements_type ON restaurant_elements(type);

-- Add RLS policies for restaurant_elements
ALTER TABLE restaurant_elements ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can manage their own elements
CREATE POLICY "Restaurant owners can manage elements" ON restaurant_elements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_elements.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Staff with table.manage permissions can view elements
CREATE POLICY "Staff can view elements" ON restaurant_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.restaurant_id = restaurant_elements.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
      AND 'tables.manage' = ANY(s.permissions)
    )
  );

-- Function to get restaurant elements
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

-- Function to upsert restaurant elements
CREATE OR REPLACE FUNCTION upsert_restaurant_elements(
  p_restaurant_id UUID,
  p_elements JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  element JSONB;
BEGIN
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
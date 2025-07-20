-- Add table layout position fields
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS layout_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layout_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layout_rotation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layout_width INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS layout_height INTEGER DEFAULT 80;

-- Add index for layout queries
CREATE INDEX IF NOT EXISTS idx_tables_layout ON tables(layout_x, layout_y);

-- Function to update table layout positions
CREATE OR REPLACE FUNCTION update_table_layout(
  table_id UUID,
  x_pos INTEGER,
  y_pos INTEGER,
  rotation INTEGER DEFAULT 0,
  width INTEGER DEFAULT 120,
  height INTEGER DEFAULT 80
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tables 
  SET 
    layout_x = x_pos,
    layout_y = y_pos,
    layout_rotation = rotation,
    layout_width = width,
    layout_height = height,
    updated_at = NOW()
  WHERE id = table_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk update table layouts
CREATE OR REPLACE FUNCTION bulk_update_table_layouts(
  layout_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  layout_item JSONB;
BEGIN
  FOR layout_item IN SELECT * FROM jsonb_array_elements(layout_data)
  LOOP
    UPDATE tables 
    SET 
      layout_x = (layout_item->>'x')::INTEGER,
      layout_y = (layout_item->>'y')::INTEGER,
      layout_rotation = (layout_item->>'rotation')::INTEGER,
      layout_width = (layout_item->>'width')::INTEGER,
      layout_height = (layout_item->>'height')::INTEGER,
      updated_at = NOW()
    WHERE id = (layout_item->>'id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for layout fields
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Policy to allow restaurant owners to update their table layouts
CREATE POLICY "Users can update their table layouts" ON tables
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy to allow restaurant owners to view their table layouts
CREATE POLICY "Users can view their table layouts" ON tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM staff 
      WHERE user_id = auth.uid() AND is_active = true
    )
  ); 
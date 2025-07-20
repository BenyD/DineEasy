-- Enable real-time for menu tables
-- This is required for Supabase real-time to work properly

-- Enable real-time for menu_items table
ALTER TABLE menu_items REPLICA IDENTITY FULL;

-- Enable real-time for menu_categories table  
ALTER TABLE menu_categories REPLICA IDENTITY FULL;

-- Enable real-time for allergens table
ALTER TABLE allergens REPLICA IDENTITY FULL;

-- Add comments for clarity
COMMENT ON TABLE menu_items IS 'Menu items table with real-time enabled';
COMMENT ON TABLE menu_categories IS 'Menu categories table with real-time enabled';
COMMENT ON TABLE allergens IS 'Allergens table with real-time enabled'; 
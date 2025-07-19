-- Add default categories and allergens for new restaurants
-- This will be used when a new restaurant is created

-- Create a function to add default menu data for a restaurant
CREATE OR REPLACE FUNCTION add_default_menu_data(restaurant_id uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (restaurant_id, 'Mains', 'Main course dishes', 2),
    (restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (restaurant_id, 'Drinks', 'Beverages and cocktails', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (restaurant_id, 'Gluten', '🌾'),
    (restaurant_id, 'Dairy', '🥛'),
    (restaurant_id, 'Eggs', '🥚'),
    (restaurant_id, 'Nuts', '🥜'),
    (restaurant_id, 'Soy', '🫘'),
    (restaurant_id, 'Shellfish', '🦐'),
    (restaurant_id, 'Fish', '🐟'),
    (restaurant_id, 'Sulfites', '🍷')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically add default menu data when a restaurant is created
CREATE OR REPLACE FUNCTION trigger_add_default_menu_data()
RETURNS trigger AS $$
BEGIN
  PERFORM add_default_menu_data(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS add_default_menu_data_trigger ON restaurants;
CREATE TRIGGER add_default_menu_data_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_default_menu_data(); 
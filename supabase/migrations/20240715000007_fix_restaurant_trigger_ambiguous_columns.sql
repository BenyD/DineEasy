-- Fix ambiguous column reference in restaurant trigger function
-- The issue is that 'restaurant_id' is ambiguous between function parameter and table column

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS add_default_menu_data_trigger ON restaurants;

-- Drop the existing functions
DROP FUNCTION IF EXISTS trigger_add_default_menu_data();
DROP FUNCTION IF EXISTS add_default_menu_data(uuid);

-- Recreate the function with explicit parameter naming
CREATE OR REPLACE FUNCTION add_default_menu_data(p_restaurant_id uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (p_restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (p_restaurant_id, 'Mains', 'Main course dishes', 2),
    (p_restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (p_restaurant_id, 'Drinks', 'Beverages and drinks', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (p_restaurant_id, 'Gluten', '🌾'),
    (p_restaurant_id, 'Dairy', '🥛'),
    (p_restaurant_id, 'Eggs', '🥚'),
    (p_restaurant_id, 'Nuts', '🥜'),
    (p_restaurant_id, 'Soy', '🫘'),
    (p_restaurant_id, 'Shellfish', '🦐'),
    (p_restaurant_id, 'Fish', '🐟'),
    (p_restaurant_id, 'Sulfites', '🍷'),
    (p_restaurant_id, 'Peanuts', '🥜'),
    (p_restaurant_id, 'Tree Nuts', '🌰'),
    (p_restaurant_id, 'Wheat', '🌾'),
    (p_restaurant_id, 'Lactose', '🥛'),
    (p_restaurant_id, 'Molluscs', '🦪'),
    (p_restaurant_id, 'Celery', '🥬'),
    (p_restaurant_id, 'Mustard', '🌶️'),
    (p_restaurant_id, 'Sesame', '⚪'),
    (p_restaurant_id, 'Lupin', '🫘'),
    (p_restaurant_id, 'Crustaceans', '🦞')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION trigger_add_default_menu_data()
RETURNS trigger AS $$
BEGIN
  PERFORM add_default_menu_data(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER add_default_menu_data_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_default_menu_data();

-- Also fix the ensure_default_menu_data function
DROP FUNCTION IF EXISTS ensure_default_menu_data(uuid);

CREATE OR REPLACE FUNCTION ensure_default_menu_data(p_restaurant_id uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories if they don't exist
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (p_restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (p_restaurant_id, 'Mains', 'Main course dishes', 2),
    (p_restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (p_restaurant_id, 'Drinks', 'Beverages and drinks', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens if they don't exist
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (p_restaurant_id, 'Gluten', '🌾'),
    (p_restaurant_id, 'Dairy', '🥛'),
    (p_restaurant_id, 'Eggs', '🥚'),
    (p_restaurant_id, 'Nuts', '🥜'),
    (p_restaurant_id, 'Soy', '🫘'),
    (p_restaurant_id, 'Shellfish', '🦐'),
    (p_restaurant_id, 'Fish', '🐟'),
    (p_restaurant_id, 'Sulfites', '🍷')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 
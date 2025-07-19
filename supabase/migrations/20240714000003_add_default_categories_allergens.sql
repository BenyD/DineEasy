-- Function to add default categories and allergens for a restaurant
CREATE OR REPLACE FUNCTION add_default_menu_data(restaurant_id uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (restaurant_id, 'Mains', 'Main course dishes', 2),
    (restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (restaurant_id, 'Drinks', 'Beverages and drinks', 4)
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
    (restaurant_id, 'Sulfites', '🍷'),
    (restaurant_id, 'Peanuts', '🥜'),
    (restaurant_id, 'Tree Nuts', '🌰'),
    (restaurant_id, 'Wheat', '🌾'),
    (restaurant_id, 'Lactose', '🥛'),
    (restaurant_id, 'Molluscs', '🦪'),
    (restaurant_id, 'Celery', '🥬'),
    (restaurant_id, 'Mustard', '🌶️'),
    (restaurant_id, 'Sesame', '⚪'),
    (restaurant_id, 'Lupin', '🫘'),
    (restaurant_id, 'Crustaceans', '🦞')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add default menu data when a restaurant is created
CREATE OR REPLACE FUNCTION trigger_add_default_menu_data()
RETURNS trigger AS $$
BEGIN
  PERFORM add_default_menu_data(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS add_default_menu_data_trigger ON restaurants;
CREATE TRIGGER add_default_menu_data_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_default_menu_data();

-- Add default menu data for ALL existing restaurants (regardless of whether they have data or not)
INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
SELECT r.id, 'Starters', 'Appetizers and small plates', 1
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM menu_categories mc 
  WHERE mc.restaurant_id = r.id AND mc.name = 'Starters'
)
UNION ALL
SELECT r.id, 'Mains', 'Main course dishes', 2
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM menu_categories mc 
  WHERE mc.restaurant_id = r.id AND mc.name = 'Mains'
)
UNION ALL
SELECT r.id, 'Desserts', 'Sweet treats and desserts', 3
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM menu_categories mc 
  WHERE mc.restaurant_id = r.id AND mc.name = 'Desserts'
)
UNION ALL
SELECT r.id, 'Drinks', 'Beverages and drinks', 4
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM menu_categories mc 
  WHERE mc.restaurant_id = r.id AND mc.name = 'Drinks'
);

-- Add default allergens for ALL existing restaurants (regardless of whether they have data or not)
INSERT INTO allergens (restaurant_id, name, icon)
SELECT r.id, 'Gluten', '🌾'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Gluten'
)
UNION ALL
SELECT r.id, 'Dairy', '🥛'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Dairy'
)
UNION ALL
SELECT r.id, 'Eggs', '🥚'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Eggs'
)
UNION ALL
SELECT r.id, 'Nuts', '🥜'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Nuts'
)
UNION ALL
SELECT r.id, 'Soy', '🫘'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Soy'
)
UNION ALL
SELECT r.id, 'Shellfish', '🦐'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Shellfish'
)
UNION ALL
SELECT r.id, 'Fish', '🐟'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Fish'
)
UNION ALL
SELECT r.id, 'Sulfites', '🍷'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Sulfites'
)
UNION ALL
SELECT r.id, 'Peanuts', '🥜'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Peanuts'
)
UNION ALL
SELECT r.id, 'Tree Nuts', '🌰'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Tree Nuts'
)
UNION ALL
SELECT r.id, 'Wheat', '🌾'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Wheat'
)
UNION ALL
SELECT r.id, 'Lactose', '🥛'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Lactose'
)
UNION ALL
SELECT r.id, 'Molluscs', '🦪'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Molluscs'
)
UNION ALL
SELECT r.id, 'Celery', '🥬'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Celery'
)
UNION ALL
SELECT r.id, 'Mustard', '🌶️'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Mustard'
)
UNION ALL
SELECT r.id, 'Sesame', '⚪'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Sesame'
)
UNION ALL
SELECT r.id, 'Lupin', '🫘'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Lupin'
)
UNION ALL
SELECT r.id, 'Crustaceans', '🦞'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM allergens a 
  WHERE a.restaurant_id = r.id AND a.name = 'Crustaceans'
);

-- Create a function to ensure default data exists for a restaurant
CREATE OR REPLACE FUNCTION ensure_default_menu_data(restaurant_id uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories if they don't exist
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (restaurant_id, 'Mains', 'Main course dishes', 2),
    (restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (restaurant_id, 'Drinks', 'Beverages and drinks', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens if they don't exist
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
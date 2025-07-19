-- Add is_popular field to menu_items table
ALTER TABLE menu_items 
ADD COLUMN is_popular boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.is_popular IS 'Whether this menu item is marked as popular/featured'; 
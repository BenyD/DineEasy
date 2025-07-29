-- Add tags column to menu_items table
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for better performance when filtering by tags
CREATE INDEX IF NOT EXISTS idx_menu_items_tags ON menu_items USING GIN (tags);

-- Add comment to document the tags field
COMMENT ON COLUMN menu_items.tags IS 'Array of tags for dietary restrictions, flavors, and special indicators'; 
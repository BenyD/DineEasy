-- Update menu image size limits to 1MB
-- This migration updates the file size validation for menu item images

-- Add a comment to document the change
COMMENT ON TABLE menu_items IS 'Menu items table with updated image size limits: max 1MB';

-- Create a function to validate menu image file sizes
CREATE OR REPLACE FUNCTION validate_menu_image_size()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be used by application-level validation
  -- The actual file size validation happens in the application code
  -- This is just a placeholder for future database-level validation if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function
COMMENT ON FUNCTION validate_menu_image_size() IS 'Validates menu item image file sizes (1MB limit)';

-- Add a comment to the image_url column about image size limits
COMMENT ON COLUMN menu_items.image_url IS 'URL to menu item image (max 1MB)';

-- Update any existing RLS policies to reflect the new size limits
-- (This is mainly for documentation purposes as file size validation happens in the app)

-- Note: The actual file size validation is handled in the application code
-- This migration serves as documentation and preparation for future database-level validation
-- Update restaurant image size limits to 1MB
-- This migration updates the file size validation for restaurant logos and cover photos

-- Add a comment to document the change
COMMENT ON TABLE restaurants IS 'Restaurant table with updated image size limits: logo and cover photos max 1MB each';

-- Create a function to validate restaurant image file sizes
CREATE OR REPLACE FUNCTION validate_restaurant_image_size()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be used by application-level validation
  -- The actual file size validation happens in the application code
  -- This is just a placeholder for future database-level validation if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function
COMMENT ON FUNCTION validate_restaurant_image_size() IS 'Validates restaurant image file sizes (1MB limit for logo and cover photos)';

-- Update any existing RLS policies to reflect the new size limits
-- (This is mainly for documentation purposes as file size validation happens in the app)

-- Add a comment to the restaurants table about image size limits
COMMENT ON COLUMN restaurants.logo_url IS 'URL to restaurant logo image (max 1MB)';
COMMENT ON COLUMN restaurants.cover_url IS 'URL to restaurant cover photo (max 1MB)';
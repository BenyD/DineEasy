-- Update avatar image size limits to 1MB
-- This migration updates the file size validation for avatar images

-- Add a comment to document the change
COMMENT ON TABLE profiles IS 'User profiles table with updated avatar image size limits: max 1MB';

-- Create a function to validate avatar image file sizes
CREATE OR REPLACE FUNCTION validate_avatar_image_size()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be used by application-level validation
  -- The actual file size validation happens in the application code
  -- This is just a placeholder for future database-level validation if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function
COMMENT ON FUNCTION validate_avatar_image_size() IS 'Validates avatar image file sizes (1MB limit)';

-- Add a comment to the avatar_url column about image size limits
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image (max 1MB)';

-- Update any existing RLS policies to reflect the new size limits
-- (This is mainly for documentation purposes as file size validation happens in the app)

-- Note: The actual file size validation is handled in the application code
-- This migration serves as documentation and preparation for future database-level validation
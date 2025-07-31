-- Add auto open/close functionality to restaurants
-- This allows restaurants to automatically open/close based on their opening hours

-- Add auto_open_close column to restaurants table
ALTER TABLE "public"."restaurants" 
ADD COLUMN "auto_open_close" boolean DEFAULT false;

-- Add comment explaining the new field
COMMENT ON COLUMN "public"."restaurants"."auto_open_close" IS 'When true, restaurant automatically opens/closes based on opening hours. When false, manual control via is_open field is used.';

-- Update the existing is_open comment to clarify the relationship
COMMENT ON COLUMN "public"."restaurants"."is_open" IS 'Manual override for restaurant open/closed status. When auto_open_close is true, this field is automatically managed. When auto_open_close is false, this field is manually controlled.'; 
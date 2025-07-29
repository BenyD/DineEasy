-- Simplify restaurant types to fewer, more generic options
-- This migration reduces the restaurant_type enum to essential categories

-- First, update any existing restaurants that have types we're removing
UPDATE restaurants 
SET type = 'restaurant' 
WHERE type IN ('pizzeria', 'sushi', 'steakhouse', 'bakery', 'brewery', 'food-court', 'catering', 'ghost-kitchen');

-- Create a new simplified enum type with a different name
CREATE TYPE "public"."restaurant_type_new" AS ENUM (
    'restaurant',
    'cafe',
    'bar',
    'food-truck'
);

-- Add comment to the new enum
COMMENT ON TYPE "public"."restaurant_type_new" IS 'Simplified restaurant type enum with essential categories';

-- Update the restaurants table to use the new enum
ALTER TABLE "public"."restaurants" 
ALTER COLUMN "type" TYPE "public"."restaurant_type_new" 
USING "type"::text::"public"."restaurant_type_new";

-- Drop the old enum type
DROP TYPE "public"."restaurant_type";

-- Rename the new enum to the original name
ALTER TYPE "public"."restaurant_type_new" RENAME TO "restaurant_type";

-- Update the comment on the column
COMMENT ON COLUMN "public"."restaurants"."type" IS 'Type of restaurant establishment - simplified to essential categories'; 
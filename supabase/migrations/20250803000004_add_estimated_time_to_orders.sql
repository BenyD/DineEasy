-- Add estimated_time field to orders table
-- This field will store the estimated time in minutes for order preparation/delivery

ALTER TABLE "public"."orders" 
ADD COLUMN "estimated_time" integer DEFAULT 15;

-- Add comment to explain the field
COMMENT ON COLUMN "public"."orders"."estimated_time" IS 'Estimated time in minutes for order preparation/delivery';

-- Update existing orders to have the default estimated time
UPDATE "public"."orders" 
SET "estimated_time" = 15 
WHERE "estimated_time" IS NULL; 
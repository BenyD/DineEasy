-- Add customer columns to orders table
ALTER TABLE "public"."orders" 
ADD COLUMN "customer_name" "text",
ADD COLUMN "customer_email" "text";

-- Add comments for the new columns
COMMENT ON COLUMN "public"."orders"."customer_name" IS 'Customer name for QR orders';
COMMENT ON COLUMN "public"."orders"."customer_email" IS 'Customer email for QR orders';

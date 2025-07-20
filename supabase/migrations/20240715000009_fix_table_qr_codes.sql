-- Fix existing table QR codes to use table ID instead of table number
-- This migration updates all existing tables to have correct QR code URLs

-- Function to generate correct QR code URL for a table
CREATE OR REPLACE FUNCTION generate_correct_qr_url(table_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'https://dineeasy.ch/qr/' || table_uuid::text;
END;
$$;

-- Update all existing tables with correct QR code URLs
UPDATE tables 
SET 
  qr_code = generate_correct_qr_url(id),
  updated_at = NOW()
WHERE qr_code IS NULL 
   OR qr_code NOT LIKE 'https://dineeasy.ch/qr/%'
   OR qr_code NOT LIKE '%' || id::text;

-- Drop the temporary function
DROP FUNCTION IF EXISTS generate_correct_qr_url(UUID);

-- Add comment for documentation
COMMENT ON COLUMN tables.qr_code IS 'QR code URL that links to the table-specific ordering page using table ID'; 
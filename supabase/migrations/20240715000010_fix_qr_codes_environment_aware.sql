-- Fix QR codes to be environment-aware
-- This migration updates all existing QR codes to use environment variables instead of hardcoded URLs

-- Function to generate environment-aware QR code URL
CREATE OR REPLACE FUNCTION generate_environment_aware_qr_url(table_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Check if we're in development (you can set this via environment variable)
  -- For now, we'll use a function that can be called with the current environment
  -- In production, this should be set via environment variable
  base_url := COALESCE(
    current_setting('app.base_url', true),
    'https://dineeasy.ch'
  );
  
  RETURN base_url || '/qr/' || table_uuid::text;
END;
$$;

-- Update all existing QR codes to use environment-aware URLs
-- This will replace hardcoded URLs with the current environment's base URL
UPDATE tables 
SET 
  qr_code = generate_environment_aware_qr_url(id),
  updated_at = NOW()
WHERE qr_code IS NOT NULL 
   AND (qr_code LIKE 'https://dineeasy.ch/qr/%' OR qr_code LIKE 'http://localhost:3000/qr/%');

-- Drop the temporary function
DROP FUNCTION IF EXISTS generate_environment_aware_qr_url(UUID);

-- Add comment for documentation
COMMENT ON COLUMN tables.qr_code IS 'QR code URL that links to the table-specific ordering page using environment-aware base URL';

-- Create a function to update QR codes when environment changes
CREATE OR REPLACE FUNCTION update_qr_codes_for_environment(new_base_url TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE tables 
  SET 
    qr_code = new_base_url || '/qr/' || id::text,
    updated_at = NOW()
  WHERE qr_code IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_qr_codes_for_environment(TEXT) TO authenticated;

-- Add a trigger to automatically update QR codes when tables are created
CREATE OR REPLACE FUNCTION ensure_qr_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Get the base URL from environment or use default
  base_url := COALESCE(
    current_setting('app.base_url', true),
    'https://dineeasy.ch'
  );
  
  -- If QR code is not set, set it automatically
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := base_url || '/qr/' || NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_qr_code_trigger ON tables;
CREATE TRIGGER ensure_qr_code_trigger
  BEFORE INSERT ON tables
  FOR EACH ROW
  EXECUTE FUNCTION ensure_qr_code_on_insert();

-- Add RLS policy for the new function
GRANT EXECUTE ON FUNCTION ensure_qr_code_on_insert() TO authenticated; 
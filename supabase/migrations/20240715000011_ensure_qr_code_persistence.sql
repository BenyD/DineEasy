-- Migration: Ensure QR code persistence
-- This migration removes automatic QR code updates and ensures QR codes only change when manually regenerated

-- Drop the automatic QR code update trigger
DROP TRIGGER IF EXISTS ensure_qr_code_trigger ON tables;

-- Drop the function that automatically updates QR codes
DROP FUNCTION IF EXISTS ensure_qr_code_on_insert();

-- Create a new function that only sets QR code if it's NULL (for new tables only)
CREATE OR REPLACE FUNCTION set_qr_code_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    -- Only set QR code if it's NULL (for new tables)
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := base_url || '/qr/' || NEW.id::text;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that only sets QR code on insert if it's NULL
DROP TRIGGER IF EXISTS set_qr_code_trigger ON tables;
CREATE TRIGGER set_qr_code_trigger
    BEFORE INSERT ON tables
    FOR EACH ROW
    EXECUTE FUNCTION set_qr_code_on_insert();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_qr_code_on_insert() TO authenticated;

-- Add a comment to the qr_code column explaining persistence
COMMENT ON COLUMN tables.qr_code IS 'QR code URL that links to the table-specific ordering page. This URL is persistent and only changes when manually regenerated.';

-- Create a function to check if QR code needs updating (for manual checks only)
CREATE OR REPLACE FUNCTION check_qr_code_status(table_uuid UUID)
RETURNS TABLE(
    table_id UUID,
    table_number TEXT,
    current_qr_code TEXT,
    expected_qr_code TEXT,
    needs_update BOOLEAN
) AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    RETURN QUERY
    SELECT 
        t.id,
        t.number,
        t.qr_code,
        base_url || '/qr/' || t.id::text as expected_qr_code,
        (t.qr_code IS NULL OR t.qr_code != (base_url || '/qr/' || t.id::text)) as needs_update
    FROM tables t
    WHERE t.id = table_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_qr_code_status(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION check_qr_code_status(UUID) IS 'Check if a table QR code needs updating without actually updating it. Returns current and expected QR codes for comparison.';

-- Create a function to manually regenerate QR code (for explicit regeneration only)
CREATE OR REPLACE FUNCTION regenerate_qr_code(table_uuid UUID)
RETURNS TABLE(
    table_id UUID,
    table_number TEXT,
    old_qr_code TEXT,
    new_qr_code TEXT,
    success BOOLEAN
) AS $$
DECLARE
    base_url TEXT;
    old_code TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    -- Get the old QR code
    SELECT qr_code INTO old_code
    FROM tables
    WHERE id = table_uuid;
    
    -- Update the QR code
    UPDATE tables
    SET 
        qr_code = base_url || '/qr/' || id::text,
        updated_at = NOW()
    WHERE id = table_uuid;
    
    -- Return the result
    RETURN QUERY
    SELECT 
        t.id,
        t.number,
        old_code,
        t.qr_code,
        (t.qr_code = base_url || '/qr/' || t.id::text) as success
    FROM tables t
    WHERE t.id = table_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION regenerate_qr_code(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION regenerate_qr_code(UUID) IS 'Manually regenerate QR code for a specific table. This is the only way QR codes should be changed after initial creation.';

-- Update existing tables to ensure they have correct QR codes (one-time fix)
UPDATE tables 
SET qr_code = COALESCE(
    current_setting('app.settings.base_url', true),
    'https://dineeasy.ch'
) || '/qr/' || id::text
WHERE qr_code IS NULL 
   OR qr_code NOT LIKE '%/qr/%'
   OR qr_code NOT LIKE '%' || id::text;

-- Add a constraint to ensure QR codes follow the correct format
ALTER TABLE tables 
ADD CONSTRAINT qr_code_format_check 
CHECK (qr_code IS NULL OR qr_code ~ '^https?://[^/]+/qr/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT qr_code_format_check ON tables IS 'Ensures QR codes follow the correct format: base_url/qr/table_uuid'; 
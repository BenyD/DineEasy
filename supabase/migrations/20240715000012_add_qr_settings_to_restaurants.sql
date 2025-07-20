-- Add QR settings columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS qr_settings jsonb DEFAULT '{
  "width": 256,
  "margin": 2,
  "errorCorrectionLevel": "M",
  "colorDark": "#1F2937",
  "colorLight": "#FFFFFF",
  "includeLogo": false,
  "logoSize": 50,
  "logoOpacity": 0.8,
  "defaultExportFormat": "png",
  "defaultExportSize": 512,
  "defaultPreviewMode": "mobile",
  "autoRegenerateOnChange": true,
  "showQRCodeInfo": true
}'::jsonb;

-- Add comment to explain the QR settings structure
COMMENT ON COLUMN restaurants.qr_settings IS 'JSON object containing QR code generation settings for the restaurant';

-- Create function to update QR settings
CREATE OR REPLACE FUNCTION update_restaurant_qr_settings(
  restaurant_id uuid,
  qr_settings jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE restaurants 
  SET 
    qr_settings = qr_settings,
    updated_at = timezone('utc'::text, now())
  WHERE id = restaurant_id;
  
  -- Log the QR settings update
  INSERT INTO activity_logs (
    restaurant_id,
    user_id,
    type,
    action,
    description,
    metadata
  ) VALUES (
    restaurant_id,
    auth.uid(),
    'settings',
    'qr_settings_updated',
    'Updated QR code settings',
    jsonb_build_object('qr_settings', qr_settings)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_restaurant_qr_settings(uuid, jsonb) TO authenticated;

-- Create function to get QR settings for a restaurant
CREATE OR REPLACE FUNCTION get_restaurant_qr_settings(restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT qr_settings 
    FROM restaurants 
    WHERE id = restaurant_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_restaurant_qr_settings(uuid) TO authenticated; 
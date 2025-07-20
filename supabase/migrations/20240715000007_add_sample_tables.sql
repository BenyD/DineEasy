-- Add sample tables for testing
-- This migration adds some sample tables to restaurants for testing the tables dashboard

-- Function to add sample tables to a restaurant
CREATE OR REPLACE FUNCTION add_sample_tables(restaurant_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add sample tables
  INSERT INTO tables (restaurant_id, number, capacity, status, qr_code, is_active)
  VALUES 
    (restaurant_uuid, '1', 4, 'available', generate_qr_code_url('1', restaurant_uuid), true),
    (restaurant_uuid, '2', 2, 'available', generate_qr_code_url('2', restaurant_uuid), true),
    (restaurant_uuid, '3', 6, 'occupied', generate_qr_code_url('3', restaurant_uuid), true),
    (restaurant_uuid, '4', 4, 'available', generate_qr_code_url('4', restaurant_uuid), true),
    (restaurant_uuid, '5', 8, 'reserved', generate_qr_code_url('5', restaurant_uuid), true),
    (restaurant_uuid, '6', 2, 'available', generate_qr_code_url('6', restaurant_uuid), true),
    (restaurant_uuid, '7', 4, 'unavailable', generate_qr_code_url('7', restaurant_uuid), true),
    (restaurant_uuid, '8', 6, 'available', generate_qr_code_url('8', restaurant_uuid), true);
END;
$$;

-- Function to generate QR code URL
CREATE OR REPLACE FUNCTION generate_qr_code_url(table_number TEXT, restaurant_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'https://dineeasy.ch/qr/' || restaurant_uuid::text || '/' || table_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_sample_tables(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code_url(TEXT, UUID) TO authenticated;

-- Add sample tables to existing restaurants (optional - uncomment if needed)
-- SELECT add_sample_tables(id) FROM restaurants WHERE owner_id IS NOT NULL; 
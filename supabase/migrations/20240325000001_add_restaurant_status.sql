-- Add manual restaurant status column
ALTER TABLE restaurants 
ADD COLUMN is_open boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.is_open IS 'Manual override for restaurant open/closed status. When true, restaurant is manually set to open. When false, restaurant is manually set to closed.';

-- Create index for better query performance
CREATE INDEX idx_restaurants_is_open ON restaurants(is_open); 
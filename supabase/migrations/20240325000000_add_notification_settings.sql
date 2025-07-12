-- Add notification_settings column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN notification_settings jsonb DEFAULT '{
  "newOrders": true,
  "paymentReceived": true,
  "tableRequests": true,
  "kitchenUpdates": false,
  "playSound": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.notification_settings IS 'JSON object storing user notification preferences'; 
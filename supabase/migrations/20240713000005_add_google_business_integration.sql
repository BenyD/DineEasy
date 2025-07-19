-- Add Google Business integration fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN google_business_id TEXT,
ADD COLUMN google_business_access_token TEXT,
ADD COLUMN google_business_refresh_token TEXT,
ADD COLUMN google_business_token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN google_business_sync_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN google_business_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN google_business_location_id TEXT;

-- Add index for Google Business ID
CREATE INDEX idx_restaurants_google_business_id ON restaurants(google_business_id);

-- Add RLS policy for Google Business fields
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Policy to allow restaurant owners to manage their Google Business integration
CREATE POLICY "Users can manage their own Google Business integration" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create table for Google Business reviews
CREATE TABLE google_business_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  google_review_id TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_time TIMESTAMP WITH TIME ZONE,
  reply_text TEXT,
  reply_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(restaurant_id, google_review_id)
);

-- Add indexes for reviews
CREATE INDEX idx_google_business_reviews_restaurant_id ON google_business_reviews(restaurant_id);
CREATE INDEX idx_google_business_reviews_rating ON google_business_reviews(rating);
CREATE INDEX idx_google_business_reviews_review_time ON google_business_reviews(review_time);

-- Enable RLS on reviews table
ALTER TABLE google_business_reviews ENABLE ROW LEVEL SECURITY;

-- Policy for restaurant owners to view their reviews
CREATE POLICY "Restaurant owners can view their Google Business reviews" ON google_business_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = google_business_reviews.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Policy for restaurant owners to update their review replies
CREATE POLICY "Restaurant owners can update their review replies" ON google_business_reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = google_business_reviews.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Create table for Google Business insights
CREATE TABLE google_business_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(restaurant_id, date, metric_name)
);

-- Add indexes for insights
CREATE INDEX idx_google_business_insights_restaurant_id ON google_business_insights(restaurant_id);
CREATE INDEX idx_google_business_insights_date ON google_business_insights(date);
CREATE INDEX idx_google_business_insights_metric ON google_business_insights(metric_name);

-- Enable RLS on insights table
ALTER TABLE google_business_insights ENABLE ROW LEVEL SECURITY;

-- Policy for restaurant owners to view their insights
CREATE POLICY "Restaurant owners can view their Google Business insights" ON google_business_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = google_business_insights.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_business_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_google_business_reviews_updated_at
  BEFORE UPDATE ON google_business_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_google_business_reviews_updated_at(); 
-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_source TEXT DEFAULT 'website',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Add comments for documentation
COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter subscription management for DineEasy marketing communications';
COMMENT ON COLUMN newsletter_subscriptions.email IS 'Unique email address for the subscriber';
COMMENT ON COLUMN newsletter_subscriptions.first_name IS 'Optional first name of the subscriber';
COMMENT ON COLUMN newsletter_subscriptions.last_name IS 'Optional last name of the subscriber';
COMMENT ON COLUMN newsletter_subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN newsletter_subscriptions.subscription_source IS 'Source of the subscription (website, admin, etc.)';
COMMENT ON COLUMN newsletter_subscriptions.preferences IS 'JSON object containing subscriber preferences (frequency, categories, etc.)';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribed_at IS 'Timestamp when the user unsubscribed';
COMMENT ON COLUMN newsletter_subscriptions.last_email_sent_at IS 'Timestamp of the last newsletter email sent to this subscriber';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_is_active ON newsletter_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_created_at ON newsletter_subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_last_email_sent_at ON newsletter_subscriptions(last_email_sent_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to newsletter_subscriptions
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert (subscribe)
CREATE POLICY "Allow public newsletter subscription" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own subscription
CREATE POLICY "Allow users to view own subscription" ON newsletter_subscriptions
  FOR SELECT USING (auth.email() = email);

-- Allow users to update their own subscription
CREATE POLICY "Allow users to update own subscription" ON newsletter_subscriptions
  FOR UPDATE USING (auth.email() = email);

-- Allow service role to manage all subscriptions (for admin panel)
CREATE POLICY "Allow service role full access" ON newsletter_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to subscribe to newsletter
CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
  subscriber_email TEXT,
  subscriber_first_name TEXT DEFAULT NULL,
  subscriber_last_name TEXT DEFAULT NULL,
  subscriber_source TEXT DEFAULT 'website'
)
RETURNS JSON AS $$
DECLARE
  existing_subscription UUID;
  new_subscription UUID;
  result JSON;
BEGIN
  -- Check if email already exists
  SELECT id INTO existing_subscription
  FROM newsletter_subscriptions
  WHERE email = subscriber_email;
  
  IF existing_subscription IS NOT NULL THEN
    -- Update existing subscription to active
    UPDATE newsletter_subscriptions
    SET 
      is_active = true,
      unsubscribed_at = NULL,
      updated_at = NOW(),
      first_name = COALESCE(subscriber_first_name, first_name),
      last_name = COALESCE(subscriber_last_name, last_name)
    WHERE id = existing_subscription;
    
    result := json_build_object(
      'success', true,
      'message', 'Email already subscribed. Subscription reactivated.',
      'subscription_id', existing_subscription,
      'action', 'reactivated'
    );
  ELSE
    -- Create new subscription
    INSERT INTO newsletter_subscriptions (
      email,
      first_name,
      last_name,
      subscription_source,
      is_active
    ) VALUES (
      subscriber_email,
      subscriber_first_name,
      subscriber_last_name,
      subscriber_source,
      true
    ) RETURNING id INTO new_subscription;
    
    result := json_build_object(
      'success', true,
      'message', 'Successfully subscribed to newsletter.',
      'subscription_id', new_subscription,
      'action', 'created'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unsubscribe from newsletter
CREATE OR REPLACE FUNCTION unsubscribe_from_newsletter(subscriber_email TEXT)
RETURNS JSON AS $$
DECLARE
  subscription_id UUID;
  result JSON;
BEGIN
  -- Find the subscription
  SELECT id INTO subscription_id
  FROM newsletter_subscriptions
  WHERE email = subscriber_email;
  
  IF subscription_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'message', 'Email not found in newsletter subscriptions.'
    );
  ELSE
    -- Mark as unsubscribed
    UPDATE newsletter_subscriptions
    SET 
      is_active = false,
      unsubscribed_at = NOW(),
      updated_at = NOW()
    WHERE id = subscription_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Successfully unsubscribed from newsletter.',
      'subscription_id', subscription_id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get active subscribers for newsletter sending
CREATE OR REPLACE FUNCTION get_active_newsletter_subscribers()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  preferences JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.id,
    ns.email,
    ns.first_name,
    ns.last_name,
    ns.preferences
  FROM newsletter_subscriptions ns
  WHERE ns.is_active = true
  ORDER BY ns.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON newsletter_subscriptions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION subscribe_to_newsletter(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION unsubscribe_from_newsletter(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_active_newsletter_subscribers() TO service_role;

-- Log the completion
DO $$
BEGIN
  RAISE LOG 'Created newsletter_subscriptions table with RLS policies and helper functions';
END $$; 
-- Fix email verification status handling
-- This migration ensures that email verification is properly enforced

-- Create a function to check if user has verified their email through our custom system
CREATE OR REPLACE FUNCTION is_email_verified(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_has_verified_record boolean;
BEGIN
  -- Check if user has any verified email verification records
  SELECT EXISTS(
    SELECT 1 
    FROM public.email_verifications 
    WHERE user_id = p_user_id 
      AND verified = true
  ) INTO v_has_verified_record;
  
  RETURN v_has_verified_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  has_verified_email boolean,
  verification_count integer,
  last_verification_attempt timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    is_email_verified(u.id) as has_verified_email,
    COUNT(ev.id)::integer as verification_count,
    MAX(ev.created_at) as last_verification_attempt
  FROM auth.users u
  LEFT JOIN public.email_verifications ev ON u.id = ev.user_id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_email_verified(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_verification_status(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION is_email_verified(uuid) IS 'Check if user has verified their email through our custom verification system';
COMMENT ON FUNCTION get_user_verification_status(uuid) IS 'Get comprehensive user verification status including verification attempts';

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Created email verification status functions';
END $$; 
-- Drop the existing function and recreate it with better error handling
drop function if exists verify_email(p_token text);

-- Create improved verify_email function
create or replace function verify_email(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_verification record;
  v_user_id uuid;
  v_token_count integer;
  v_expired_count integer;
  v_verified_count integer;
begin
  -- First, let's check what's in the database for debugging
  select count(*) into v_token_count
  from public.email_verifications
  where token = p_token;
  
  select count(*) into v_expired_count
  from public.email_verifications
  where token = p_token
    and expires_at <= now();
    
  select count(*) into v_verified_count
  from public.email_verifications
  where token = p_token
    and verified = true;

  -- Get verification record
  select * into v_verification
  from public.email_verifications
  where token = p_token
    and verified = false
    and expires_at > now();

  if not found then
    -- Return detailed error information for debugging
    return json_build_object(
      'success', false,
      'error', 'Invalid or expired verification token',
      'debug', json_build_object(
        'token_provided', p_token,
        'token_found', v_token_count > 0,
        'token_count', v_token_count,
        'expired_count', v_expired_count,
        'verified_count', v_verified_count
      )
    );
  end if;

  -- Mark as verified
  update public.email_verifications
  set verified = true,
      verified_at = now(),
      updated_at = now()
  where id = v_verification.id;

  -- Update user email_verified status
  update auth.users
  set email_confirmed_at = now(),
      updated_at = now()
  where id = v_verification.user_id;

  return json_build_object(
    'success', true,
    'user_id', v_verification.user_id
  );
end;
$$; 
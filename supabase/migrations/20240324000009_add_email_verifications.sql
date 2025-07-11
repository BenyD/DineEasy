-- Create email_verifications table
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token text not null,
  verified boolean default false,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists email_verifications_token_idx on public.email_verifications(token);
create index if not exists email_verifications_user_id_idx on public.email_verifications(user_id);

-- Add RLS policies
alter table public.email_verifications enable row level security;

-- Allow service role full access
create policy "Service role has full access to email verifications"
  on public.email_verifications
  for all
  to service_role
  using (true)
  with check (true);

-- Allow users to read their own verifications
create policy "Users can read their own email verifications"
  on public.email_verifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Create function to verify email
create or replace function verify_email(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_verification record;
  v_user_id uuid;
  v_result json;
begin
  -- Get verification record
  select * into v_verification
  from public.email_verifications
  where token = p_token
    and verified = false
    and expires_at > now();

  if not found then
    return json_build_object(
      'success', false,
      'error', 'Invalid or expired verification token'
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
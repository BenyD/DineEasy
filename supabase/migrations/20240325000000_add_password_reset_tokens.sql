-- Create password reset tokens table
create table if not exists public.password_reset_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.password_reset_tokens enable row level security;

-- Create RLS policies
create policy "Users can view their own password reset tokens" on public.password_reset_tokens
  for select using (auth.uid() = user_id);

create policy "Users can insert their own password reset tokens" on public.password_reset_tokens
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own password reset tokens" on public.password_reset_tokens
  for update using (auth.uid() = user_id);

-- Create function to verify and use password reset token
create or replace function verify_password_reset_token(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_reset_token record;
  v_user_id uuid;
  v_token_count integer;
  v_expired_count integer;
  v_used_count integer;
begin
  -- First, let's check what's in the database for debugging
  select count(*) into v_token_count
  from public.password_reset_tokens
  where token = p_token;
  
  select count(*) into v_expired_count
  from public.password_reset_tokens
  where token = p_token
    and expires_at <= now();
    
  select count(*) into v_used_count
  from public.password_reset_tokens
  where token = p_token
    and used = true;

  -- Get reset token record
  select * into v_reset_token
  from public.password_reset_tokens
  where token = p_token
    and used = false
    and expires_at > now();

  if not found then
    -- Return detailed error information for debugging
    return json_build_object(
      'success', false,
      'error', 'Invalid or expired password reset token',
      'debug', json_build_object(
        'token_provided', p_token,
        'token_found', v_token_count > 0,
        'token_count', v_token_count,
        'expired_count', v_expired_count,
        'used_count', v_used_count
      )
    );
  end if;

  -- Mark as used
  update public.password_reset_tokens
  set used = true,
      updated_at = now()
  where id = v_reset_token.id;

  return json_build_object(
    'success', true,
    'user_id', v_reset_token.user_id,
    'email', v_reset_token.email
  );
end;
$$;

-- Create index for better performance
create index if not exists idx_password_reset_tokens_token on public.password_reset_tokens(token);
create index if not exists idx_password_reset_tokens_user_id on public.password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_expires_at on public.password_reset_tokens(expires_at); 
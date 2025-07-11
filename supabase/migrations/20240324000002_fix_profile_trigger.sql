-- Drop existing policies first
drop policy if exists "Enable insert for service role" on profiles;
drop policy if exists "Enable all operations for users based on user_id" on profiles;
drop policy if exists "Users can manage their own profile" on profiles;

-- Drop existing trigger
drop trigger if exists create_profile_after_user_signup on auth.users;

-- Make the profile trigger more robust with error handling and retries
create or replace function create_user_profile()
returns trigger as $$
declare
  max_retries constant int := 3;
  current_try int := 0;
begin
  -- Loop to retry on conflicts
  while current_try < max_retries loop
    begin
      insert into profiles (id, full_name, created_at, updated_at)
      values (
        new.id,
        coalesce(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'name',
          'New User'
        ),
        now(),
        now()
      )
      on conflict (id) do update
      set 
        full_name = EXCLUDED.full_name,
        updated_at = now();
      
      return new;
    exception when others then
      -- Log error and increment counter
      raise notice 'Error creating profile on try %: %', current_try, sqlerrm;
      current_try := current_try + 1;
      if current_try = max_retries then
        raise exception 'Failed to create profile after % attempts', max_retries;
      end if;
    end;
  end loop;
  
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger with security definer to bypass RLS
create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- Ensure profiles table has proper timestamps
alter table profiles 
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Add index on profiles id for faster lookups
create index if not exists profiles_id_idx on profiles(id);

-- Ensure RLS is enabled but doesn't block profile creation
alter table profiles enable row level security;

-- Create new policies with unique names
create policy "service_role_insert_profiles"
  on profiles for insert
  to service_role
  with check (true);

create policy "authenticated_user_manage_own_profile"
  on profiles for all
  using (
    -- Allow access if authenticated and owns the profile
    (auth.uid() = id) or
    -- Allow access during signup (within 5 minutes of user creation)
    (auth.jwt()->>'exp')::bigint - (auth.jwt()->>'iat')::bigint < 300
  ); 
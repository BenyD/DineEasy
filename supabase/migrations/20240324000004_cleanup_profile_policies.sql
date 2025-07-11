-- Drop ALL existing profile policies
drop policy if exists "Enable insert for service role" on profiles;
drop policy if exists "Enable all operations for users based on user_id" on profiles;
drop policy if exists "Users can manage their own profile" on profiles;
drop policy if exists "authenticated_user_manage_own_profile" on profiles;
drop policy if exists "service_role_insert_profiles" on profiles;
drop policy if exists "Enable update for users based on user_id" on profiles;
drop policy if exists "Enable delete for users based on user_id" on profiles;
drop policy if exists "Enable select for users based on user_id" on profiles;

-- Drop and recreate the trigger function
drop trigger if exists create_profile_after_user_signup on auth.users;
drop function if exists create_user_profile();

-- Recreate the function with proper error handling
create or replace function create_user_profile()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  max_retries constant int := 3;
  current_try int := 0;
begin
  -- Loop to retry on conflicts
  while current_try < max_retries loop
    begin
      insert into public.profiles (id, full_name, created_at, updated_at)
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
        raise exception 'Failed to create profile after % attempts: %', max_retries, sqlerrm;
      end if;
      -- Small delay before retry
      perform pg_sleep(0.1);
    end;
  end loop;
  
  return new;
end;
$$;

-- Recreate trigger
create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- Ensure proper permissions
grant usage on schema public to service_role;
grant all on public.profiles to service_role;
grant all on public.profiles to authenticated;

-- Recreate minimal set of policies with unique names
create policy "profiles_service_role_insert"
  on public.profiles
  for insert
  to service_role
  with check (true);

create policy "profiles_user_read_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_user_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Add index for performance if it doesn't exist
create index if not exists profiles_id_idx on public.profiles(id);

-- Ensure RLS is enabled
alter table public.profiles enable row level security; 
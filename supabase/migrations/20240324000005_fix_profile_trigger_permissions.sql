-- Drop existing profile trigger and function
drop trigger if exists create_profile_after_user_signup on auth.users;
drop function if exists create_user_profile();

-- Recreate the function with proper error handling and permissions
create or replace function create_user_profile()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Only create profile if it doesn't exist
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, full_name)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        'New User'
      )
    );
  end if;
  return new;
exception
  when others then
    -- Log the error (you can view this in supabase logs)
    raise warning 'Error in create_user_profile: % %', SQLERRM, SQLSTATE;
    return new;
end;
$$;

-- Recreate the trigger
create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- Ensure proper permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;

-- Ensure public.profiles has proper permissions
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to service_role;

-- Ensure RLS is enabled but service_role can bypass
alter table public.profiles force row level security;
alter table public.profiles enable row level security;

-- Update RLS policies
drop policy if exists "Enable read access for users based on user_id" on profiles;
drop policy if exists "Enable insert access for service role" on profiles;
drop policy if exists "Enable update access for users based on user_id" on profiles;

create policy "Enable read access for users based on user_id"
  on profiles for select
  using (auth.uid() = id);

create policy "Enable insert for service role"
  on profiles for insert
  with check (true); -- Service role will bypass RLS anyway

create policy "Enable update for users based on user_id"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id); 
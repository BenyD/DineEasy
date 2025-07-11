-- Drop existing RLS policies for profiles
drop policy if exists "Enable all operations for users based on user_id" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

-- Make sure RLS is enabled
alter table profiles enable row level security;

-- Create new RLS policies for profiles
create policy "Enable read access for users based on user_id"
  on profiles for select
  using (auth.uid() = id);

create policy "Enable insert access for service role"
  on profiles for insert
  with check (auth.jwt()->>'role' = 'service_role' or auth.uid() = id);

create policy "Enable update access for users based on user_id"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on profiles to authenticated;

-- Grant necessary permissions to anon users
grant usage on schema public to anon;
grant select on profiles to anon; 
-- Drop the problematic trigger
drop trigger if exists create_profile_after_user_signup on auth.users;

-- Make the profile trigger more robust
create or replace function create_user_profile()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'New User'
    )
  );
  return new;
end;
$$ language plpgsql;

create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- Make subscription_status nullable initially
alter table restaurants
  alter column subscription_status drop not null;

-- Add insert policy for profiles
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Add insert policy for restaurants
create policy "Users can insert their own restaurant"
  on restaurants for insert
  with check (auth.uid() = owner_id);

-- Add RLS policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Make the owner staff record trigger more robust
create or replace function create_owner_staff_record()
returns trigger as $$
begin
  -- Only create staff record if it doesn't exist
  if not exists (
    select 1 from staff
    where restaurant_id = new.id
    and user_id = new.owner_id
    and role = 'owner'
  ) then
    insert into staff (restaurant_id, user_id, role, permissions)
    values (
      new.id,
      new.owner_id,
      'owner',
      get_all_permissions()
    );
  end if;
  return new;
end;
$$ language plpgsql; 
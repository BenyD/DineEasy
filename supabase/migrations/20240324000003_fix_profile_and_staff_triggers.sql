-- Re-add profile and staff triggers with improved logic

-- Create or replace the profile creation function
create or replace function create_user_profile()
returns trigger as $$
begin
  -- Only create profile if it doesn't exist
  if not exists (select 1 from profiles where id = new.id) then
    insert into profiles (id, full_name)
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
end;
$$ language plpgsql security definer;

-- Re-create the profile trigger
drop trigger if exists create_profile_after_user_signup on auth.users;
create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- Create or replace the owner staff record function
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
$$ language plpgsql security definer;

-- Re-create the owner staff trigger
drop trigger if exists create_owner_staff_after_restaurant on restaurants;
create trigger create_owner_staff_after_restaurant
  after insert on restaurants
  for each row
  execute function create_owner_staff_record();

-- Create missing profiles for existing users
insert into profiles (id, full_name)
select 
  id,
  coalesce(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    'New User'
  ) as full_name
from auth.users u
where not exists (
  select 1 from profiles p where p.id = u.id
);

-- Create missing staff records for existing restaurants
insert into staff (restaurant_id, user_id, role, permissions)
select 
  r.id as restaurant_id,
  r.owner_id as user_id,
  'owner' as role,
  get_all_permissions() as permissions
from restaurants r
where not exists (
  select 1 from staff s 
  where s.restaurant_id = r.id 
  and s.user_id = r.owner_id 
  and s.role = 'owner'
); 
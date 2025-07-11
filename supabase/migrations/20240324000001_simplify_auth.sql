-- Drop all auth-related triggers
drop trigger if exists create_profile_after_user_signup on auth.users;
drop trigger if exists create_owner_staff_after_restaurant on restaurants;

-- Make subscription_status nullable and text (not enum)
alter table restaurants 
  alter column subscription_status type text using subscription_status::text,
  alter column subscription_status drop not null;

-- Make sure RLS is enabled
alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table staff enable row level security;

-- Drop and recreate RLS policies
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can insert their own restaurant" on restaurants;
drop policy if exists "Users can view their own restaurants" on restaurants;
drop policy if exists "Users can update their own restaurants" on restaurants;

-- Add RLS policies for profiles
create policy "Enable all operations for users based on user_id" on profiles
  for all using (auth.uid() = id);

-- Add RLS policies for restaurants
create policy "Enable all operations for users based on owner_id" on restaurants
  for all using (auth.uid() = owner_id);

-- Add RLS policies for staff
create policy "Enable all operations for restaurant owners" on staff
  for all using (
    exists (
      select 1 from restaurants
      where restaurants.id = staff.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  ); 
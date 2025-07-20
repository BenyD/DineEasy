-- Complete RLS policy reset and recreation
-- This migration completely removes all existing policies and recreates them cleanly

-- First, disable RLS on all tables temporarily
alter table restaurants disable row level security;
alter table staff disable row level security;
alter table menu_items disable row level security;
alter table orders disable row level security;
alter table payments disable row level security;
alter table tables disable row level security;
alter table subscriptions disable row level security;
alter table profiles disable row level security;

-- Drop ALL existing policies to start completely fresh
-- Restaurants
drop policy if exists "Users can view their own restaurants" on restaurants;
drop policy if exists "Users can update their own restaurants" on restaurants;
drop policy if exists "Users can insert their own restaurants" on restaurants;
drop policy if exists "Users can delete their own restaurants" on restaurants;
drop policy if exists "Staff can view their restaurant" on restaurants;
drop policy if exists "restaurants_owner_access" on restaurants;

-- Staff
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can manage own record" on staff;
drop policy if exists "Staff can view own record" on staff;
drop policy if exists "Staff can update own record" on staff;
drop policy if exists "Staff can insert own record" on staff;
drop policy if exists "Staff can delete own record" on staff;
drop policy if exists "Staff can view other staff in same restaurant" on staff;
drop policy if exists "staff_owner_management" on staff;
drop policy if exists "staff_self_management" on staff;

-- Menu items
drop policy if exists "Public can view active menu items" on menu_items;
drop policy if exists "Restaurant owners can manage menu items" on menu_items;
drop policy if exists "Staff can manage menu items" on menu_items;
drop policy if exists "menu_items_public_view" on menu_items;
drop policy if exists "menu_items_owner_management" on menu_items;
drop policy if exists "menu_items_staff_management" on menu_items;

-- Orders
drop policy if exists "Restaurant owners can manage orders" on orders;
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Staff can manage orders" on orders;
drop policy if exists "orders_owner_management" on orders;
drop policy if exists "orders_staff_view" on orders;
drop policy if exists "orders_staff_management" on orders;

-- Payments
drop policy if exists "Restaurant owners can manage payments" on payments;
drop policy if exists "Staff can view payments" on payments;
drop policy if exists "Staff can manage payments" on payments;
drop policy if exists "payments_owner_management" on payments;
drop policy if exists "payments_staff_view" on payments;
drop policy if exists "payments_staff_management" on payments;

-- Tables
drop policy if exists "Restaurant owners can manage tables" on tables;
drop policy if exists "Staff can view tables" on tables;
drop policy if exists "Staff can manage tables" on tables;
drop policy if exists "tables_owner_management" on tables;
drop policy if exists "tables_staff_view" on tables;
drop policy if exists "tables_staff_management" on tables;

-- Subscriptions
drop policy if exists "Restaurant owners can manage subscriptions" on subscriptions;
drop policy if exists "Staff can view subscriptions" on subscriptions;
drop policy if exists "subscriptions_owner_management" on subscriptions;
drop policy if exists "subscriptions_staff_view" on subscriptions;

-- Profiles
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "profiles_self_management" on profiles;

-- Storage policies
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects;
drop policy if exists "Users can upload avatar images" on storage.objects;
drop policy if exists "Users can update avatar images" on storage.objects;
drop policy if exists "Users can delete avatar images" on storage.objects;
drop policy if exists "menu_images_owner_staff_access" on storage.objects;
drop policy if exists "restaurant_images_owner_access" on storage.objects;
drop policy if exists "avatar_images_self_access" on storage.objects;

-- Now re-enable RLS
alter table restaurants enable row level security;
alter table staff enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table tables enable row level security;
alter table subscriptions enable row level security;
alter table profiles enable row level security;

-- Create clean, simple policies for restaurants using original names
create policy "Users can view their own restaurants"
  on restaurants for select
  using (owner_id = auth.uid());

create policy "Users can update their own restaurants"
  on restaurants for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can insert their own restaurants"
  on restaurants for insert
  with check (owner_id = auth.uid());

create policy "Users can delete their own restaurants"
  on restaurants for delete
  using (owner_id = auth.uid());

-- Create clean, simple policies for staff using original names
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view other staff in same restaurant"
  on staff for select
  using (user_id = auth.uid());

-- Create clean policies for menu items using original names
create policy "Public can view active menu items"
  on menu_items for select
  using (is_available = true);

create policy "Restaurant owners can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = menu_items.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Create clean policies for orders using original names
create policy "Staff can view orders"
  on orders for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.view']::text[]
    )
  );

create policy "Staff can manage orders"
  on orders for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.manage']::text[]
    )
  );

-- Create clean policies for payments using original names
create policy "Staff can view payments"
  on payments for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.view']::text[]
    )
  );

create policy "Staff can manage payments"
  on payments for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.manage']::text[]
    )
  );

-- Create clean policies for tables using original names
create policy "Staff can view tables"
  on tables for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = tables.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['tables.view']::text[]
    )
  );

create policy "Staff can manage tables"
  on tables for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = tables.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['tables.manage']::text[]
    )
  );

-- Create clean policies for subscriptions using original names
create policy "Staff can view subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = subscriptions.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = subscriptions.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['billing.view']::text[]
    )
  );

-- Create clean policies for profiles using original names
create policy "Users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Create clean storage policies using original names
create policy "Restaurant owners and staff can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners and staff can update menu images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  )
  with check (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners and staff can delete menu images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners can upload restaurant images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-images' 
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can update restaurant images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can delete restaurant images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Users can upload avatar images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatar-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update avatar images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete avatar images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  ); 
-- Fix ambiguous restaurant_id column reference in RLS policies

-- Drop the problematic policies that have ambiguous column references
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;

-- Create new policies with explicit table aliases to avoid ambiguous column references
create policy "Restaurant owners and staff can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and (
      -- Restaurant owner check
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
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
      -- Restaurant owner check
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
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
      -- Restaurant owner check
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
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
      -- Restaurant owner check
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
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

-- Also fix any other RLS policies that might have similar issues
-- Update staff policies to use explicit table aliases
drop policy if exists "Staff can view their restaurant" on restaurants;
create policy "Staff can view their restaurant"
  on restaurants for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = restaurants.id
      and s.user_id = auth.uid()
      and s.is_active = true
    )
  );

-- Update staff management policies
drop policy if exists "Restaurant owners can manage staff" on staff;
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

drop policy if exists "Staff can view other staff in same restaurant" on staff;
create policy "Staff can view other staff in same restaurant"
  on staff for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = staff.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
    )
  );

-- Update menu policies
drop policy if exists "Staff can manage menu items" on menu_items;
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

-- Update orders policies
drop policy if exists "Staff can view orders" on orders;
create policy "Staff can view orders"
  on orders for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.view']::text[]
    )
  );

drop policy if exists "Staff can manage orders" on orders;
create policy "Staff can manage orders"
  on orders for all
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.manage']::text[]
    )
  );

-- Update payments policies
drop policy if exists "Staff can view payments" on payments;
create policy "Staff can view payments"
  on payments for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.view']::text[]
    )
  );

drop policy if exists "Staff can manage payments" on payments;
create policy "Staff can manage payments"
  on payments for all
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.manage']::text[]
    )
  ); 
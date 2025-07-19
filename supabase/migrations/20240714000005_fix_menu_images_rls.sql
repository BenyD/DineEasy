-- Fix RLS policies for menu-images bucket to allow staff with menu.manage permissions

-- Drop existing policies
drop policy if exists "Restaurant owners can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners can update their menu images" on storage.objects;
drop policy if exists "Restaurant owners can delete their menu images" on storage.objects;

-- Create new policies that allow both restaurant owners and staff with menu.manage permissions
create policy "Restaurant owners and staff can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and (
      -- Restaurant owner check
      exists (
        select 1 from restaurants 
        where owner_id = auth.uid() 
        and id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
      exists (
        select 1 from staff
        join restaurants on restaurants.id = staff.restaurant_id
        where staff.user_id = auth.uid()
        and staff.is_active = true
        and staff.permissions && array['menu.manage']::text[]
        and restaurants.id::text = (storage.foldername(name))[1]
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
        select 1 from restaurants 
        where owner_id = auth.uid() 
        and id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
      exists (
        select 1 from staff
        join restaurants on restaurants.id = staff.restaurant_id
        where staff.user_id = auth.uid()
        and staff.is_active = true
        and staff.permissions && array['menu.manage']::text[]
        and restaurants.id::text = (storage.foldername(name))[1]
      )
    )
  )
  with check (
    bucket_id = 'menu-images'
    and (
      -- Restaurant owner check
      exists (
        select 1 from restaurants 
        where owner_id = auth.uid() 
        and id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
      exists (
        select 1 from staff
        join restaurants on restaurants.id = staff.restaurant_id
        where staff.user_id = auth.uid()
        and staff.is_active = true
        and staff.permissions && array['menu.manage']::text[]
        and restaurants.id::text = (storage.foldername(name))[1]
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
        select 1 from restaurants 
        where owner_id = auth.uid() 
        and id::text = (storage.foldername(name))[1]
      )
      or
      -- Staff with menu.manage permission check
      exists (
        select 1 from staff
        join restaurants on restaurants.id = staff.restaurant_id
        where staff.user_id = auth.uid()
        and staff.is_active = true
        and staff.permissions && array['menu.manage']::text[]
        and restaurants.id::text = (storage.foldername(name))[1]
      )
    )
  ); 
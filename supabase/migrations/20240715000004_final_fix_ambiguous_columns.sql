-- Final fix for all remaining ambiguous column references

-- Drop and recreate the problematic staff policy that still has ambiguous reference
drop policy if exists "Staff can view their restaurant" on restaurants;

-- Create a simple policy without any joins that could cause ambiguity
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

-- Also check and fix any other potential ambiguous references
-- Drop and recreate all storage policies to ensure they're clean
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;

-- Create clean storage policies with explicit aliases
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

-- Also fix restaurant-images storage policies if they exist
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects;

-- Create clean restaurant-images policies
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

-- Also fix avatar-images storage policies if they exist
drop policy if exists "Users can upload avatar images" on storage.objects;
drop policy if exists "Users can update avatar images" on storage.objects;
drop policy if exists "Users can delete avatar images" on storage.objects;

-- Create clean avatar-images policies
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
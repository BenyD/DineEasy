-- Fix infinite recursion in storage policies
-- The issue is that storage policies are checking staff permissions, creating circular dependencies

-- Drop all existing storage policies
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects;
drop policy if exists "Users can upload avatar images" on storage.objects;
drop policy if exists "Users can update avatar images" on storage.objects;
drop policy if exists "Users can delete avatar images" on storage.objects;

-- Create simplified storage policies (restaurant owners only, no staff checks)
create policy "Restaurant owners can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can update menu images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can delete menu images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
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
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update avatar images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete avatar images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  ); 
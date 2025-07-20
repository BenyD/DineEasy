-- Unified Storage Policies - Final Fix
-- This migration unifies all storage policies and fixes RLS issues

-- Drop ALL existing storage policies to start fresh
-- Use CASCADE to ensure all related policies are dropped
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects cascade;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects cascade;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects cascade;
drop policy if exists "Users can upload avatar images" on storage.objects cascade;
drop policy if exists "Users can update avatar images" on storage.objects cascade;
drop policy if exists "Users can delete avatar images" on storage.objects cascade;
drop policy if exists "Public can view restaurant images" on storage.objects cascade;
drop policy if exists "Authenticated users can upload restaurant images" on storage.objects cascade;
drop policy if exists "Users can update their own restaurant images" on storage.objects cascade;
drop policy if exists "Users can delete their own restaurant images" on storage.objects cascade;
drop policy if exists "Public can view menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can upload menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can update their menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can delete their menu images" on storage.objects cascade;
drop policy if exists "Public can view avatar images" on storage.objects cascade;
drop policy if exists "Authenticated users can upload their own avatar" on storage.objects cascade;
drop policy if exists "Users can update their own avatar" on storage.objects cascade;
drop policy if exists "Users can delete their own avatar" on storage.objects cascade;

-- Additional policies that might exist
drop policy if exists "Restaurant owners can update menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can delete menu images" on storage.objects cascade;
drop policy if exists "Restaurant owners can upload menu images" on storage.objects cascade;

-- Create unified storage policies

-- 1. AVATAR IMAGES (avatars bucket) - User ID based
create policy "Public can view avatar images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

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

-- 2. RESTAURANT IMAGES (restaurant-images bucket) - Restaurant ID based
create policy "Public can view restaurant images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'restaurant-images');

create policy "Restaurant owners can upload restaurant images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-images' 
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
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
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
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
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  );

-- 3. MENU IMAGES (menu-images bucket) - Restaurant ID based
create policy "Public can view menu images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'menu-images');

create policy "Restaurant owners can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
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
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
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
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  ); 
-- Cleanup Duplicate Storage Policies
-- This migration fixes the specific duplicate policy issue

-- Drop the specific duplicate policies
drop policy if exists "Restaurant owners can update menu images" on storage.objects;
drop policy if exists "Restaurant owners can delete menu images" on storage.objects;
drop policy if exists "Restaurant owners can upload menu images" on storage.objects;

-- Also drop any staff-related menu policies that might conflict
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;

-- Recreate the menu image policies
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
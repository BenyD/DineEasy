-- Fix storage policy to work with correct path structure
-- The path structure is now: restaurantId/imageType-slug-timestamp.extension

-- Drop existing storage policies
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects;

-- Create fixed storage policies for restaurant images
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
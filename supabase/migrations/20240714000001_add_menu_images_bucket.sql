-- Create storage bucket for menu item images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Set up RLS policies for the menu-images bucket
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
      select 1 from restaurants 
      where owner_id = auth.uid() 
      and id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can update their menu images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants 
      where owner_id = auth.uid() 
      and id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants 
      where owner_id = auth.uid() 
      and id::text = (storage.foldername(name))[1]
    )
  );

create policy "Restaurant owners can delete their menu images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants 
      where owner_id = auth.uid() 
      and id::text = (storage.foldername(name))[1]
    )
  ); 
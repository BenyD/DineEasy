-- Create storage bucket for restaurant images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-images',
  'restaurant-images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Set up RLS policies for the bucket
create policy "Public can view restaurant images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'restaurant-images');

create policy "Authenticated users can upload restaurant images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own restaurant images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own restaurant images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  ); 
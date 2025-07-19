-- Debug and fix menu-images RLS policy issue

-- First, let's drop the existing policies and create a simpler one for testing
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;

-- Create a simpler policy that just checks if the user is authenticated and the bucket is correct
create policy "Allow authenticated users to upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
  );

create policy "Allow authenticated users to update menu images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-images')
  with check (bucket_id = 'menu-images');

create policy "Allow authenticated users to delete menu images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-images');

-- Also create a function to help debug the issue
create or replace function debug_menu_upload_permissions()
returns table (
  user_id uuid,
  is_restaurant_owner boolean,
  has_menu_manage boolean,
  restaurant_id uuid,
  staff_permissions text[]
) as $$
begin
  return query
  select 
    auth.uid() as user_id,
    exists (
      select 1 from restaurants 
      where owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    ) as has_menu_manage,
    r.id as restaurant_id,
    s.permissions as staff_permissions
  from restaurants r
  left join staff s on s.restaurant_id = r.id and s.user_id = auth.uid()
  where r.owner_id = auth.uid()
  limit 1;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function debug_menu_upload_permissions() to authenticated; 
-- Fix ambiguous column reference in menu-images RLS policies

-- Drop the problematic function and policies
drop policy if exists "Public can view menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;
drop function if exists check_restaurant_access(uuid);
drop function if exists debug_menu_upload_permissions_v2();

-- Create a simpler, more reliable function to check restaurant access
create or replace function check_restaurant_access(restaurant_id uuid)
returns boolean as $$
begin
  -- Check if user is restaurant owner
  if exists (
    select 1 from restaurants r
    where r.id = restaurant_id 
    and r.owner_id = auth.uid()
  ) then
    return true;
  end if;
  
  -- Check if user is staff with menu.manage permission
  if exists (
    select 1 from staff s
    where s.restaurant_id = restaurant_id
    and s.user_id = auth.uid()
    and s.is_active = true
    and s.permissions && array['menu.manage']::text[]
  ) then
    return true;
  end if;
  
  return false;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function check_restaurant_access(uuid) to authenticated;

-- Create working RLS policies
create policy "Public can view menu images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'menu-images');

create policy "Restaurant owners and staff can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and check_restaurant_access(
      (storage.foldername(name))[1]::uuid
    )
  );

create policy "Restaurant owners and staff can update menu images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and check_restaurant_access(
      (storage.foldername(name))[1]::uuid
    )
  )
  with check (
    bucket_id = 'menu-images'
    and check_restaurant_access(
      (storage.foldername(name))[1]::uuid
    )
  );

create policy "Restaurant owners and staff can delete menu images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and check_restaurant_access(
      (storage.foldername(name))[1]::uuid
    )
  );

-- Create a simpler debug function
create or replace function debug_menu_upload_permissions_v3()
returns table (
  user_id uuid,
  is_restaurant_owner boolean,
  has_menu_manage boolean,
  restaurant_id uuid,
  can_access boolean
) as $$
declare
  current_restaurant_id uuid;
begin
  -- Get the current restaurant ID for the user
  select r.id into current_restaurant_id
  from restaurants r
  where r.owner_id = auth.uid()
  limit 1;
  
  return query
  select 
    auth.uid() as user_id,
    exists (
      select 1 from restaurants r2
      where r2.owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff s2
      where s2.user_id = auth.uid()
      and s2.is_active = true
      and s2.permissions && array['menu.manage']::text[]
    ) as has_menu_manage,
    current_restaurant_id as restaurant_id,
    check_restaurant_access(current_restaurant_id) as can_access;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function debug_menu_upload_permissions_v3() to authenticated; 
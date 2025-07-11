-- Drop ALL existing staff policies
drop policy if exists "Enable all operations for restaurant owners" on staff;
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can view other staff in same restaurant" on staff;
drop policy if exists "Staff with permissions can insert staff" on staff;
drop policy if exists "Staff with permissions can update staff" on staff;
drop policy if exists "Staff with permissions can delete staff" on staff;
drop policy if exists "Staff can view their own record" on staff;
drop policy if exists "Restaurant owners can manage all staff" on staff;
drop policy if exists "Staff with permissions can view other staff" on staff;
drop policy if exists "Enable all operations for users based on user_id" on staff;
drop policy if exists "Enable read access for users based on user_id" on staff;
drop policy if exists "Enable write access for users based on user_id" on staff;

-- Drop existing functions if they exist
drop function if exists is_restaurant_owner(uuid);
drop function if exists has_staff_permission(uuid, text);

-- Create a function to check if a user is a restaurant owner
create or replace function is_restaurant_owner(restaurant_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from restaurants
    where id = restaurant_id
    and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Create a function to check staff permissions without recursion
create or replace function has_staff_permission(restaurant_id uuid, required_permission text)
returns boolean as $$
declare
  v_permissions text[];
  v_is_active boolean;
begin
  -- First check if user is restaurant owner
  if is_restaurant_owner(restaurant_id) then
    return true;
  end if;

  -- Direct query to check staff permissions
  select permissions, is_active into v_permissions, v_is_active
  from staff
  where restaurant_id = restaurant_id
  and user_id = auth.uid()
  limit 1;

  -- Return true if staff is active and has the required permission
  return v_is_active = true and v_permissions && array[required_permission];
end;
$$ language plpgsql security definer;

-- Add new staff policies
create policy "Staff can view their own record"
  on staff for select
  using (auth.uid() = user_id);

create policy "Restaurant owners can manage all staff"
  on staff for all
  using (is_restaurant_owner(restaurant_id));

create policy "Staff with permissions can view other staff"
  on staff for select
  using (has_staff_permission(restaurant_id, 'staff.view'));

create policy "Staff with permissions can insert staff"
  on staff for insert
  with check (has_staff_permission(restaurant_id, 'staff.manage'));

create policy "Staff with permissions can update staff"
  on staff for update
  using (has_staff_permission(restaurant_id, 'staff.manage'));

create policy "Staff with permissions can delete staff"
  on staff for delete
  using (has_staff_permission(restaurant_id, 'staff.manage'));

-- Re-enable RLS for staff table
alter table staff disable row level security;
alter table staff enable row level security; 
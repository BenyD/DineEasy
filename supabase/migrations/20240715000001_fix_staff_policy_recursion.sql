-- Fix infinite recursion in staff policies

-- Drop all problematic staff policies that cause recursion
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can view other staff in same restaurant" on staff;

-- Create simplified staff policies that don't cause recursion
-- Restaurant owners can manage staff (simplified)
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Staff can view their own record and other staff in the same restaurant
-- But only if they are active staff members
create policy "Staff can view staff in same restaurant"
  on staff for select
  using (
    -- Allow if user is restaurant owner
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    -- Allow if user is active staff member in the same restaurant
    (
      staff.restaurant_id in (
        select s.restaurant_id 
        from staff s 
        where s.user_id = auth.uid() 
        and s.is_active = true
      )
    )
  );

-- Staff can update their own record
create policy "Staff can update own record"
  on staff for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Staff can insert their own record (for initial creation)
create policy "Staff can insert own record"
  on staff for insert
  with check (user_id = auth.uid());

-- Staff can delete their own record
create policy "Staff can delete own record"
  on staff for delete
  using (user_id = auth.uid());

-- Also fix any other potentially recursive policies
-- Update menu policies to be simpler
drop policy if exists "Staff can manage menu items" on menu_items;
create policy "Staff can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = menu_items.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Update orders policies to be simpler
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Staff can manage orders" on orders;

create policy "Staff can view orders"
  on orders for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.view']::text[]
    )
  );

create policy "Staff can manage orders"
  on orders for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.manage']::text[]
    )
  );

-- Update payments policies to be simpler
drop policy if exists "Staff can view payments" on payments;
drop policy if exists "Staff can manage payments" on payments;

create policy "Staff can view payments"
  on payments for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.view']::text[]
    )
  );

create policy "Staff can manage payments"
  on payments for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.manage']::text[]
    )
  ); 
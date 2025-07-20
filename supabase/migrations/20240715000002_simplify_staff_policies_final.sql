-- Completely simplify staff policies to eliminate recursion

-- Drop ALL staff policies to start fresh
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can view staff in same restaurant" on staff;
drop policy if exists "Staff can update own record" on staff;
drop policy if exists "Staff can insert own record" on staff;
drop policy if exists "Staff can delete own record" on staff;

-- Create simple, non-recursive staff policies
-- Restaurant owners can do everything with staff
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Staff can view their own record
create policy "Staff can view own record"
  on staff for select
  using (user_id = auth.uid());

-- Staff can update their own record
create policy "Staff can update own record"
  on staff for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Staff can insert their own record
create policy "Staff can insert own record"
  on staff for insert
  with check (user_id = auth.uid());

-- Staff can delete their own record
create policy "Staff can delete own record"
  on staff for delete
  using (user_id = auth.uid());

-- Also simplify other policies to avoid any potential recursion
-- Update menu policies
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

-- Update orders policies
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

-- Update payments policies
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
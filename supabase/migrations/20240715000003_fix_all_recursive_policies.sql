-- Fix all recursive policies by simplifying them completely

-- Drop ALL problematic policies that could cause recursion
drop policy if exists "Users can view their own restaurants" on restaurants;
drop policy if exists "Users can update their own restaurants" on restaurants;
drop policy if exists "Staff can view their restaurant" on restaurants;

-- Create simple, non-recursive restaurant policies
-- Users can view their own restaurants (direct check)
create policy "Users can view their own restaurants"
  on restaurants for select
  using (owner_id = auth.uid());

-- Users can update their own restaurants (direct check)
create policy "Users can update their own restaurants"
  on restaurants for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Users can insert their own restaurants (direct check)
create policy "Users can insert their own restaurants"
  on restaurants for insert
  with check (owner_id = auth.uid());

-- Users can delete their own restaurants (direct check)
create policy "Users can delete their own restaurants"
  on restaurants for delete
  using (owner_id = auth.uid());

-- Drop and recreate ALL staff policies to be completely simple
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can view own record" on staff;
drop policy if exists "Staff can update own record" on staff;
drop policy if exists "Staff can insert own record" on staff;
drop policy if exists "Staff can delete own record" on staff;

-- Create simple staff policies
-- Restaurant owners can manage staff (direct check)
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Staff can manage their own record (direct check)
create policy "Staff can manage own record"
  on staff for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Drop and recreate ALL menu policies
drop policy if exists "Staff can manage menu items" on menu_items;
drop policy if exists "Public can view active menu items" on menu_items;

-- Create simple menu policies
create policy "Public can view active menu items"
  on menu_items for select
  using (is_available = true);

create policy "Restaurant owners can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Staff can manage menu items (simplified)
create policy "Staff can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = menu_items.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Drop and recreate ALL order policies
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Staff can manage orders" on orders;

-- Create simple order policies
create policy "Restaurant owners can manage orders"
  on orders for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view orders"
  on orders for select
  using (
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
      select 1 from staff s
      where s.restaurant_id = orders.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.manage']::text[]
    )
  );

-- Drop and recreate ALL payment policies
drop policy if exists "Staff can view payments" on payments;
drop policy if exists "Staff can manage payments" on payments;

-- Create simple payment policies
create policy "Restaurant owners can manage payments"
  on payments for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view payments"
  on payments for select
  using (
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
      select 1 from staff s
      where s.restaurant_id = payments.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['payments.manage']::text[]
    )
  );

-- Drop and recreate ALL table policies
drop policy if exists "Restaurant owners can manage tables" on tables;
drop policy if exists "Staff can view tables" on tables;
drop policy if exists "Staff can manage tables" on tables;

-- Create simple table policies
create policy "Restaurant owners can manage tables"
  on tables for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view tables"
  on tables for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = tables.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['tables.view']::text[]
    )
  );

create policy "Staff can manage tables"
  on tables for all
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = tables.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['tables.manage']::text[]
    )
  );

-- Drop and recreate ALL subscription policies
drop policy if exists "Restaurant owners can manage subscriptions" on subscriptions;
drop policy if exists "Staff can view subscriptions" on subscriptions;

-- Create simple subscription policies
create policy "Restaurant owners can manage subscriptions"
  on subscriptions for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = subscriptions.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from staff s
      where s.restaurant_id = subscriptions.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['billing.view']::text[]
    )
  ); 
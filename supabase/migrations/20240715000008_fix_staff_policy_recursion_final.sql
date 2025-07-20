-- Fix infinite recursion in staff policies
-- The issue is that policies are creating circular dependencies during restaurant creation

-- First, disable RLS temporarily to clean up
alter table staff disable row level security;
alter table menu_categories disable row level security;
alter table allergens disable row level security;
alter table menu_items disable row level security;
alter table orders disable row level security;
alter table payments disable row level security;
alter table tables disable row level security;
alter table subscriptions disable row level security;
alter table feedback disable row level security;
alter table activity_logs disable row level security;

-- Drop all problematic policies
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can view other staff in same restaurant" on staff;
drop policy if exists "Staff can manage menu items" on menu_items;
drop policy if exists "Staff can manage menu categories" on menu_categories;
drop policy if exists "Staff can manage allergens" on allergens;
drop policy if exists "Staff can manage menu item allergens" on menu_items_allergens;
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Staff can manage orders" on orders;
drop policy if exists "Staff can manage order items" on order_items;
drop policy if exists "Staff can view payments" on payments;
drop policy if exists "Staff can manage payments" on payments;
drop policy if exists "Staff can view tables" on tables;
drop policy if exists "Staff can manage tables" on tables;
drop policy if exists "Staff can view subscriptions" on subscriptions;
drop policy if exists "Staff can manage feedback" on feedback;
drop policy if exists "Staff can view activity logs" on activity_logs;

-- Also drop the policies that already exist from previous migrations
drop policy if exists "Restaurant owners can manage menu items" on menu_items;
drop policy if exists "Restaurant owners can manage menu categories" on menu_categories;
drop policy if exists "Restaurant owners can manage allergens" on allergens;
drop policy if exists "Restaurant owners can manage menu item allergens" on menu_items_allergens;
drop policy if exists "Restaurant owners can manage orders" on orders;
drop policy if exists "Restaurant owners can manage order items" on order_items;
drop policy if exists "Restaurant owners can manage payments" on payments;
drop policy if exists "Restaurant owners can manage tables" on tables;
drop policy if exists "Restaurant owners can manage subscriptions" on subscriptions;
drop policy if exists "Restaurant owners can manage feedback" on feedback;
drop policy if exists "Restaurant owners can view activity logs" on activity_logs;
drop policy if exists "Allow admin access to payments" on payments;
drop policy if exists "Allow admin access to subscriptions" on subscriptions;

-- Re-enable RLS
alter table staff enable row level security;
alter table menu_categories enable row level security;
alter table allergens enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table tables enable row level security;
alter table subscriptions enable row level security;
alter table feedback enable row level security;
alter table activity_logs enable row level security;

-- Create simplified staff policies (no circular dependencies)
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view own record"
  on staff for select
  using (user_id = auth.uid());

-- Create simplified menu policies (restaurant owners only for now)
create policy "Restaurant owners can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_items.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can manage menu categories"
  on menu_categories for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_categories.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can manage allergens"
  on allergens for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = allergens.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can manage menu item allergens"
  on menu_items_allergens for all
  using (
    exists (
      select 1 from menu_items mi
      join restaurants r on r.id = mi.restaurant_id
      where mi.id = menu_items_allergens.menu_item_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified order policies (restaurant owners only for now)
create policy "Restaurant owners can manage orders"
  on orders for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = orders.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can manage order items"
  on order_items for all
  using (
    exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_items.order_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified payment policies (restaurant owners only for now)
create policy "Restaurant owners can manage payments"
  on payments for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = payments.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified table policies (restaurant owners only for now)
create policy "Restaurant owners can manage tables"
  on tables for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified subscription policies (restaurant owners only for now)
create policy "Restaurant owners can manage subscriptions"
  on subscriptions for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = subscriptions.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified feedback policies (restaurant owners only for now)
create policy "Restaurant owners can manage feedback"
  on feedback for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = feedback.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create simplified activity log policies (restaurant owners only for now)
create policy "Restaurant owners can view activity logs"
  on activity_logs for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = activity_logs.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Keep the admin access policies
create policy "Allow admin access to payments"
  on payments for all
  using (auth.role() = 'service_role');

create policy "Allow admin access to subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role'); 
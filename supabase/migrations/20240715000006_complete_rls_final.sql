-- Complete RLS policy reset and recreation - FINAL VERSION
-- This migration includes ALL tables and policies

-- First, disable RLS on ALL tables temporarily
alter table restaurants disable row level security;
alter table staff disable row level security;
alter table menu_items disable row level security;
alter table menu_categories disable row level security;
alter table allergens disable row level security;
alter table menu_items_allergens disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table payments disable row level security;
alter table tables disable row level security;
alter table subscriptions disable row level security;
alter table profiles disable row level security;
alter table feedback disable row level security;
alter table activity_logs disable row level security;
alter table notifications disable row level security;
alter table email_verifications disable row level security;
alter table password_reset_tokens disable row level security;
alter table restaurant_stripe_logs disable row level security;
alter table newsletter_subscriptions disable row level security;
alter table google_business_reviews disable row level security;
alter table google_business_insights disable row level security;

-- Drop ALL existing policies to start completely fresh
-- Restaurants
drop policy if exists "Users can view their own restaurants" on restaurants;
drop policy if exists "Users can update their own restaurants" on restaurants;
drop policy if exists "Users can insert their own restaurants" on restaurants;
drop policy if exists "Users can delete their own restaurants" on restaurants;
drop policy if exists "Staff can view their restaurant" on restaurants;
drop policy if exists "restaurants_owner_access" on restaurants;
drop policy if exists "Users can view their own restaurant stripe connect status" on restaurants;
drop policy if exists "Users can update their own restaurant stripe connect status" on restaurants;
drop policy if exists "Allow admin access to restaurants for Stripe updates" on restaurants;
drop policy if exists "Allow admin access to restaurants for Stripe Connect updates" on restaurants;
drop policy if exists "Users can update their own restaurant's Stripe Connect info" on restaurants;
drop policy if exists "Users can manage their own Google Business integration" on restaurants;

-- Staff
drop policy if exists "Restaurant owners can manage staff" on staff;
drop policy if exists "Staff can manage own record" on staff;
drop policy if exists "Staff can view own record" on staff;
drop policy if exists "Staff can update own record" on staff;
drop policy if exists "Staff can insert own record" on staff;
drop policy if exists "Staff can delete own record" on staff;
drop policy if exists "Staff can view other staff in same restaurant" on staff;
drop policy if exists "staff_owner_management" on staff;
drop policy if exists "staff_self_management" on staff;
drop policy if exists "Staff can view their own record" on staff;
drop policy if exists "Restaurant owners can manage all staff" on staff;
drop policy if exists "Staff with permissions can view other staff" on staff;
drop policy if exists "Staff with permissions can insert staff" on staff;
drop policy if exists "Staff with permissions can update staff" on staff;
drop policy if exists "Staff with permissions can delete staff" on staff;

-- Menu items
drop policy if exists "Public can view active menu items" on menu_items;
drop policy if exists "Restaurant owners can manage menu items" on menu_items;
drop policy if exists "Staff can manage menu items" on menu_items;
drop policy if exists "menu_items_public_view" on menu_items;
drop policy if exists "menu_items_owner_management" on menu_items;
drop policy if exists "menu_items_staff_management" on menu_items;

-- Menu categories
drop policy if exists "Staff can manage menu categories" on menu_categories;

-- Allergens
drop policy if exists "Staff can manage allergens" on allergens;

-- Menu items allergens
drop policy if exists "Staff can manage menu item allergens" on menu_items_allergens;

-- Orders
drop policy if exists "Restaurant owners can manage orders" on orders;
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Staff can manage orders" on orders;
drop policy if exists "orders_owner_management" on orders;
drop policy if exists "orders_staff_view" on orders;
drop policy if exists "orders_staff_management" on orders;

-- Order items (no existing policies found)

-- Payments
drop policy if exists "Restaurant owners can manage payments" on payments;
drop policy if exists "Staff can view payments" on payments;
drop policy if exists "Staff can manage payments" on payments;
drop policy if exists "payments_owner_management" on payments;
drop policy if exists "payments_staff_view" on payments;
drop policy if exists "payments_staff_management" on payments;
drop policy if exists "Allow admin access to payments" on payments;

-- Tables
drop policy if exists "Restaurant owners can manage tables" on tables;
drop policy if exists "Staff can view tables" on tables;
drop policy if exists "Staff can manage tables" on tables;
drop policy if exists "tables_owner_management" on tables;
drop policy if exists "tables_staff_view" on tables;
drop policy if exists "tables_staff_management" on tables;

-- Subscriptions
drop policy if exists "Restaurant owners can manage subscriptions" on subscriptions;
drop policy if exists "Staff can view subscriptions" on subscriptions;
drop policy if exists "subscriptions_owner_management" on subscriptions;
drop policy if exists "subscriptions_staff_view" on subscriptions;
drop policy if exists "Allow admin access to subscriptions" on subscriptions;
drop policy if exists "Allow admin access to subscription functions" on subscriptions;

-- Profiles
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "profiles_self_management" on profiles;
drop policy if exists "Enable insert for service role" on profiles;
drop policy if exists "Users can manage their own profile" on profiles;
drop policy if exists "Enable read access for users based on user_id" on profiles;
drop policy if exists "Enable update for users based on user_id" on profiles;
drop policy if exists "profiles_service_role_insert" on profiles;
drop policy if exists "profiles_user_read_own" on profiles;
drop policy if exists "profiles_user_update_own" on profiles;

-- Feedback (no existing policies found)

-- Activity logs (no existing policies found)

-- Notifications (no existing policies found)

-- Email verifications
drop policy if exists "Service role has full access to email verifications" on email_verifications;
drop policy if exists "Users can read their own email verifications" on email_verifications;
drop policy if exists "Service role can insert email verifications" on email_verifications;
drop policy if exists "Service role can update email verifications" on email_verifications;

-- Password reset tokens (no existing policies found)

-- Restaurant stripe logs
drop policy if exists "Restaurant owners can view their own Stripe logs" on restaurant_stripe_logs;
drop policy if exists "Restaurant owners can insert their own Stripe logs" on restaurant_stripe_logs;
drop policy if exists "System can manage all Stripe logs" on restaurant_stripe_logs;

-- Newsletter subscriptions (no existing policies found)

-- Google Business reviews
drop policy if exists "Restaurant owners can view their Google Business reviews" on google_business_reviews;
drop policy if exists "Restaurant owners can update their review replies" on google_business_reviews;

-- Google Business insights
drop policy if exists "Restaurant owners can view their Google Business insights" on google_business_insights;

-- Storage policies
drop policy if exists "Restaurant owners and staff can upload menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can update menu images" on storage.objects;
drop policy if exists "Restaurant owners and staff can delete menu images" on storage.objects;
drop policy if exists "Restaurant owners can upload restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can update restaurant images" on storage.objects;
drop policy if exists "Restaurant owners can delete restaurant images" on storage.objects;
drop policy if exists "Users can upload avatar images" on storage.objects;
drop policy if exists "Users can update avatar images" on storage.objects;
drop policy if exists "Users can delete avatar images" on storage.objects;
drop policy if exists "menu_images_owner_staff_access" on storage.objects;
drop policy if exists "restaurant_images_owner_access" on storage.objects;
drop policy if exists "avatar_images_self_access" on storage.objects;
drop policy if exists "Public can view menu images" on storage.objects;
drop policy if exists "Public can view restaurant images" on storage.objects;
drop policy if exists "Authenticated users can upload restaurant images" on storage.objects;
drop policy if exists "Users can update their own restaurant images" on storage.objects;
drop policy if exists "Users can delete their own restaurant images" on storage.objects;
drop policy if exists "Public can view avatar images" on storage.objects;
drop policy if exists "Authenticated users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

-- Now re-enable RLS on ALL tables
alter table restaurants enable row level security;
alter table staff enable row level security;
alter table menu_items enable row level security;
alter table menu_categories enable row level security;
alter table allergens enable row level security;
alter table menu_items_allergens enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table tables enable row level security;
alter table subscriptions enable row level security;
alter table profiles enable row level security;
alter table feedback enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;
alter table email_verifications enable row level security;
alter table password_reset_tokens enable row level security;
alter table restaurant_stripe_logs enable row level security;
alter table newsletter_subscriptions enable row level security;
alter table google_business_reviews enable row level security;
alter table google_business_insights enable row level security;

-- Create clean, simple policies for restaurants
create policy "Users can view their own restaurants"
  on restaurants for select
  using (owner_id = auth.uid());

create policy "Users can update their own restaurants"
  on restaurants for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can insert their own restaurants"
  on restaurants for insert
  with check (owner_id = auth.uid());

create policy "Users can delete their own restaurants"
  on restaurants for delete
  using (owner_id = auth.uid());

-- Admin access for Stripe operations
create policy "Allow admin access to restaurants for Stripe updates"
  on restaurants for all
  using (auth.role() = 'service_role');

-- Create clean, simple policies for staff
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Staff can view other staff in same restaurant"
  on staff for select
  using (user_id = auth.uid());

-- Create clean policies for menu items
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

-- Create policies for menu categories
create policy "Staff can manage menu categories"
  on menu_categories for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menu_categories.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = menu_categories.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Create policies for allergens
create policy "Staff can manage allergens"
  on allergens for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = allergens.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = allergens.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Create policies for menu items allergens
create policy "Staff can manage menu item allergens"
  on menu_items_allergens for all
  using (
    exists (
      select 1 from menu_items mi
      join restaurants r on r.id = mi.restaurant_id
      where mi.id = menu_items_allergens.menu_item_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from menu_items mi
      join staff s on s.restaurant_id = mi.restaurant_id
      where mi.id = menu_items_allergens.menu_item_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['menu.manage']::text[]
    )
  );

-- Create clean policies for orders
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

-- Create policies for order items
create policy "Staff can manage order items"
  on order_items for all
  using (
    exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_items.order_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from orders o
      join staff s on s.restaurant_id = o.restaurant_id
      where o.id = order_items.order_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['orders.manage']::text[]
    )
  );

-- Create clean policies for payments
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

-- Admin access for payments
create policy "Allow admin access to payments"
  on payments for all
  using (auth.role() = 'service_role');

-- Create clean policies for tables
create policy "Staff can view tables"
  on tables for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
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
      select 1 from restaurants r
      where r.id = tables.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = tables.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['tables.manage']::text[]
    )
  );

-- Create clean policies for subscriptions
create policy "Staff can view subscriptions"
  on subscriptions for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = subscriptions.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = subscriptions.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['billing.view']::text[]
    )
  );

-- Admin access for subscriptions
create policy "Allow admin access to subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');

-- Create clean policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Service role access for profiles
create policy "Enable insert for service role"
  on profiles for insert
  with check (auth.role() = 'service_role');

-- Create policies for feedback
create policy "Staff can manage feedback"
  on feedback for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = feedback.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = feedback.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
      and s.permissions && array['feedback.manage']::text[]
    )
  );

-- Create policies for activity logs
create policy "Staff can view activity logs"
  on activity_logs for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = activity_logs.restaurant_id
      and r.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.restaurant_id = activity_logs.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
    )
  );

-- Create policies for notifications
create policy "Users can manage their own notifications"
  on notifications for all
  using (user_id = auth.uid());

-- Create policies for email verifications
create policy "Service role has full access to email verifications"
  on email_verifications for all
  using (auth.role() = 'service_role');

create policy "Users can read their own email verifications"
  on email_verifications for select
  using (user_id = auth.uid());

-- Create policies for password reset tokens
create policy "Service role can manage password reset tokens"
  on password_reset_tokens for all
  using (auth.role() = 'service_role');

-- Create policies for restaurant stripe logs
create policy "Restaurant owners can view their own Stripe logs"
  on restaurant_stripe_logs for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_stripe_logs.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can insert their own Stripe logs"
  on restaurant_stripe_logs for insert
  with check (
    exists (
      select 1 from restaurants r
      where r.id = restaurant_stripe_logs.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "System can manage all Stripe logs"
  on restaurant_stripe_logs for all
  using (auth.role() = 'service_role');

-- Create policies for newsletter subscriptions
create policy "Users can manage their own newsletter subscriptions"
  on newsletter_subscriptions for all
  using (auth.email() = email);

-- Create policies for Google Business reviews
create policy "Restaurant owners can view their Google Business reviews"
  on google_business_reviews for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = google_business_reviews.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Restaurant owners can update their review replies"
  on google_business_reviews for update
  using (
    exists (
      select 1 from restaurants r
      where r.id = google_business_reviews.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create policies for Google Business insights
create policy "Restaurant owners can view their Google Business insights"
  on google_business_insights for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = google_business_insights.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

-- Create clean storage policies
create policy "Restaurant owners and staff can upload menu images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-images' 
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners and staff can update menu images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  )
  with check (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners and staff can delete menu images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (
      exists (
        select 1 from restaurants r
        where r.owner_id = auth.uid() 
        and r.id::text = (storage.foldername(name))[1]
      )
      or
      exists (
        select 1 from staff s
        join restaurants r on r.id = s.restaurant_id
        where s.user_id = auth.uid()
        and s.is_active = true
        and s.permissions && array['menu.manage']::text[]
        and r.id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Restaurant owners can upload restaurant images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'restaurant-images' 
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
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
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
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
      where r.owner_id = auth.uid() 
      and r.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Users can upload avatar images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatar-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update avatar images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete avatar images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  ); 
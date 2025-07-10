-- Create subscription status enum
create type subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid'
);

-- Create permission enum
create type staff_permission as enum (
  'orders.view',
  'orders.manage',
  'kitchen.view',
  'kitchen.manage',
  'menu.view',
  'menu.manage',
  'menu.categories',
  'menu.pricing',
  'tables.view',
  'tables.manage',
  'qr.view',
  'qr.manage',
  'analytics.view',
  'analytics.detailed',
  'analytics.export',
  'staff.view',
  'staff.manage',
  'staff.permissions',
  'payments.view',
  'payments.manage',
  'billing.view',
  'billing.manage',
  'settings.view',
  'settings.manage',
  'settings.branding'
);

-- Create function to validate staff permissions
create or replace function is_valid_staff_permission(permissions text[])
returns boolean as $$
begin
  return array_length(
    array(
      select unnest(permissions)
      except
      select unnest(enum_range(null::staff_permission)::text[])
    ),
    1
  ) is null;
end;
$$ language plpgsql;

-- Create function to get all staff permissions
create or replace function get_all_permissions()
returns text[] as $$
begin
  return enum_range(null::staff_permission)::text[];
end;
$$ language plpgsql;

-- Update owner staff record creation trigger
create or replace function create_owner_staff_record()
returns trigger as $$
begin
  insert into staff (restaurant_id, user_id, role, permissions)
  values (
    new.id,
    new.owner_id,
    'owner',
    get_all_permissions() -- Give owner all available permissions
  );
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists create_owner_staff_after_restaurant on restaurants;

-- Recreate the trigger
create trigger create_owner_staff_after_restaurant
  after insert on restaurants
  for each row
  execute function create_owner_staff_record();

-- Update restaurants table to use subscription_status enum
alter table restaurants 
  alter column subscription_status type subscription_status using subscription_status::subscription_status;

-- Add check constraint for staff permissions using the function
alter table staff
  add constraint valid_permissions check (is_valid_staff_permission(permissions));

-- RLS Policies

-- Restaurants policies
create policy "Users can view their own restaurants"
  on restaurants for select
  using (auth.uid() = owner_id);

create policy "Users can update their own restaurants"
  on restaurants for update
  using (auth.uid() = owner_id);

create policy "Staff can view their restaurant"
  on restaurants for select
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = restaurants.id
      and staff.user_id = auth.uid()
      and staff.is_active = true
    )
  );

-- Staff policies
create policy "Restaurant owners can manage staff"
  on staff for all
  using (
    exists (
      select 1 from restaurants
      where restaurants.id = staff.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "Staff can view other staff in same restaurant"
  on staff for select
  using (
    exists (
      select 1 from staff as s
      where s.restaurant_id = staff.restaurant_id
      and s.user_id = auth.uid()
      and s.is_active = true
    )
  );

-- Menu policies
create policy "Public can view active menu items"
  on menu_items for select
  using (is_available = true);

create policy "Staff can manage menu items"
  on menu_items for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = menu_items.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    )
  );

-- Orders policies
create policy "Staff can view orders"
  on orders for select
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = orders.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['orders.view']::text[]
    )
  );

create policy "Staff can manage orders"
  on orders for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = orders.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['orders.manage']::text[]
    )
  );

-- Payments policies
create policy "Staff can view payments"
  on payments for select
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = payments.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['payments.view']::text[]
    )
  );

create policy "Staff can manage payments"
  on payments for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = payments.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['payments.manage']::text[]
    )
  );

-- Add Stripe Connect status check function
create or replace function is_stripe_connect_ready(restaurant_id uuid)
returns boolean as $$
declare
  v_restaurant restaurants;
begin
  select * into v_restaurant
  from restaurants
  where id = restaurant_id;

  return v_restaurant.stripe_account_id is not null
    and v_restaurant.stripe_account_enabled = true
    and (
      v_restaurant.stripe_account_requirements is null
      or not v_restaurant.stripe_account_requirements ? 'currently_due'
      or v_restaurant.stripe_account_requirements->>'currently_due' = '[]'
    );
end;
$$ language plpgsql security definer;

-- Add function to check staff permissions
create or replace function has_permission(restaurant_id uuid, required_permission text)
returns boolean as $$
declare
  v_staff staff;
begin
  -- Check if user is restaurant owner
  if exists (
    select 1 from restaurants
    where id = restaurant_id
    and owner_id = auth.uid()
  ) then
    return true;
  end if;

  -- Check staff permissions
  select * into v_staff
  from staff
  where restaurant_id = restaurant_id
  and user_id = auth.uid()
  and is_active = true;

  return v_staff.permissions && array[required_permission];
end;
$$ language plpgsql security definer; 
-- Add indexes for foreign keys and commonly queried columns
create index if not exists idx_restaurants_owner_id
  on restaurants(owner_id);

create index if not exists idx_restaurants_stripe_customer_id
  on restaurants(stripe_customer_id);

create index if not exists idx_subscriptions_restaurant_id
  on subscriptions(restaurant_id);

create index if not exists idx_subscriptions_stripe_customer_id
  on subscriptions(stripe_customer_id);

create index if not exists idx_subscriptions_stripe_subscription_id
  on subscriptions(stripe_subscription_id);

create index if not exists idx_staff_restaurant_id
  on staff(restaurant_id);

create index if not exists idx_staff_user_id
  on staff(user_id);

create index if not exists idx_orders_restaurant_id
  on orders(restaurant_id);

create index if not exists idx_payments_restaurant_id
  on payments(restaurant_id);

create index if not exists idx_payments_order_id
  on payments(order_id);

-- Create function to get restaurant by ID with proper error handling
create or replace function get_restaurant_by_id(p_restaurant_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  subscription_status text,
  stripe_customer_id text
) as $$
begin
  return query
  select
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.subscription_status,
    r.stripe_customer_id
  from restaurants r
  where r.id = p_restaurant_id;
end;
$$ language plpgsql security definer;

-- Create function to get restaurant by Stripe customer ID
create or replace function get_restaurant_by_stripe_customer(p_stripe_customer_id text)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  subscription_status text,
  stripe_customer_id text
) as $$
begin
  return query
  select
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.subscription_status,
    r.stripe_customer_id
  from restaurants r
  where r.stripe_customer_id = p_stripe_customer_id;
end;
$$ language plpgsql security definer;

-- Create function to update restaurant subscription status
create or replace function update_restaurant_subscription_status(
  p_restaurant_id uuid,
  p_subscription_status text
)
returns void as $$
begin
  update restaurants
  set
    subscription_status = p_subscription_status,
    updated_at = now()
  where id = p_restaurant_id;
end;
$$ language plpgsql security definer; 
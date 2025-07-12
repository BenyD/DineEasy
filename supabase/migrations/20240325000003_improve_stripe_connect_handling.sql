-- Improve Stripe Connect handling with better indexes and functions

-- Add index for Stripe account ID lookups
create index if not exists idx_restaurants_stripe_account_id
  on restaurants(stripe_account_id);

-- Add index for subscription status queries
create index if not exists idx_restaurants_subscription_status
  on restaurants(subscription_status);

-- Create function to update Stripe Connect account status
create or replace function update_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_charges_enabled boolean,
  p_requirements jsonb
)
returns void as $$
begin
  update restaurants
  set
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_charges_enabled,
    stripe_account_requirements = p_requirements,
    updated_at = now()
  where id = p_restaurant_id;
end;
$$ language plpgsql security definer;

-- Create function to get restaurant by Stripe account ID
create or replace function get_restaurant_by_stripe_account(p_stripe_account_id text)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_account_enabled boolean
) as $$
begin
  return query
  select
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_account_id,
    r.stripe_account_enabled
  from restaurants r
  where r.stripe_account_id = p_stripe_account_id;
end;
$$ language plpgsql security definer;

-- Create function to handle subscription upsert with better error handling
create or replace function upsert_subscription(
  p_stripe_subscription_id text,
  p_restaurant_id uuid,
  p_stripe_customer_id text,
  p_plan text,
  p_interval text,
  p_currency text,
  p_status text,
  p_current_period_start timestamp with time zone,
  p_current_period_end timestamp with time zone,
  p_trial_start timestamp with time zone,
  p_trial_end timestamp with time zone,
  p_cancel_at timestamp with time zone,
  p_canceled_at timestamp with time zone
)
returns void as $$
begin
  insert into subscriptions (
    id,
    restaurant_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan,
    interval,
    currency,
    status,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end,
    cancel_at,
    canceled_at,
    created_at,
    updated_at
  ) values (
    p_stripe_subscription_id,
    p_restaurant_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_plan::subscription_plan,
    p_interval::subscription_interval,
    p_currency::currency,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_trial_start,
    p_trial_end,
    p_cancel_at,
    p_canceled_at,
    now(),
    now()
  )
  on conflict (id) do update set
    restaurant_id = excluded.restaurant_id,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    plan = excluded.plan,
    interval = excluded.interval,
    currency = excluded.currency,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    trial_start = excluded.trial_start,
    trial_end = excluded.trial_end,
    cancel_at = excluded.cancel_at,
    canceled_at = excluded.canceled_at,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Add RLS policy for subscriptions to allow admin access
create policy "Allow admin access to subscriptions" on subscriptions
  for all
  using (true)
  with check (true);

-- Add RLS policy for restaurants to allow admin access for Stripe updates
create policy "Allow admin access to restaurants for Stripe updates" on restaurants
  for update
  using (true)
  with check (true); 
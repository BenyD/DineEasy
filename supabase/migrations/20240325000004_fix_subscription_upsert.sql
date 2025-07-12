-- Fix subscription upsert function and add better error handling

-- Drop and recreate the upsert_subscription function with better error handling
drop function if exists upsert_subscription(text, uuid, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone);

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
declare
  v_internal_id uuid;
begin
  -- Log the attempt
  raise log 'Attempting to upsert subscription: % for restaurant: %', p_stripe_subscription_id, p_restaurant_id;
  
  -- Try to insert new subscription
  insert into subscriptions (
    id, -- This is the Stripe subscription ID (text)
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
    
  -- Log success
  raise log 'Successfully upserted subscription: %', p_stripe_subscription_id;
  
exception when others then
  -- Log error details
  raise log 'Error upserting subscription %: %', p_stripe_subscription_id, sqlerrm;
  raise;
end;
$$ language plpgsql security definer;

-- Add a function to check subscription table structure
create or replace function check_subscription_table_structure()
returns table (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) as $$
begin
  return query
  select 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  from information_schema.columns c
  where c.table_name = 'subscriptions'
  order by c.ordinal_position;
end;
$$ language plpgsql security definer;

-- Add a function to get subscription by Stripe ID
create or replace function get_subscription_by_stripe_id(p_stripe_subscription_id text)
returns table (
  internal_id uuid,
  id text,
  restaurant_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan subscription_plan,
  "interval" subscription_interval,
  currency currency,
  status text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) as $$
begin
  return query
  select
    s.internal_id,
    s.id,
    s.restaurant_id,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.plan,
    s."interval",
    s.currency,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.created_at,
    s.updated_at
  from subscriptions s
  where s.id = p_stripe_subscription_id;
end;
$$ language plpgsql security definer;

-- Ensure proper indexes exist
create index if not exists idx_subscriptions_id 
  on subscriptions(id);

create index if not exists idx_subscriptions_stripe_subscription_id 
  on subscriptions(stripe_subscription_id);

-- Add RLS policy for the new functions
create policy "Allow admin access to subscription functions" on subscriptions
  for all
  using (true)
  with check (true); 
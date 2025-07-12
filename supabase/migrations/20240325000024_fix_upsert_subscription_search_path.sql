-- Fix upsert_subscription function search path
-- This migration ensures the upsert_subscription function has the proper search path set

-- Drop and recreate the upsert_subscription function with explicit search path
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
  v_has_timestamps boolean := false;
  v_current_time timestamp with time zone := now();
begin
  -- Check if we have any timestamps to satisfy the constraint
  v_has_timestamps := (
    p_current_period_start is not null or 
    p_current_period_end is not null or 
    p_trial_start is not null or 
    p_trial_end is not null
  );
  
  -- If no timestamps are provided, use current time as fallback for current_period_start
  if not v_has_timestamps then
    p_current_period_start := v_current_time;
    p_current_period_end := v_current_time + interval '1 month'; -- Default to 1 month
  end if;
  
  -- Log the attempt
  raise log 'Attempting to upsert subscription: % for restaurant: % with timestamps: %', 
    p_stripe_subscription_id, p_restaurant_id, v_has_timestamps;
  
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
    v_current_time,
    v_current_time
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
    updated_at = v_current_time;
    
  -- Log success
  raise log 'Successfully upserted subscription: %', p_stripe_subscription_id;
  
exception when others then
  -- Log error details
  raise log 'Error upserting subscription %: %', p_stripe_subscription_id, sqlerrm;
  raise;
end;
$$ language plpgsql security definer SET search_path = public;

-- Grant execute permission
grant execute on function upsert_subscription(text, uuid, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone) to authenticated;

-- Log completion
do $$
begin
  raise log 'upsert_subscription function search path fixed successfully';
end $$; 
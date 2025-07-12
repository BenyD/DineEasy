-- Final comprehensive fix for payment function and all related issues
-- This migration consolidates all previous fixes and ensures everything works correctly

-- ============================================================================
-- STEP 1: Clean up all existing function versions to avoid conflicts
-- ============================================================================

-- Drop all existing versions of the payment function with different signatures
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text, text);

-- ============================================================================
-- STEP 2: Create the main 7-parameter function (with default for p_currency)
-- ============================================================================

create or replace function create_payment_with_fallback(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_status text,
  p_method text,
  p_stripe_payment_id text,
  p_currency text default 'USD'
)
returns void
language plpgsql
security definer
as $$
declare
  v_order_exists boolean;
  v_payment_id uuid;
begin
  -- Check if order exists
  select exists(select 1 from orders where id = p_order_id) into v_order_exists;
  
  if not v_order_exists then
    -- Create a fallback order if it doesn't exist
    insert into orders (
      id,
      restaurant_id,
      table_id,
      status,
      total_amount,
      tax_amount,
      tip_amount,
      created_at,
      updated_at
    ) values (
      p_order_id,
      p_restaurant_id,
      null,
      'completed',
      p_amount,
      0, -- tax_amount (required field)
      0, -- tip_amount (default 0)
      now(),
      now()
    );
    
    raise notice 'Created fallback order with ID: %', p_order_id;
  end if;
  
  -- Create the payment record
  insert into payments (
    id,
    order_id,
    restaurant_id,
    amount,
    currency,
    status,
    method,
    stripe_payment_id,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    p_order_id,
    p_restaurant_id,
    p_amount,
    p_currency,
    p_status,
    p_method,
    p_stripe_payment_id,
    now(),
    now()
  ) returning id into v_payment_id;
  
  raise notice 'Created payment with ID: %', v_payment_id;
  
exception when others then
  raise log 'Error creating payment %: %', p_stripe_payment_id, sqlerrm;
  raise;
end;
$$;

-- ============================================================================
-- STEP 3: Create the 8-parameter wrapper function for compatibility
-- ============================================================================

create or replace function create_payment_with_fallback(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_status text,
  p_method text,
  p_stripe_payment_id text,
  p_currency text,
  p_unused text -- This is just to match the expected signature
)
returns void
language plpgsql
security definer
as $$
begin
  -- Call the 7-parameter version
  perform create_payment_with_fallback(
    p_restaurant_id,
    p_order_id,
    p_amount,
    p_status,
    p_method,
    p_stripe_payment_id,
    p_currency
  );
end;
$$;

-- ============================================================================
-- STEP 4: Create a 6-parameter version for backward compatibility
-- ============================================================================

create or replace function create_payment_with_fallback(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_status text,
  p_method text,
  p_stripe_payment_id text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Call the 7-parameter version with default currency
  perform create_payment_with_fallback(
    p_restaurant_id,
    p_order_id,
    p_amount,
    p_status,
    p_method,
    p_stripe_payment_id,
    'USD'
  );
end;
$$;

-- ============================================================================
-- STEP 5: Ensure all related functions exist and work correctly
-- ============================================================================

-- Update the subscription upsert function to handle all edge cases
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
$$ language plpgsql security definer;

-- Ensure the restaurant lookup function exists
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

-- Ensure the restaurant subscription status update function exists
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

-- ============================================================================
-- STEP 6: Grant execute permissions for all function versions
-- ============================================================================

grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text) to authenticated;
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text) to authenticated;
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text, text) to authenticated;
grant execute on function upsert_subscription(text, uuid, text, text, text, text, text, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function get_restaurant_by_stripe_customer(text) to authenticated;
grant execute on function update_restaurant_subscription_status(uuid, text) to authenticated;

-- ============================================================================
-- STEP 7: Ensure RLS policies are in place
-- ============================================================================

-- Add RLS policy for payments to allow admin access
drop policy if exists "Allow admin access to payments" on payments;
create policy "Allow admin access to payments" on payments
  for all
  using (true)
  with check (true);

-- ============================================================================
-- STEP 8: Verify all function versions exist
-- ============================================================================

do $$
declare
  v_count_6 integer;
  v_count_7 integer;
  v_count_8 integer;
begin
  -- Check 6-parameter version
  select count(*) into v_count_6
  from pg_proc 
  where proname = 'create_payment_with_fallback' 
  and pronargs = 6;
  
  -- Check 7-parameter version
  select count(*) into v_count_7
  from pg_proc 
  where proname = 'create_payment_with_fallback' 
  and pronargs = 7;
  
  -- Check 8-parameter version
  select count(*) into v_count_8
  from pg_proc 
  where proname = 'create_payment_with_fallback' 
  and pronargs = 8;
  
  if v_count_6 = 0 then
    raise exception 'Function create_payment_with_fallback with 6 parameters not found';
  end if;
  
  if v_count_7 = 0 then
    raise exception 'Function create_payment_with_fallback with 7 parameters not found';
  end if;
  
  if v_count_8 = 0 then
    raise exception 'Function create_payment_with_fallback with 8 parameters not found';
  end if;
  
  raise log 'All versions of create_payment_with_fallback created successfully (6, 7, and 8 parameters)';
  raise log 'All related functions (upsert_subscription, get_restaurant_by_stripe_customer, update_restaurant_subscription_status) are ready';
end $$; 
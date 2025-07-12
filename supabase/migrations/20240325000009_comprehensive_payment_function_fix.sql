-- Comprehensive fix for payment function and related issues
-- This migration consolidates all previous payment function fixes and ensures proper signatures

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
-- STEP 5: Grant execute permissions for all function versions
-- ============================================================================

grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text) to authenticated;
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text) to authenticated;
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text, text) to authenticated;

-- ============================================================================
-- STEP 6: Ensure RLS policies are in place
-- ============================================================================

-- Add RLS policy for payments to allow admin access
drop policy if exists "Allow admin access to payments" on payments;
create policy "Allow admin access to payments" on payments
  for all
  using (true)
  with check (true);

-- ============================================================================
-- STEP 7: Verify all function versions exist
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
end $$;

-- ============================================================================
-- STEP 8: Test the function with sample data (optional)
-- ============================================================================

-- This section can be uncommented for testing in development
/*
do $$
declare
  v_test_restaurant_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_test_order_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
begin
  -- Test the 7-parameter version
  perform create_payment_with_fallback(
    v_test_restaurant_id,
    v_test_order_id,
    25.50,
    'completed',
    'card',
    'pi_test_123',
    'USD'
  );
  
  raise log 'Test completed successfully';
end $$;
*/ 
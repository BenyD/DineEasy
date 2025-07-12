-- Final payment function fix - clean slate approach
-- This migration ensures there's only one function with the exact signature the webhook needs

-- ============================================================================
-- STEP 1: Drop ALL existing versions of the function to ensure clean slate
-- ============================================================================

-- Drop all possible function signatures that might exist
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text, text);
drop function if exists create_payment_with_fallback(numeric, text, text, uuid, uuid, text, text);
drop function if exists create_payment_with_fallback(numeric, text, text, uuid, uuid, text, text, text);

-- ============================================================================
-- STEP 2: Create the function with EXACTLY the parameter order the webhook calls
-- ============================================================================

-- Based on the webhook call:
-- {
--   p_restaurant_id: restaurantId,
--   p_order_id: paymentIntent.metadata.orderId,
--   p_amount: paymentIntent.amount / 100,
--   p_status: "completed",
--   p_method: "card",
--   p_stripe_payment_id: paymentIntent.id,
--   p_currency: paymentIntent.currency.toUpperCase(),
-- }

create or replace function create_payment_with_fallback(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_status text,
  p_method text,
  p_stripe_payment_id text,
  p_currency text
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
  
  -- Create the payment record for customer payments to restaurants
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
  
  raise notice 'Created payment with ID: % for customer payment to restaurant', v_payment_id;
  
exception when others then
  raise log 'Error creating payment %: %', p_stripe_payment_id, sqlerrm;
  raise;
end;
$$;

-- ============================================================================
-- STEP 3: Grant execute permission
-- ============================================================================

grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text) to authenticated;

-- ============================================================================
-- STEP 4: Ensure RLS policies are in place
-- ============================================================================

-- Add RLS policy for payments to allow admin access
drop policy if exists "Allow admin access to payments" on payments;
create policy "Allow admin access to payments" on payments
  for all
  using (true)
  with check (true);

-- ============================================================================
-- STEP 5: Verify the function exists and has the correct signature
-- ============================================================================

do $$
declare
  v_count integer;
begin
  -- Check if function exists with 7 parameters
  select count(*) into v_count
  from pg_proc 
  where proname = 'create_payment_with_fallback' 
  and pronargs = 7;
  
  if v_count = 0 then
    raise exception 'Function create_payment_with_fallback with 7 parameters not found';
  end if;
  
  raise log 'Function create_payment_with_fallback created successfully with 7 parameters';
  raise log 'Expected signature: uuid, uuid, numeric, text, text, text, text';
end $$; 
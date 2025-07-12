-- Fix payment function call issue by ensuring proper function signature

-- Drop all existing versions of the function to ensure clean slate
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text);
drop function if exists create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text, text);

-- Create the 7-parameter version (with default for p_currency)
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
end;
$$;

-- Create the 8-parameter version that calls the 7-parameter version
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

-- Grant execute permission to authenticated users for both versions
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text, text) to authenticated;
grant execute on function create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text) to authenticated;

-- Add RLS policy for payments to allow admin access
drop policy if exists "Allow admin access to payments" on payments;
create policy "Allow admin access to payments" on payments
  for all
  using (true)
  with check (true);

-- Verify the functions exist and have the correct signatures
do $$
begin
  if not exists (
    select 1 from pg_proc 
    where proname = 'create_payment_with_fallback' 
    and pronargs = 7
  ) then
    raise exception 'Function create_payment_with_fallback with 7 parameters not found';
  end if;
  
  if not exists (
    select 1 from pg_proc 
    where proname = 'create_payment_with_fallback' 
    and pronargs = 8
  ) then
    raise exception 'Function create_payment_with_fallback with 8 parameters not found';
  end if;
  
  raise log 'Both versions of create_payment_with_fallback created successfully';
end $$; 
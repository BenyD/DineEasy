-- Fresh create_payment_with_fallback function
-- This is a single, clean function that matches the webhook calls exactly

create or replace function create_payment_with_fallback(
  p_amount numeric,
  p_currency text,
  p_method text,
  p_order_id uuid,
  p_restaurant_id uuid,
  p_status text,
  p_stripe_payment_id text
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

-- Grant execute permission to authenticated users
grant execute on function create_payment_with_fallback(numeric, text, text, uuid, uuid, text, text) to authenticated;

-- Add RLS policy for payments to allow admin access
drop policy if exists "Allow admin access to payments" on payments;
create policy "Allow admin access to payments" on payments
  for all
  using (true)
  with check (true); 
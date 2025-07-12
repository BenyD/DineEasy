-- Fix payment function signature to match webhook calls

-- Drop and recreate the function with the correct parameter order
drop function if exists create_payment_with_fallback(uuid, uuid, decimal, text, text, text, text);

create or replace function create_payment_with_fallback(
  p_restaurant_id uuid,
  p_order_id uuid,
  p_amount decimal,
  p_status text,
  p_method text,
  p_stripe_payment_id text,
  p_currency text default 'USD'
)
returns void as $$
begin
  -- If restaurant_id is null, try to get it from the order
  if p_restaurant_id is null and p_order_id is not null then
    select restaurant_id into p_restaurant_id
    from orders
    where id = p_order_id;
  end if;
  
  -- If still null, we can't create the payment
  if p_restaurant_id is null then
    raise log 'Cannot create payment: restaurant_id is null and cannot be determined from order_id: %', p_order_id;
    return;
  end if;
  
  -- Create the payment record
  insert into payments (
    restaurant_id,
    order_id,
    amount,
    status,
    method,
    stripe_payment_id,
    currency,
    created_at,
    updated_at
  ) values (
    p_restaurant_id,
    p_order_id,
    p_amount,
    p_status::payment_status,
    p_method::payment_method,
    p_stripe_payment_id,
    p_currency::currency,
    now(),
    now()
  );
  
  raise log 'Successfully created payment: % for restaurant: %', p_stripe_payment_id, p_restaurant_id;
  
exception when others then
  raise log 'Error creating payment %: %', p_stripe_payment_id, sqlerrm;
  raise;
end;
$$ language plpgsql security definer; 
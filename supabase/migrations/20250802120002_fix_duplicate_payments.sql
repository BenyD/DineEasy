-- Fix duplicate payment creation issue
-- This migration updates the create_payment_with_fallback function to prevent duplicate payments

CREATE OR REPLACE FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_exists boolean;
  v_payment_exists boolean;
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
  
  -- Check if payment already exists for this order
  select exists(select 1 from payments where order_id = p_order_id) into v_payment_exists;
  
  if v_payment_exists then
    raise notice 'Payment already exists for order: %, skipping duplicate creation', p_order_id;
    return;
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
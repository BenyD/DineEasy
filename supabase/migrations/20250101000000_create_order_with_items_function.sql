-- Create a function for atomic order creation with items
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order_id uuid,
  p_restaurant_id uuid,
  p_table_id uuid,
  p_order_number text,
  p_total_amount numeric,
  p_tax_amount numeric,
  p_tip_amount numeric DEFAULT 0,
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item record;
  v_result jsonb;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (
      id,
      restaurant_id,
      table_id,
      order_number,
      total_amount,
      tax_amount,
      tip_amount,
      customer_name,
      customer_email,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_order_id,
      p_restaurant_id,
      p_table_id,
      p_order_number,
      p_total_amount,
      p_tax_amount,
      p_tip_amount,
      p_customer_name,
      p_customer_email,
      p_notes,
      'pending',
      NOW(),
      NOW()
    ) RETURNING id INTO v_order_id;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO order_items (
        order_id,
        menu_item_id,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      ) VALUES (
        v_order_id,
        (v_item->>'menu_item_id')::uuid,
        (v_item->>'quantity')::integer,
        (v_item->>'unit_price')::numeric,
        (v_item->>'total_price')::numeric,
        v_item->>'notes',
        NOW()
      );
    END LOOP;

    -- Return success result
    v_result := jsonb_build_object(
      'success', true,
      'order_id', v_order_id,
      'order_number', p_order_number,
      'message', 'Order created successfully'
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction
      RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
  END;
END;
$$; 
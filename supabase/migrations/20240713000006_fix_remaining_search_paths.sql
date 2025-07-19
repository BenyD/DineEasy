-- Fix remaining function search path security warnings
-- This migration addresses all functions that still have mutable search paths

-- Fix update_google_business_reviews_updated_at function
DROP FUNCTION IF EXISTS update_google_business_reviews_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_google_business_reviews_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_google_business_reviews_updated_at
  BEFORE UPDATE ON google_business_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_google_business_reviews_updated_at();

-- Fix add_default_menu_data function
DROP FUNCTION IF EXISTS add_default_menu_data(uuid) CASCADE;

CREATE OR REPLACE FUNCTION add_default_menu_data(restaurant_id uuid)
RETURNS void 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Add default categories
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (restaurant_id, 'Mains', 'Main course dishes', 2),
    (restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (restaurant_id, 'Drinks', 'Beverages and cocktails', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (restaurant_id, 'Gluten', '🌾'),
    (restaurant_id, 'Dairy', '🥛'),
    (restaurant_id, 'Eggs', '🥚'),
    (restaurant_id, 'Nuts', '🥜'),
    (restaurant_id, 'Soy', '🫘'),
    (restaurant_id, 'Shellfish', '🦐'),
    (restaurant_id, 'Fish', '🐟'),
    (restaurant_id, 'Sulfites', '🍷')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$;

-- Fix trigger_add_default_menu_data function
DROP FUNCTION IF EXISTS trigger_add_default_menu_data() CASCADE;

CREATE OR REPLACE FUNCTION trigger_add_default_menu_data()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM add_default_menu_data(NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS add_default_menu_data_trigger ON restaurants;
CREATE TRIGGER add_default_menu_data_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_add_default_menu_data();

-- Fix process_payment function (ensure it has proper search path)
DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION process_payment(
    p_order_id UUID,
    p_payment_intent_id TEXT,
    p_amount INTEGER,
    p_currency TEXT DEFAULT 'CHF',
    p_status TEXT DEFAULT 'succeeded'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_restaurant_id UUID;
    v_order_record RECORD;
    v_result JSON;
BEGIN
    -- Get restaurant ID from order
    SELECT restaurant_id INTO v_restaurant_id
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Check if user has access to this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = v_restaurant_id 
        AND owner_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Update order with payment information
    UPDATE orders
    SET 
        payment_intent_id = p_payment_intent_id,
        payment_status = p_status,
        paid_at = CASE WHEN p_status = 'succeeded' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order_record;
    
    -- Insert payment record
    INSERT INTO payments (
        order_id,
        restaurant_id,
        payment_intent_id,
        amount,
        currency,
        status,
        created_at
    ) VALUES (
        p_order_id,
        v_restaurant_id,
        p_payment_intent_id,
        p_amount,
        p_currency,
        p_status,
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_intent_id', p_payment_intent_id,
        'amount', p_amount,
        'currency', p_currency,
        'status', p_status
    );
END;
$$;

-- Fix process_refund function (ensure it has proper search path)
DROP FUNCTION IF EXISTS process_refund(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_refund(UUID, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION process_refund(
    p_payment_id UUID,
    p_refund_amount INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment_record RECORD;
    v_restaurant_id UUID;
    v_result JSON;
BEGIN
    -- Get payment details
    SELECT p.*, o.restaurant_id INTO v_payment_record
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE p.id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    -- Check if user has access to this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = v_payment_record.restaurant_id 
        AND owner_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Check if refund amount is valid
    IF p_refund_amount > v_payment_record.amount THEN
        RETURN json_build_object('success', false, 'error', 'Refund amount exceeds payment amount');
    END IF;
    
    -- Insert refund record
    INSERT INTO refunds (
        payment_id,
        order_id,
        restaurant_id,
        amount,
        currency,
        reason,
        created_at
    ) VALUES (
        p_payment_id,
        v_payment_record.order_id,
        v_payment_record.restaurant_id,
        p_refund_amount,
        v_payment_record.currency,
        p_reason,
        NOW()
    );
    
    -- Update payment status if full refund
    IF p_refund_amount = v_payment_record.amount THEN
        UPDATE payments
        SET status = 'refunded', updated_at = NOW()
        WHERE id = p_payment_id;
        
        UPDATE orders
        SET payment_status = 'refunded', updated_at = NOW()
        WHERE id = v_payment_record.order_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'refund_id', (SELECT id FROM refunds WHERE payment_id = p_payment_id ORDER BY created_at DESC LIMIT 1),
        'amount', p_refund_amount,
        'currency', v_payment_record.currency
    );
END;
$$;

-- Log completion
DO $$
BEGIN
    RAISE LOG 'All function search path security warnings fixed';
END $$; 
-- Final fix for remaining function search paths
-- This migration uses a more comprehensive approach to fix all function signatures

-- Fix process_payment function - check all possible signatures
DO $$
BEGIN
    -- Check for process_payment with 5 parameters (UUID, TEXT, INTEGER, TEXT, TEXT)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_payment' AND pronargs = 5) THEN
        ALTER FUNCTION process_payment(UUID, TEXT, INTEGER, TEXT, TEXT) SET search_path = public;
        RAISE LOG 'Fixed process_payment(UUID, TEXT, INTEGER, TEXT, TEXT)';
    END IF;
    
    -- Check for process_payment with 4 parameters (UUID, TEXT, INTEGER, TEXT)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_payment' AND pronargs = 4) THEN
        ALTER FUNCTION process_payment(UUID, TEXT, INTEGER, TEXT) SET search_path = public;
        RAISE LOG 'Fixed process_payment(UUID, TEXT, INTEGER, TEXT)';
    END IF;
    
    -- Check for process_payment with 3 parameters (UUID, TEXT, INTEGER)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_payment' AND pronargs = 3) THEN
        ALTER FUNCTION process_payment(UUID, TEXT, INTEGER) SET search_path = public;
        RAISE LOG 'Fixed process_payment(UUID, TEXT, INTEGER)';
    END IF;
END $$;

-- Fix process_refund function - check all possible signatures
DO $$
BEGIN
    -- Check for process_refund with 3 parameters (UUID, INTEGER, TEXT)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_refund' AND pronargs = 3) THEN
        ALTER FUNCTION process_refund(UUID, INTEGER, TEXT) SET search_path = public;
        RAISE LOG 'Fixed process_refund(UUID, INTEGER, TEXT)';
    END IF;
    
    -- Check for process_refund with 2 parameters (UUID, INTEGER)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_refund' AND pronargs = 2) THEN
        ALTER FUNCTION process_refund(UUID, INTEGER) SET search_path = public;
        RAISE LOG 'Fixed process_refund(UUID, INTEGER)';
    END IF;
END $$;

-- Alternative approach: Drop and recreate the functions if ALTER doesn't work
-- This is a fallback if the ALTER statements above don't work

-- Drop and recreate process_payment if it still has mutable search path
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'process_payment' 
        AND n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc p2 
            WHERE p2.proname = 'process_payment' 
            AND p2.proconfig @> ARRAY['search_path=public']
        )
    ) THEN
        -- Drop the function and recreate it with proper search path
        DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER, TEXT, TEXT) CASCADE;
        DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER, TEXT) CASCADE;
        DROP FUNCTION IF EXISTS process_payment(UUID, TEXT, INTEGER) CASCADE;
        
        RAISE LOG 'Dropped process_payment functions for recreation';
    END IF;
END $$;

-- Drop and recreate process_refund if it still has mutable search path
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'process_refund' 
        AND n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc p2 
            WHERE p2.proname = 'process_refund' 
            AND p2.proconfig @> ARRAY['search_path=public']
        )
    ) THEN
        -- Drop the function and recreate it with proper search path
        DROP FUNCTION IF EXISTS process_refund(UUID, INTEGER, TEXT) CASCADE;
        DROP FUNCTION IF EXISTS process_refund(UUID, INTEGER) CASCADE;
        
        RAISE LOG 'Dropped process_refund functions for recreation';
    END IF;
END $$;

-- Recreate process_payment function with proper search path
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

-- Recreate process_refund function with proper search path
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
    RAISE LOG 'Final function search path fix completed with function recreations';
END $$; 
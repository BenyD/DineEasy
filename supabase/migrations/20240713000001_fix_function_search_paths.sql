-- Fix function search paths for security
-- This migration sets explicit search paths for all functions to prevent security vulnerabilities

-- Payment functions
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

-- Newsletter functions
CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
    subscriber_email TEXT,
    subscriber_first_name TEXT DEFAULT NULL,
    subscriber_last_name TEXT DEFAULT NULL,
    subscriber_source TEXT DEFAULT 'website'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_subscription UUID;
    new_subscription UUID;
    result JSON;
BEGIN
    -- Check if email already exists
    SELECT id INTO existing_subscription
    FROM newsletter_subscriptions
    WHERE email = subscriber_email;
    
    IF existing_subscription IS NOT NULL THEN
        -- Update existing subscription to active
        UPDATE newsletter_subscriptions
        SET 
            is_active = true,
            unsubscribed_at = NULL,
            updated_at = NOW(),
            first_name = COALESCE(subscriber_first_name, first_name),
            last_name = COALESCE(subscriber_last_name, last_name)
        WHERE id = existing_subscription;
        
        result := json_build_object(
            'success', true,
            'message', 'Email already subscribed. Subscription reactivated.',
            'subscription_id', existing_subscription,
            'action', 'reactivated'
        );
    ELSE
        -- Create new subscription
        INSERT INTO newsletter_subscriptions (
            email,
            first_name,
            last_name,
            subscription_source,
            is_active
        ) VALUES (
            subscriber_email,
            subscriber_first_name,
            subscriber_last_name,
            subscriber_source,
            true
        ) RETURNING id INTO new_subscription;
        
        result := json_build_object(
            'success', true,
            'message', 'Successfully subscribed to newsletter.',
            'subscription_id', new_subscription,
            'action', 'created'
        );
    END IF;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION unsubscribe_from_newsletter(
    subscriber_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    subscription_id UUID;
    result JSON;
BEGIN
    -- Find the subscription
    SELECT id INTO subscription_id
    FROM newsletter_subscriptions
    WHERE email = subscriber_email;
    
    IF subscription_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'Email not found in newsletter subscriptions.'
        );
    ELSE
        -- Mark as unsubscribed
        UPDATE newsletter_subscriptions
        SET 
            is_active = false,
            unsubscribed_at = NOW(),
            updated_at = NOW()
        WHERE id = subscription_id;
        
        result := json_build_object(
            'success', true,
            'message', 'Successfully unsubscribed from newsletter.',
            'subscription_id', subscription_id
        );
    END IF;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_active_newsletter_subscribers()
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    preferences JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.email,
        ns.first_name,
        ns.last_name,
        ns.preferences
    FROM newsletter_subscriptions ns
    WHERE ns.is_active = true
    ORDER BY ns.created_at ASC;
END;
$$;

-- Email verification functions
CREATE OR REPLACE FUNCTION get_user_verification_status(
    p_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    has_verified_email BOOLEAN,
    verification_count INTEGER,
    last_verification_attempt TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        is_email_verified(u.id) as has_verified_email,
        COUNT(ev.id)::integer as verification_count,
        MAX(ev.created_at) as last_verification_attempt
    FROM auth.users u
    LEFT JOIN public.email_verifications ev ON u.id = ev.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.email;
END;
$$;

CREATE OR REPLACE FUNCTION is_email_verified(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    SELECT verified INTO v_verified
    FROM email_verifications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_verified, false);
END;
$$;

-- Stripe Connect functions
CREATE OR REPLACE FUNCTION refresh_stripe_account_status(
    p_restaurant_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function would typically call Stripe API to refresh status
    -- For now, we just update the timestamp
    UPDATE restaurants
    SET updated_at = NOW()
    WHERE id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_stripe_account_update(
    p_stripe_account_id TEXT,
    p_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Find restaurant by Stripe account ID
    SELECT id INTO v_restaurant_id
    FROM restaurants
    WHERE stripe_account_id = p_stripe_account_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Restaurant not found');
    END IF;
    
    -- Update restaurant status
    UPDATE restaurants
    SET 
        stripe_connect_status = p_status,
        updated_at = NOW()
    WHERE id = v_restaurant_id;
    
    -- Log the update
    INSERT INTO restaurant_stripe_logs (
        restaurant_id,
        stripe_account_id,
        event_type,
        status,
        created_at
    ) VALUES (
        v_restaurant_id,
        p_stripe_account_id,
        'account_update',
        p_status,
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'restaurant_id', v_restaurant_id,
        'status', p_status
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_account(
    p_stripe_account_id TEXT
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    name TEXT,
    email TEXT,
    stripe_account_id TEXT,
    stripe_account_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_account_id,
        r.stripe_account_enabled
    FROM restaurants r
    WHERE r.stripe_account_id = p_stripe_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_stripe_connect_status(
    p_restaurant_id UUID,
    p_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE restaurants
    SET 
        stripe_connect_status = p_status,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Restaurant not found');
    END IF;
    
    RETURN json_build_object('success', true, 'status', p_status);
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_stripe_connect_status(
    p_restaurant_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    stripe_account_id TEXT,
    stripe_account_enabled BOOLEAN,
    stripe_account_requirements JSONB,
    has_stripe_connect BOOLEAN,
    can_accept_payments BOOLEAN,
    payment_methods JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.email,
        r.stripe_account_id,
        r.stripe_account_enabled,
        r.stripe_account_requirements,
        COALESCE(r.stripe_account_id IS NOT NULL, false) as has_stripe_connect,
        COALESCE(r.stripe_account_enabled = true, false) as can_accept_payments,
        r.payment_methods
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_stripe_account_deauthorization(
    p_stripe_account_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE restaurants
    SET
        stripe_account_id = NULL,
        stripe_account_enabled = false,
        stripe_account_requirements = NULL,
        updated_at = NOW()
    WHERE stripe_account_id = p_stripe_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION validate_stripe_connect_setup(
    p_restaurant_id UUID
)
RETURNS TABLE (
    is_valid BOOLEAN,
    missing_fields TEXT[],
    recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN r.stripe_account_enabled = true THEN true ELSE false END as is_valid,
        ARRAY[]::text[] as missing_fields,
        ARRAY['Ensure all required business information is provided']::text[] as recommendations
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;

-- Subscription functions
CREATE OR REPLACE FUNCTION get_restaurant_subscription_status(
    p_restaurant_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT,
    has_subscription BOOLEAN,
    onboarding_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status,
        COALESCE(r.subscription_status IN ('active', 'trialing'), false) as has_subscription,
        COALESCE(r.onboarding_completed, false) as onboarding_completed
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_subscription(
    p_stripe_subscription_id TEXT,
    p_restaurant_id UUID,
    p_plan TEXT,
    p_interval TEXT,
    p_status TEXT,
    p_stripe_customer_id TEXT,
    p_stripe_price_id TEXT,
    p_current_period_start TIMESTAMPTZ,
    p_current_period_end TIMESTAMPTZ,
    p_trial_start TIMESTAMPTZ,
    p_trial_end TIMESTAMPTZ,
    p_cancel_at TIMESTAMPTZ,
    p_canceled_at TIMESTAMPTZ,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_time TIMESTAMPTZ := NOW();
    v_has_timestamps BOOLEAN := false;
BEGIN
    -- Check if we have any timestamps to satisfy the constraint
    v_has_timestamps := (
        p_current_period_start IS NOT NULL OR 
        p_current_period_end IS NOT NULL OR 
        p_trial_start IS NOT NULL OR 
        p_trial_end IS NOT NULL
    );
    
    -- If no timestamps are provided, use current time as fallback
    IF NOT v_has_timestamps THEN
        p_current_period_start := v_current_time;
        p_current_period_end := v_current_time + interval '1 month';
    END IF;
    
    -- For trial subscriptions, use trial timestamps as fallbacks for current period
    IF p_status = 'trialing' THEN
        IF p_current_period_start IS NULL AND p_trial_start IS NOT NULL THEN
            p_current_period_start := p_trial_start;
        END IF;
        IF p_current_period_end IS NULL AND p_trial_end IS NOT NULL THEN
            p_current_period_end := p_trial_end;
        END IF;
    END IF;
    
    -- Final fallback: ensure we have at least current_period_start
    IF p_current_period_start IS NULL THEN
        p_current_period_start := v_current_time;
    END IF;
    IF p_current_period_end IS NULL THEN
        p_current_period_end := p_current_period_start + interval '1 month';
    END IF;
    
    INSERT INTO subscriptions (
        id,
        restaurant_id,
        stripe_customer_id,
        stripe_subscription_id,
        plan,
        interval,
        status,
        stripe_price_id,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        cancel_at,
        canceled_at,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_restaurant_id,
        p_stripe_customer_id,
        p_stripe_subscription_id,
        p_plan::subscription_plan,
        p_interval::subscription_interval,
        p_status,
        p_stripe_price_id,
        p_current_period_start,
        p_current_period_end,
        p_trial_start,
        p_trial_end,
        p_cancel_at,
        p_canceled_at,
        p_metadata,
        NOW(),
        NOW()
    )
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET
        plan = EXCLUDED.plan,
        interval = EXCLUDED.interval,
        status = EXCLUDED.status,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        cancel_at = EXCLUDED.cancel_at,
        canceled_at = EXCLUDED.canceled_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
        
    -- Update restaurant subscription status
    UPDATE restaurants
    SET
        subscription_status = p_status,
        stripe_customer_id = p_stripe_customer_id,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_customer(
    p_stripe_customer_id TEXT
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    name TEXT,
    email TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status
    FROM restaurants r
    WHERE r.stripe_customer_id = p_stripe_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_by_id(
    p_restaurant_id UUID
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    name TEXT,
    email TEXT,
    stripe_customer_id TEXT,
    subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_restaurant_subscription_status(
    p_restaurant_id UUID,
    p_subscription_status TEXT,
    p_stripe_customer_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE restaurants
    SET
        subscription_status = p_subscription_status,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    -- Update stripe_customer_id if provided
    IF p_stripe_customer_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_customer_id = p_stripe_customer_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION complete_restaurant_onboarding(
    p_restaurant_id UUID,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_stripe_account_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE restaurants
    SET
        onboarding_completed = true,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    -- Update Stripe customer ID if provided
    IF p_stripe_customer_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_customer_id = p_stripe_customer_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
    
    -- Update Stripe account ID if provided
    IF p_stripe_account_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_account_id = p_stripe_account_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
END;
$$;

-- Utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_restaurant_payment_stats(
    p_restaurant_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_transactions BIGINT,
    total_amount NUMERIC,
    card_transactions BIGINT,
    card_amount NUMERIC,
    cash_transactions BIGINT,
    cash_amount NUMERIC,
    average_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE payment_method = 'card') as card_transactions,
        COALESCE(SUM(amount) FILTER (WHERE payment_method = 'card'), 0) as card_amount,
        COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_transactions,
        COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0) as cash_amount,
        COALESCE(AVG(amount), 0) as average_order_value
    FROM payments
    WHERE restaurant_id = p_restaurant_id
        AND created_at >= NOW() - interval '1 day' * p_days
        AND status = 'succeeded';
END;
$$; 
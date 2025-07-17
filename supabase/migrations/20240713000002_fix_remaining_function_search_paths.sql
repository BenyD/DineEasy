-- Fix remaining function search paths for security
-- This migration ensures all functions have explicit search paths set

-- Fix process_payment function (if it exists with different signature)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_payment' AND pronargs = 5) THEN
        ALTER FUNCTION process_payment(UUID, TEXT, INTEGER, TEXT, TEXT) SET search_path = public;
    END IF;
END $$;

-- Fix process_refund function (if it exists with different signature)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_refund' AND pronargs = 3) THEN
        ALTER FUNCTION process_refund(UUID, INTEGER, TEXT) SET search_path = public;
    END IF;
END $$;

-- Fix handle_stripe_account_update function (if it exists with different signature)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_stripe_account_update' AND pronargs = 2) THEN
        ALTER FUNCTION handle_stripe_account_update(TEXT, TEXT) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_stripe_account_update' AND pronargs = 0) THEN
        ALTER FUNCTION handle_stripe_account_update() SET search_path = public;
    END IF;
END $$;

-- Fix update_stripe_connect_status function (if it exists with different signature)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_stripe_connect_status' AND pronargs = 2) THEN
        ALTER FUNCTION update_stripe_connect_status(UUID, TEXT) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_stripe_connect_status' AND pronargs = 4) THEN
        ALTER FUNCTION update_stripe_connect_status(UUID, TEXT, BOOLEAN, JSONB) SET search_path = public;
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE LOG 'Fixed remaining function search paths for security';
END $$; 
-- Fix function search path mutable security warnings
-- Update existing functions to add SET search_path = public (only if they exist)

DO $$
BEGIN
    -- Update check_subscription_table_structure function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_subscription_table_structure' AND pronargs = 0) THEN
        ALTER FUNCTION check_subscription_table_structure() SET search_path = public;
    END IF;

    -- Update complete_restaurant_onboarding function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_restaurant_onboarding' AND pronargs = 3) THEN
        ALTER FUNCTION complete_restaurant_onboarding(uuid, text, text) SET search_path = public;
    END IF;

    -- Update create_owner_staff_record function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_owner_staff_record' AND pronargs = 0) THEN
        ALTER FUNCTION create_owner_staff_record() SET search_path = public;
    END IF;

    -- Update create_payment_with_fallback function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_payment_with_fallback' AND pronargs = 7) THEN
        ALTER FUNCTION create_payment_with_fallback(uuid, uuid, numeric, text, text, text, text) SET search_path = public;
    END IF;

    -- Update create_user_profile function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_profile' AND pronargs = 0) THEN
        ALTER FUNCTION create_user_profile() SET search_path = public;
    END IF;

    -- Update debug_stripe_connect_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'debug_stripe_connect_status' AND pronargs = 1) THEN
        ALTER FUNCTION debug_stripe_connect_status(text) SET search_path = public;
    END IF;

    -- Update get_all_permissions function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_permissions' AND pronargs = 0) THEN
        ALTER FUNCTION get_all_permissions() SET search_path = public;
    END IF;

    -- Update get_restaurant_by_id function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_restaurant_by_id' AND pronargs = 1) THEN
        ALTER FUNCTION get_restaurant_by_id(uuid) SET search_path = public;
    END IF;

    -- Update get_restaurant_by_stripe_account function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_restaurant_by_stripe_account' AND pronargs = 1) THEN
        ALTER FUNCTION get_restaurant_by_stripe_account(text) SET search_path = public;
    END IF;

    -- Update get_restaurant_by_stripe_customer function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_restaurant_by_stripe_customer' AND pronargs = 1) THEN
        ALTER FUNCTION get_restaurant_by_stripe_customer(text) SET search_path = public;
    END IF;

    -- Update get_restaurant_id_by_stripe_customer function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_restaurant_id_by_stripe_customer' AND pronargs = 1) THEN
        ALTER FUNCTION get_restaurant_id_by_stripe_customer(text) SET search_path = public;
    END IF;

    -- Update get_restaurant_stripe_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_restaurant_stripe_status' AND pronargs = 1) THEN
        ALTER FUNCTION get_restaurant_stripe_status(uuid) SET search_path = public;
    END IF;

    -- Update get_subscription_by_stripe_id function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_subscription_by_stripe_id' AND pronargs = 1) THEN
        ALTER FUNCTION get_subscription_by_stripe_id(text) SET search_path = public;
    END IF;

    -- Update has_permission function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission' AND pronargs = 2) THEN
        ALTER FUNCTION has_permission(uuid, text) SET search_path = public;
    END IF;

    -- Update has_staff_permission function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_staff_permission' AND pronargs = 2) THEN
        ALTER FUNCTION has_staff_permission(uuid, text) SET search_path = public;
    END IF;

    -- Update is_restaurant_owner function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_restaurant_owner' AND pronargs = 1) THEN
        ALTER FUNCTION is_restaurant_owner(uuid) SET search_path = public;
    END IF;

    -- Update is_stripe_connect_ready function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_stripe_connect_ready' AND pronargs = 1) THEN
        ALTER FUNCTION is_stripe_connect_ready(uuid) SET search_path = public;
    END IF;

    -- Update is_valid_staff_permission function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_valid_staff_permission' AND pronargs = 1) THEN
        ALTER FUNCTION is_valid_staff_permission(text[]) SET search_path = public;
    END IF;

    -- Update update_restaurant_onboarding_completion function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_onboarding_completion' AND pronargs = 3) THEN
        ALTER FUNCTION update_restaurant_onboarding_completion(uuid, text, boolean) SET search_path = public;
    END IF;

    -- Update update_restaurant_onboarding_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_onboarding_status' AND pronargs = 2) THEN
        ALTER FUNCTION update_restaurant_onboarding_status(uuid, boolean) SET search_path = public;
    END IF;

    -- Update update_restaurant_stripe_application function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_stripe_application' AND pronargs = 2) THEN
        ALTER FUNCTION update_restaurant_stripe_application(uuid, text) SET search_path = public;
    END IF;

    -- Update update_restaurant_stripe_connect_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_stripe_connect_status' AND pronargs = 4) THEN
        ALTER FUNCTION update_restaurant_stripe_connect_status(uuid, text, boolean, jsonb) SET search_path = public;
    END IF;

    -- Update update_restaurant_subscription_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_subscription_status' AND pronargs = 3) THEN
        ALTER FUNCTION update_restaurant_subscription_status(uuid, text, text) SET search_path = public;
    END IF;

    -- Update update_restaurant_subscription_status_simple function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_restaurant_subscription_status_simple' AND pronargs = 2) THEN
        ALTER FUNCTION update_restaurant_subscription_status_simple(uuid, text) SET search_path = public;
    END IF;

    -- Update update_stripe_connect_status function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_stripe_connect_status' AND pronargs = 4) THEN
        ALTER FUNCTION update_stripe_connect_status(uuid, text, boolean, jsonb) SET search_path = public;
    END IF;

    -- Update update_updated_at_column function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronargs = 0) THEN
        ALTER FUNCTION update_updated_at_column() SET search_path = public;
    END IF;

    -- Update upsert_subscription function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_subscription' AND pronargs = 12) THEN
        ALTER FUNCTION upsert_subscription(text, uuid, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone) SET search_path = public;
    END IF;

    -- Update verify_email function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_email' AND pronargs = 1) THEN
        ALTER FUNCTION verify_email(text) SET search_path = public;
    END IF;

    -- Update verify_password_reset_token function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_password_reset_token' AND pronargs = 1) THEN
        ALTER FUNCTION verify_password_reset_token(text) SET search_path = public;
    END IF;

    -- Update verify_restaurant_stripe_data function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_restaurant_stripe_data' AND pronargs = 1) THEN
        ALTER FUNCTION verify_restaurant_stripe_data(uuid) SET search_path = public;
    END IF;

    -- Update handle_stripe_account_update function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_stripe_account_update' AND pronargs = 0) THEN
        ALTER FUNCTION handle_stripe_account_update() SET search_path = public;
    END IF;

    -- Update log_restaurant_stripe_changes function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_restaurant_stripe_changes' AND pronargs = 0) THEN
        ALTER FUNCTION log_restaurant_stripe_changes() SET search_path = public;
    END IF;

    -- Update upsert_subscription function (ensure it's properly set)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_subscription' AND pronargs = 12) THEN
        ALTER FUNCTION upsert_subscription(text, uuid, text, text, text, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone) SET search_path = public;
    END IF;

    RAISE LOG 'Function search paths updated successfully';
END $$; 
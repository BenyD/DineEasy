-- Remove stripe_application_id column and related functions from restaurants table
-- This simplifies the Stripe Connect integration by removing unnecessary OAuth-specific logic

-- First drop the trigger that depends on stripe_application_id
DROP TRIGGER IF EXISTS stripe_account_updated ON restaurants;

-- Drop the application ID related functions
DROP FUNCTION IF EXISTS get_restaurant_by_stripe_application(text);
DROP FUNCTION IF EXISTS update_stripe_application_id(text, text);

-- Drop the index on stripe_application_id
DROP INDEX IF EXISTS idx_restaurants_stripe_application_id;

-- Remove the stripe_application_id column
ALTER TABLE restaurants DROP COLUMN IF EXISTS stripe_application_id;

-- Update the trigger to remove stripe_application_id from the update check
CREATE OR REPLACE FUNCTION log_restaurant_stripe_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log changes to Stripe Connect fields
    IF OLD.stripe_account_id IS DISTINCT FROM NEW.stripe_account_id THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_id',
            OLD.stripe_account_id,
            NEW.stripe_account_id,
            NOW()
        );
    END IF;

    IF OLD.stripe_account_enabled IS DISTINCT FROM NEW.stripe_account_enabled THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_enabled',
            OLD.stripe_account_enabled::text,
            NEW.stripe_account_enabled::text,
            NOW()
        );
    END IF;

    IF OLD.stripe_account_requirements IS DISTINCT FROM NEW.stripe_account_requirements THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_requirements',
            OLD.stripe_account_requirements::text,
            NEW.stripe_account_requirements::text,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger without stripe_application_id dependency
CREATE TRIGGER trigger_log_restaurant_stripe_changes
    BEFORE UPDATE OF stripe_account_id, stripe_account_enabled, stripe_account_requirements
    ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION log_restaurant_stripe_changes(); 
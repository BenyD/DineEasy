# Stripe Connect Migration Cleanup Guide

## Problem

Multiple Stripe Connect migrations have been created over time, causing conflicts with:

- Function return type changes
- View column name conflicts
- Duplicate function definitions
- Inconsistent function signatures

## Solution

The new migration `20240325000026_consolidate_stripe_connect_final.sql` consolidates all Stripe Connect functionality into a single, clean migration.

## Migrations to Remove/Disable

### High Priority (Remove these files):

1. `20240325000017_complete_stripe_connect_sync.sql` - Conflicts with function return types
2. `20240325000016_fix_stripe_connect_webhook.sql` - Duplicate function definitions
3. `20240325000015_comprehensive_stripe_connect_sync.sql` - Conflicts with view columns
4. `20240325000018_finalize_stripe_schema.sql` - Conflicts with function signatures
5. `20240325000003_improve_stripe_connect_handling.sql` - Duplicate functions

### Keep These (They're safe):

1. `20240322000000_add_stripe_connect.sql` - Initial schema (safe to keep)
2. `20240325000026_consolidate_stripe_connect_final.sql` - New consolidation migration

## Cleanup Steps

### Option 1: Remove Migration Files (Recommended)

```bash
# Remove the problematic migration files
rm supabase/migrations/20240325000017_complete_stripe_connect_sync.sql
rm supabase/migrations/20240325000016_fix_stripe_connect_webhook.sql
rm supabase/migrations/20240325000015_comprehensive_stripe_connect_sync.sql
rm supabase/migrations/20240325000018_finalize_stripe_schema.sql
rm supabase/migrations/20240325000003_improve_stripe_connect_handling.sql
```

### Option 2: Rename Files (If you want to keep them for reference)

```bash
# Rename files to prevent them from running
mv supabase/migrations/20240325000017_complete_stripe_connect_sync.sql supabase/migrations/20240325000017_complete_stripe_connect_sync.sql.disabled
mv supabase/migrations/20240325000016_fix_stripe_connect_webhook.sql supabase/migrations/20240325000016_fix_stripe_connect_webhook.sql.disabled
mv supabase/migrations/20240325000015_comprehensive_stripe_connect_sync.sql supabase/migrations/20240325000015_comprehensive_stripe_connect_sync.sql.disabled
mv supabase/migrations/20240325000018_finalize_stripe_schema.sql supabase/migrations/20240325000018_finalize_stripe_schema.sql.disabled
mv supabase/migrations/20240325000003_improve_stripe_connect_handling.sql supabase/migrations/20240325000003_improve_stripe_connect_handling.sql.disabled
```

## What the New Migration Does

The consolidation migration (`20240325000026_consolidate_stripe_connect_final.sql`) includes:

### 1. Comprehensive Cleanup

- Drops ALL existing Stripe Connect functions, views, triggers, and policies
- Uses `CASCADE` to handle dependencies properly
- Recreates everything from scratch

### 2. All Required Functions

- `get_restaurant_by_stripe_account()` - Webhook lookup
- `update_stripe_connect_status()` - Status updates
- `get_restaurant_stripe_status()` - Comprehensive status
- `handle_stripe_account_deauthorization()` - Deauthorization handling
- `refresh_stripe_account_status()` - Status refresh
- `validate_stripe_connect_setup()` - Setup validation
- `get_restaurant_payment_stats()` - Payment analytics
- `get_restaurant_by_stripe_customer()` - Customer lookup
- `update_restaurant_subscription_status()` - Subscription updates
- `complete_restaurant_onboarding()` - Onboarding completion

### 3. Database Schema

- Ensures all required columns exist
- Creates optimal indexes
- Sets up proper RLS policies
- Creates comprehensive view

### 4. Security & Performance

- All functions use `SECURITY DEFINER`
- Proper `SET search_path = public`
- Comprehensive error handling
- Performance-optimized indexes

## Running the Migration

After cleanup, run:

```bash
supabase db push
```

This will apply the consolidation migration and create a clean, conflict-free Stripe Connect setup.

## Verification

After running the migration, verify everything works:

```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%stripe%';

-- Check if view exists
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'restaurant_stripe_overview';

-- Test a function
SELECT * FROM get_restaurant_stripe_status('your-restaurant-id');
```

## Benefits of Consolidation

1. **No More Conflicts** - Single migration handles all Stripe Connect setup
2. **Clean State** - All objects recreated from scratch
3. **Consistent Signatures** - All functions have proper return types
4. **Better Performance** - Optimized indexes and functions
5. **Comprehensive Coverage** - All edge cases handled
6. **Easy Maintenance** - Single source of truth for Stripe Connect

## Rollback Plan

If needed, you can rollback by:

1. Restoring the original migration files
2. Running `supabase db reset` to start fresh
3. Reapplying migrations in order

However, the consolidation migration is designed to be safe and comprehensive, so rollback should not be necessary.

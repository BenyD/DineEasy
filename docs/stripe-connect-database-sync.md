# Stripe Connect Database Integration

This document outlines the database schema and functions for Stripe Connect integration in the DineEasy platform.

## Database Schema

### Restaurants Table - Stripe Connect Fields

| Field Name                    | Type                       | Description                                  | Default |
| ----------------------------- | -------------------------- | -------------------------------------------- | ------- |
| `stripe_account_id`           | `text`                     | Stripe Connect account ID                    | `null`  |
| `stripe_account_enabled`      | `boolean`                  | Whether the Stripe account is enabled        | `false` |
| `stripe_account_requirements` | `jsonb`                    | Stripe account requirements and verification | `null`  |
| `stripe_account_created_at`   | `timestamp with time zone` | When the Stripe account was created          | `null`  |

## Database Functions

### 1. `get_restaurant_by_stripe_account(p_stripe_account_id text)`

Retrieves a restaurant by its Stripe account ID.

**Parameters:**

- `p_stripe_account_id` (text): Stripe account ID

**Returns:** Restaurant record with Stripe Connect fields

**Usage:**

```sql
SELECT * FROM get_restaurant_by_stripe_account('acct_xxxxxxxxxxxxx');
```

### 2. `update_stripe_connect_status(p_restaurant_id text, p_stripe_account_id text, p_charges_enabled boolean, p_requirements jsonb)`

Updates a restaurant's Stripe Connect status.

**Parameters:**

- `p_restaurant_id` (text): Restaurant ID
- `p_stripe_account_id` (text): Stripe account ID
- `p_charges_enabled` (boolean): Whether charges are enabled
- `p_requirements` (jsonb): Account requirements

**Usage:**

```sql
SELECT update_stripe_connect_status(
  'restaurant-uuid',
  'acct_xxxxxxxxxxxxx',
  true,
  '{"currently_due": [], "eventually_due": []}'::jsonb
);
```

## Database Indexes

```sql
-- Index for efficient Stripe account lookups
CREATE INDEX idx_restaurants_stripe_account_id ON restaurants(stripe_account_id);
```

## Triggers

### Restaurant Stripe Changes Log

Automatically logs changes to Stripe Connect fields:

```sql
CREATE TRIGGER trigger_log_restaurant_stripe_changes
    BEFORE UPDATE OF stripe_account_id, stripe_account_enabled, stripe_account_requirements
    ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION log_restaurant_stripe_changes();
```

## Webhook Event Handling

The system handles the following Stripe Connect webhook events:

1. **`account.updated`** - Updates restaurant status when Stripe account details change
2. **`checkout.session.completed`** - Handles subscription creation and upgrades
3. **`customer.subscription.created`** - Creates/updates subscription records
4. **`customer.subscription.updated`** - Updates subscription status and details
5. **`invoice.payment_succeeded`** - Handles successful payments and trial end
6. **`invoice.payment_failed`** - Updates subscription status for failed payments

## Migration History

1. **`20240325000014_add_stripe_application_id.sql`** - Added application ID support (DEPRECATED)
2. **`20240325000015_comprehensive_stripe_connect_sync.sql`** - Comprehensive Stripe Connect sync
3. **`20240325000016_remove_stripe_application_id.sql`** - Simplified integration by removing application ID logic

## Current Status

- [x] `stripe_account_id` exists and is indexed
- [x] `stripe_account_enabled` exists
- [x] `stripe_account_requirements` exists
- [x] `stripe_account_created_at` exists
- [x] Database functions for account lookup and status updates
- [x] Webhook handlers for all relevant events
- [x] Change logging via triggers
- [x] Simplified integration without OAuth complexity

## Integration Flow

1. **Account Creation**: Restaurant owner initiates Stripe Connect setup
2. **Account Link**: User completes Stripe onboarding via account link
3. **Webhook Processing**: `account.updated` event updates restaurant status
4. **Status Verification**: System checks `charges_enabled` for payment processing
5. **Payment Processing**: Restaurant can now accept payments via Stripe Connect

This simplified approach removes the complexity of OAuth flows and application ID management, making the integration more reliable and easier to maintain.

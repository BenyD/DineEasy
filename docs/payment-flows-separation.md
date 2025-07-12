# Payment Flows Separation

## Overview

DineEasy has **two completely separate payment flows** that should never be consolidated:

1. **Subscriptions** - Restaurant paying DineEasy platform
2. **Stripe Connect** - Customers paying restaurants directly

## 1. Subscriptions (Restaurant → Platform)

### Purpose

Restaurants pay DineEasy for access to the platform features.

### Database Fields

- `stripe_customer_id` - Stripe customer ID for the restaurant
- `subscription_status` - Current subscription status
- `onboarding_completed` - Whether onboarding is complete

### Webhook Events

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Functions

- `get_restaurant_by_stripe_customer()`
- `update_restaurant_subscription_status()`
- `complete_restaurant_onboarding()`
- `upsert_subscription()`
- `get_restaurant_subscription_status()`

### Migration

- `20240325000027_consolidate_subscriptions_final.sql`

## 2. Stripe Connect (Customers → Restaurant)

### Purpose

Customers pay restaurants directly for food, drinks, and services.

### Database Fields

- `stripe_account_id` - Stripe Connect account ID
- `stripe_account_enabled` - Whether account can accept charges
- `stripe_account_requirements` - Account verification requirements
- `payment_methods` - Restaurant's payment method preferences

### Webhook Events

- `account.updated`
- `account.application.deauthorized`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### Functions

- `get_restaurant_by_stripe_account()`
- `update_stripe_connect_status()`
- `get_restaurant_stripe_connect_status()`
- `handle_stripe_account_deauthorization()`
- `refresh_stripe_account_status()`
- `validate_stripe_connect_setup()`
- `get_restaurant_payment_stats()`

### Migration

- `20240325000026_consolidate_stripe_connect_final.sql`

## Why They Must Be Separate

### 1. Different Business Logic

- **Subscriptions**: Platform revenue, recurring billing, feature access
- **Stripe Connect**: Restaurant revenue, one-time payments, order fulfillment

### 2. Different Stripe Products

- **Subscriptions**: Uses Stripe Subscriptions API
- **Stripe Connect**: Uses Stripe Connect API

### 3. Different Webhook Events

- **Subscriptions**: Customer and invoice events
- **Stripe Connect**: Account and payment intent events

### 4. Different Security Models

- **Subscriptions**: Restaurant as customer
- **Stripe Connect**: Restaurant as connected account

### 5. Different Data Requirements

- **Subscriptions**: Plan, interval, trial periods
- **Stripe Connect**: Account verification, payout settings

## Code Organization

### Subscriptions (Restaurant → Platform)

```
lib/actions/subscription.ts
lib/actions/billing.ts
hooks/useBillingData.ts
app/(dashboard)/dashboard/billing/
```

### Stripe Connect (Customers → Restaurant)

```
lib/actions/stripe-connect.ts
lib/actions/payments.ts
app/(dashboard)/dashboard/payments/
app/(qr-client)/
```

## Migration Strategy

### Step 1: Stripe Connect Migration

```sql
-- 20240325000026_consolidate_stripe_connect_final.sql
-- Handles customer payments to restaurants
```

### Step 2: Subscriptions Migration

```sql
-- 20240325000027_consolidate_subscriptions_final.sql
-- Handles restaurant payments to platform
```

## Testing Checklist

### Subscriptions

- [ ] Restaurant can subscribe to plans
- [ ] Trial periods work correctly
- [ ] Plan upgrades/downgrades work
- [ ] Billing page shows correct information
- [ ] Webhooks update subscription status

### Stripe Connect

- [ ] Restaurant can connect Stripe account
- [ ] Customers can pay via QR code
- [ ] Payments page shows transactions
- [ ] Account verification works
- [ ] Webhooks update account status

## Common Mistakes to Avoid

1. **Don't consolidate the migrations** - Keep them separate
2. **Don't mix function names** - Use clear prefixes
3. **Don't share webhook handlers** - Handle events separately
4. **Don't confuse customer IDs** - `stripe_customer_id` vs `stripe_account_id`
5. **Don't merge business logic** - Keep payment flows isolated

## Benefits of Separation

1. **Clearer code organization**
2. **Easier debugging and maintenance**
3. **Independent scaling and updates**
4. **Better security isolation**
5. **Simpler testing and deployment**

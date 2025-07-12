# Stripe Schema Overview

This document explains the Stripe integration in DineEasy, which handles two distinct payment flows:

1. **Subscription Payments** - Restaurant paying the platform
2. **Stripe Connect** - Customers paying the restaurant

## 🏗️ Database Schema

### Restaurants Table Stripe Fields

The `restaurants` table contains the following Stripe-related fields:

#### Subscription Fields (Restaurant → Platform)

- `stripe_customer_id` - Stripe customer ID for subscription payments
- `subscription_status` - Current subscription status (`incomplete`, `pending`, `active`, `trialing`, `canceled`, etc.)

#### Stripe Connect Fields (Customers → Restaurant)

- `stripe_account_id` - Stripe Connect account ID for receiving customer payments
- `stripe_account_enabled` - Whether the account can accept charges
- `stripe_account_requirements` - Account verification requirements and status
- `stripe_account_created_at` - When the Stripe Connect account was created

#### General Fields

- `onboarding_completed` - Whether the restaurant has completed onboarding

## 💳 Payment Flows

### 1. Subscription Payments (Restaurant → Platform)

**Purpose**: Restaurants pay monthly/yearly subscription fees to use the platform.

**Flow**:

1. Restaurant creates account during onboarding
2. Stripe customer is created and linked to restaurant
3. Restaurant selects a plan (starter/pro/elite)
4. Stripe Checkout creates subscription
5. Platform collects subscription fees

**Key Fields**:

- `stripe_customer_id` - Links restaurant to Stripe customer
- `subscription_status` - Tracks subscription state

**Webhook Events**:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 2. Stripe Connect (Customers → Restaurant)

**Purpose**: Customers pay restaurants for food orders via QR codes.

**Flow**:

1. Restaurant completes Stripe Connect onboarding
2. Stripe Connect account is created and linked to restaurant
3. Customers scan QR codes and place orders
4. Platform creates payment intents with application fees
5. Money flows: Customer → Platform (with 2% fee) → Restaurant

**Key Fields**:

- `stripe_account_id` - Links restaurant to Stripe Connect account
- `stripe_account_enabled` - Whether account can accept payments
- `stripe_account_requirements` - Verification status

**Webhook Events**:

- `account.updated` - Updates account status and requirements
- `payment_intent.succeeded` - Records successful customer payments
- `payment_intent.payment_failed` - Records failed payments

## 🔧 Database Functions

### Core Functions

#### `get_restaurant_stripe_status(restaurant_id)`

Returns comprehensive Stripe status including:

- Subscription status and customer ID
- Stripe Connect status and account ID
- Computed fields: `has_subscription`, `has_stripe_connect`, `can_accept_payments`

#### `update_restaurant_subscription_status(restaurant_id, status, customer_id)`

Updates subscription status and optionally customer ID.

#### `update_restaurant_stripe_connect_status(restaurant_id, account_id, enabled, requirements)`

Updates Stripe Connect account status and requirements.

#### `complete_restaurant_onboarding(restaurant_id, customer_id, account_id)`

Marks onboarding as complete and optionally updates Stripe IDs.

### Helper Functions

#### `get_restaurant_by_stripe_customer(customer_id)`

Finds restaurant by Stripe customer ID (for subscription webhooks).

#### `get_restaurant_by_stripe_account(account_id)`

Finds restaurant by Stripe Connect account ID (for Connect webhooks).

## 📊 Database Views

### `restaurant_stripe_overview`

Provides a comprehensive view of all restaurants with their Stripe status:

- Basic restaurant info
- Subscription status and active subscription flag
- Stripe Connect status and payment acceptance flag
- Onboarding completion status

## 🔄 Webhook Processing

### Subscription Webhooks

- **Handler**: `app/api/webhooks/stripe/route.ts`
- **Events**: `customer.subscription.*`, `invoice.payment_*`
- **Action**: Updates `subscriptions` table and restaurant `subscription_status`

### Stripe Connect Webhooks

- **Handler**: `app/api/webhooks/stripe/route.ts`
- **Events**: `account.updated`, `payment_intent.*`
- **Action**: Updates restaurant Stripe Connect status and processes payments

## 🚀 Onboarding Flow

1. **Restaurant Creation**: Creates Stripe customer for subscriptions
2. **Plan Selection**: Creates subscription via Stripe Checkout
3. **Stripe Connect**: Creates Stripe Connect account for customer payments
4. **Onboarding Complete**: Marks restaurant as ready to accept payments

## 💰 Platform Fees

- **Subscription Payments**: No platform fee (restaurant pays full amount)
- **Customer Payments**: 2% platform fee collected on all card payments
- **Cash Payments**: No platform fee (no Stripe involvement)

## 🔍 Monitoring and Debugging

### Database Functions for Debugging

- `get_restaurant_stripe_status()` - Check complete Stripe status
- `verify_restaurant_stripe_data()` - Verify data integrity
- `debug_stripe_connect_status()` - Debug Connect issues

### Logging

- All Stripe operations are logged with detailed information
- Webhook processing includes comprehensive error handling
- Database functions include debug logging

## 📝 Best Practices

1. **Always verify ownership** before updating Stripe data
2. **Use database functions** instead of direct table updates
3. **Handle webhook failures gracefully** with retry logic
4. **Log all Stripe operations** for debugging
5. **Separate concerns** between subscription and Connect flows
6. **Validate data integrity** before completing onboarding

## 🔐 Security

- All functions use `SECURITY DEFINER` for proper permissions
- RLS policies ensure users can only access their own data
- Webhook signatures are verified for all Stripe events
- Sensitive data is not logged in production

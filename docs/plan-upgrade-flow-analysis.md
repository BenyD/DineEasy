# Plan Upgrade Flow Analysis

## Overview

This document provides a comprehensive analysis of the DineEasy plan upgrade flow, billing page setup, and webhook configuration.

## ✅ Plan Upgrade Flow

### Flow Architecture

1. **User initiates upgrade** → Change Plan page (`/dashboard/billing/change-plan`)
2. **Plan selection** → User chooses new plan and billing cycle
3. **Checkout creation** → `createPlanChangeSession` action creates Stripe checkout
4. **Payment processing** → User completes payment via Stripe
5. **Webhook processing** → `checkout.session.completed` webhook handles the upgrade
6. **Database updates** → Both `subscriptions` table and `restaurants.subscription_status` updated
7. **UI feedback** → User redirected to billing page with success message

### Key Features

#### Trial Upgrade Support

- **Detection**: Uses metadata `isTrialUpgrade: "true"` to identify trial upgrades
- **Preservation**: Maintains original trial end date via `original_trial_end` metadata
- **UI Messaging**: Shows appropriate messaging about trial continuation
- **Database**: Updates subscription with preserved trial period

#### Proration Handling

- **Calculation**: Uses Stripe's built-in proration for plan changes
- **Display**: Shows proration information on change plan page
- **Processing**: Handled automatically by Stripe during checkout

#### Plan Validation

- **Duplicate Prevention**: Prevents upgrading to the same plan/interval
- **Currency Support**: Supports multiple currencies (USD, CHF, EUR, GBP, INR, AUD)
- **Price Validation**: Validates Stripe price IDs exist for selected plan/currency

### Code Flow

```typescript
// 1. User selects plan
handlePlanSelect(planId: string)

// 2. Create checkout session
const result = await createPlanChangeSession(planId, interval, currency)

// 3. Redirect to Stripe
window.location.href = result.checkoutUrl

// 4. Webhook processes completion
case "checkout.session.completed":
  // Handle subscription upgrade
  // Update database
  // Send email receipt
```

## ✅ Billing Page Setup

### Features

#### Current Plan Display

- **Plan Information**: Shows current plan name, price, and billing cycle
- **Status Badge**: Visual indicator of subscription status (Active, Trial, Cancelled)
- **Features List**: Displays plan features from `PLANS` constant
- **Usage Statistics**: Shows current usage vs. limits

#### Trial Management

- **Countdown Display**: Shows days remaining in trial
- **Trial Upgrade Detection**: Identifies and displays trial upgrade scenarios
- **Billing Information**: Shows when trial ends and billing begins

#### Cancellation Handling

- **Cancelled Status**: Special UI for cancelled subscriptions
- **Access Period**: Shows when pro features expire
- **Reactivation**: Easy path to reactivate subscription

#### Usage Monitoring

- **Real-time Data**: Fetches current usage from database
- **Progress Bars**: Visual representation of usage vs. limits
- **Plan Limits**: Shows limits based on current plan

### Error Handling

- **Loading States**: Skeleton loaders for better UX
- **Error Recovery**: Retry mechanism for failed data fetches
- **Graceful Degradation**: Fallback values for failed usage queries

### Currency Support

- **Dynamic Currency**: Uses restaurant's currency setting
- **Price Formatting**: Proper currency symbol display
- **Multi-currency**: Supports all platform currencies

## ✅ Webhook Configuration

### Event Coverage

#### Subscription Events

- `customer.subscription.updated` - Handles status changes and metadata updates
- `customer.subscription.deleted` - Handles cancellations and upgrades
- `checkout.session.completed` - Processes new subscriptions and upgrades

#### Payment Events

- `invoice.payment_succeeded` - Handles successful payments and trial end
- `invoice.payment_failed` - Handles failed payments and past_due status
- `charge.refunded` - Handles refunds for both subscriptions and customer payments

#### Connect Events

- `account.updated` - Updates Stripe Connect account status
- `payment_intent.succeeded` - Records customer payments to restaurants
- `charge.succeeded` - Alternative payment recording method

### Database Operations

#### Subscription Management

```sql
-- Update restaurant subscription status
SELECT update_restaurant_subscription_status(
  restaurant_id,
  subscription_status,
  stripe_customer_id
);

-- Upsert subscription record
SELECT upsert_subscription(
  stripe_subscription_id,
  restaurant_id,
  stripe_customer_id,
  plan,
  interval,
  currency,
  status,
  current_period_start,
  current_period_end,
  trial_start,
  trial_end,
  cancel_at,
  canceled_at
);
```

#### Payment Recording

```sql
-- Create payment record for customer payments
SELECT create_payment_with_fallback(
  restaurant_id,
  order_id,
  amount,
  status,
  payment_method,
  stripe_charge_id,
  currency
);
```

### Error Handling

- **Retry Logic**: Exponential backoff for database operations
- **Validation**: Comprehensive metadata validation
- **Logging**: Structured logging for debugging
- **Fallbacks**: Multiple lookup methods for restaurant identification

### Email Integration

- **Invoice Receipts**: Sent after successful subscription payments
- **Plan Changes**: Email notifications for upgrades and new subscriptions
- **Trial End**: Notifications when trial periods end

## 🔧 Recent Improvements

### Enhanced Error Handling

- Added retry logic with exponential backoff
- Better error categorization (retryable vs. non-retryable)
- Structured logging for webhook events

### Improved Loading States

- Skeleton loaders for billing page
- Better error recovery with retry buttons
- Graceful handling of partial data failures

### Database Resilience

- `Promise.allSettled` for usage statistics
- Fallback values for failed queries
- Better error logging and recovery

## 📊 Monitoring & Debugging

### Webhook Logging

```javascript
console.log("Processing webhook event:", {
  type: event.type,
  id: event.id,
  created: new Date(event.created * 1000).toISOString(),
  livemode: event.livemode,
});
```

### Database Debugging

```javascript
console.log("Billing data debug:", {
  restaurantId: restaurant.id,
  subscriptionStatus: restaurant.subscription_status,
  currentSubscription,
  subscriptionCount: restaurant.subscriptions?.length || 0,
  // ... more fields
});
```

### Error Tracking

- Structured error messages
- Retry attempt logging
- Operation-specific error context

## 🚀 Production Readiness

### Security

- ✅ Webhook signature verification
- ✅ Environment-specific webhook secrets
- ✅ Database function security (SECURITY DEFINER)
- ✅ RLS policies for data access

### Reliability

- ✅ Retry logic for transient failures
- ✅ Comprehensive error handling
- ✅ Database transaction safety
- ✅ Idempotent operations

### Scalability

- ✅ Efficient database queries with indexes
- ✅ Async webhook processing
- ✅ Proper connection pooling
- ✅ Rate limiting considerations

### Monitoring

- ✅ Structured logging
- ✅ Error tracking
- ✅ Performance metrics
- ✅ Database query optimization

## 📋 Testing Checklist

### Plan Upgrade Flow

- [ ] New subscription creation
- [ ] Plan upgrade (monthly to yearly)
- [ ] Plan upgrade (yearly to monthly)
- [ ] Trial upgrade preservation
- [ ] Proration calculation
- [ ] Currency handling
- [ ] Error scenarios

### Webhook Processing

- [ ] All subscription events
- [ ] Payment success/failure
- [ ] Refund processing
- [ ] Connect account updates
- [ ] Email delivery
- [ ] Database consistency

### Billing Page

- [ ] Loading states
- [ ] Error recovery
- [ ] Real-time updates
- [ ] Currency display
- [ ] Usage statistics
- [ ] Trial management

## 🎯 Recommendations

### Immediate

1. **Webhook Monitoring**: Set up alerts for webhook failures
2. **Database Monitoring**: Monitor subscription table growth
3. **Email Delivery**: Track email delivery rates

### Future Enhancements

1. **Webhook Retry Queue**: Implement persistent retry mechanism
2. **Real-time Updates**: WebSocket integration for live billing updates
3. **Advanced Analytics**: Subscription analytics dashboard
4. **Automated Testing**: End-to-end webhook testing suite

## 📚 Related Documentation

- [Stripe Schema Overview](./stripe-schema-overview.md)
- [Database Migrations](../supabase/migrations/)
- [Webhook Configuration](../app/api/webhooks/stripe/route.ts)
- [Billing Actions](../lib/actions/billing.ts)
- [Subscription Actions](../lib/actions/subscription.ts)

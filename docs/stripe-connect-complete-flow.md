# Complete Stripe Connect Flow & Edge Case Handling

This document outlines the complete Stripe Connect integration in DineEasy, including all edge cases, webhook handling, and the enhanced payments page functionality.

## 🏗️ **Architecture Overview**

### **Two Payment Flows**

1. **Subscription Payments** - Restaurant → Platform (monthly/yearly fees)
2. **Stripe Connect** - Customers → Restaurant (QR code payments)

### **Key Components**

- **Payments Page** - Restaurant dashboard for payment management
- **Stripe Connect Actions** - Server actions for account management
- **Webhook Handler** - Real-time event processing
- **Database Functions** - Secure data operations

## 🔄 **Complete Stripe Connect Flow**

### **1. Account Creation**

```typescript
// Restaurant clicks "Connect with Stripe"
const result = await createStripeAccount();
// Redirects to Stripe Connect onboarding
window.location.href = result.accountLink;
```

**Edge Cases Handled:**

- ✅ Country restrictions (only CH, US, EU, GB, AU supported)
- ✅ Existing account detection
- ✅ Error handling with user-friendly messages
- ✅ Database transaction safety

### **2. Onboarding Process**

```typescript
// Stripe collects business information
// Restaurant completes verification
// Returns to DineEasy with success=true
```

**Edge Cases Handled:**

- ✅ Incomplete onboarding detection
- ✅ Requirements validation
- ✅ Account status synchronization
- ✅ Fallback error handling

### **3. Account Status Management**

```typescript
// Real-time status updates via webhooks
case "account.updated": {
  // Update restaurant with new status
  await updateStripeConnectStatus(restaurantId, accountId, chargesEnabled, requirements);
}
```

**Edge Cases Handled:**

- ✅ Account verification requirements
- ✅ Payouts enabled/disabled
- ✅ Account deauthorization
- ✅ Requirements changes

## 🎯 **Enhanced Payments Page Features**

### **1. Direct Stripe Dashboard Access**

```typescript
const handleOpenStripeDashboard = async () => {
  const result = await createStripeDashboardLink(restaurantId);
  window.open(result.dashboardUrl, "_blank");
};
```

**Benefits:**

- ✅ Direct login to restaurant's Stripe account
- ✅ No need to remember Stripe credentials
- ✅ Secure access via Stripe's login links
- ✅ One-click access to transaction history

### **2. Account Status Monitoring**

```typescript
// Real-time status display
{
  stripeAccount.charges_enabled ? "Active" : "Pending";
}
{
  stripeRequirements.payoutsEnabled ? "Payouts Enabled" : "Payouts Pending";
}
```

**Features:**

- ✅ Live status updates
- ✅ Requirements tracking
- ✅ Payout status monitoring
- ✅ Verification progress

### **3. Account Update Management**

```typescript
const handleUpdateStripeAccount = async () => {
  const result = await createAccountUpdateLink(restaurantId);
  window.location.href = result.accountLink;
};
```

**Use Cases:**

- ✅ Complete pending verifications
- ✅ Update business information
- ✅ Add bank account details
- ✅ Resolve account issues

## 🔧 **Webhook Event Handling**

### **Supported Events**

#### **1. account.updated**

```typescript
case "account.updated": {
  const account = event.data.object as Stripe.Account;

  // Update restaurant status
  await updateStripeConnectStatus(
    restaurantId,
    account.id,
    account.charges_enabled,
    account.requirements
  );
}
```

**Handles:**

- ✅ Account verification completion
- ✅ Requirements changes
- ✅ Payouts enabled/disabled
- ✅ Account status changes

#### **2. account.application.deauthorized**

```typescript
case "account.application.deauthorized": {
  // Log deauthorization for manual intervention
  console.log("Account deauthorization detected");
}
```

**Handles:**

- ✅ Account deauthorization events
- ✅ Manual intervention required
- ✅ Audit trail maintenance

### **Error Handling & Fallbacks**

#### **1. Restaurant Lookup Fallbacks**

```typescript
// Primary lookup
const { data: restaurant } = await adminSupabase
  .rpc("get_restaurant_by_stripe_account", { p_stripe_account_id: account.id })
  .single();

// Fallback lookup
if (!restaurant) {
  const { data: fallbackRestaurant } = await adminSupabase
    .from("restaurants")
    .select("*")
    .eq("stripe_account_id", account.id)
    .single();
}
```

#### **2. Database Operation Safety**

```typescript
const safeDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  // Retry logic with exponential backoff
  // Error logging and recovery
};
```

## 🗄️ **Database Schema & Functions**

### **Core Functions**

#### **1. get_restaurant_by_stripe_account**

```sql
CREATE OR REPLACE FUNCTION get_restaurant_by_stripe_account(p_stripe_account_id text)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_account_enabled boolean
)
```

#### **2. update_stripe_connect_status**

```sql
CREATE OR REPLACE FUNCTION update_stripe_connect_status(
  p_restaurant_id uuid,
  p_stripe_account_id text,
  p_charges_enabled boolean,
  p_requirements jsonb
)
```

#### **3. validate_stripe_connect_setup**

```sql
CREATE OR REPLACE FUNCTION validate_stripe_connect_setup(p_restaurant_id uuid)
RETURNS TABLE (
  is_valid boolean,
  missing_fields text[],
  recommendations text[]
)
```

### **Performance Optimizations**

- ✅ Indexes on `stripe_account_id`, `stripe_customer_id`
- ✅ Composite indexes for common queries
- ✅ Efficient lookup functions
- ✅ Cached status information

## 🛡️ **Security & Compliance**

### **1. RLS Policies**

```sql
CREATE POLICY "Users can view their own restaurant stripe status" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own restaurant stripe status" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);
```

### **2. SECURITY DEFINER Functions**

```sql
-- All functions use SECURITY DEFINER for webhook access
-- Prevents RLS policy conflicts
-- Ensures consistent access patterns
```

### **3. Input Validation**

```typescript
// Validate country restrictions
const supportedCountries = ["CH", "US", "EU", "GB", "AU"];
if (!supportedCountries.includes(restaurantCountry)) {
  return { error: "Country not supported" };
}
```

## 📊 **Monitoring & Analytics**

### **1. Payment Statistics**

```sql
CREATE OR REPLACE FUNCTION get_restaurant_payment_stats(
  p_restaurant_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_transactions bigint,
  total_amount numeric,
  card_transactions bigint,
  card_amount numeric,
  cash_transactions bigint,
  cash_amount numeric,
  average_order_value numeric
)
```

### **2. Account Health Monitoring**

```typescript
// Real-time status checks
const accountHealth = await validateStripeConnectSetup(restaurantId);
if (!accountHealth.is_valid) {
  // Show recommendations to user
  showRecommendations(accountHealth.recommendations);
}
```

## 🚀 **Testing Checklist**

### **Account Creation**

- [ ] New restaurant can create Stripe account
- [ ] Existing account detection works
- [ ] Country restrictions enforced
- [ ] Error handling displays user-friendly messages

### **Onboarding Flow**

- [ ] Stripe onboarding redirects correctly
- [ ] Return URL handling works
- [ ] Account status updates properly
- [ ] Requirements tracking accurate

### **Webhook Processing**

- [ ] account.updated events processed
- [ ] Restaurant lookup works with fallbacks
- [ ] Database updates successful
- [ ] Error logging comprehensive

### **Payments Page**

- [ ] Direct Stripe dashboard link works
- [ ] Account status displays correctly
- [ ] Update account functionality works
- [ ] Refresh status updates data

### **Edge Cases**

- [ ] Account deauthorization handled
- [ ] Incomplete verification shows guidance
- [ ] Network errors handled gracefully
- [ ] Database connection issues resolved

## 🔄 **Deployment Checklist**

### **Environment Variables**

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### **Stripe Dashboard Setup**

- [ ] Webhook endpoint configured
- [ ] Events subscribed: `account.updated`, `account.application.deauthorized`
- [ ] Connect application configured
- [ ] Platform fees set to 2%

### **Database Migration**

```bash
# Run the comprehensive migration
supabase db push
```

### **Testing**

- [ ] Create test Stripe Connect account
- [ ] Verify webhook events received
- [ ] Test payments page functionality
- [ ] Validate edge case handling

## 📈 **Performance Metrics**

### **Key Performance Indicators**

- **Account Creation Success Rate**: >95%
- **Webhook Processing Time**: <500ms
- **Database Query Performance**: <100ms
- **User Experience**: <2s page load

### **Monitoring Points**

- Webhook event processing
- Database function execution times
- Stripe API response times
- User interaction success rates

## 🔧 **Troubleshooting Guide**

### **Common Issues**

#### **1. Webhook Not Receiving Events**

- Check webhook endpoint URL
- Verify webhook secret
- Check Stripe dashboard for failed deliveries
- Review server logs for errors

#### **2. Account Status Not Updating**

- Verify webhook events are being processed
- Check database function permissions
- Review RLS policies
- Validate function parameters

#### **3. Dashboard Link Not Working**

- Check Stripe account permissions
- Verify account ID is correct
- Review Stripe API response
- Check browser console for errors

### **Debug Functions**

```sql
-- Check restaurant Stripe status
SELECT * FROM get_restaurant_stripe_status('restaurant-uuid');

-- Validate setup
SELECT * FROM validate_stripe_connect_setup('restaurant-uuid');

-- Check webhook processing
SELECT * FROM restaurant_stripe_overview WHERE id = 'restaurant-uuid';
```

## 🎯 **Future Enhancements**

### **Planned Features**

- [ ] Real-time status notifications
- [ ] Advanced analytics dashboard
- [ ] Automated compliance monitoring
- [ ] Multi-currency support
- [ ] Advanced payout scheduling

### **Performance Improvements**

- [ ] Database query optimization
- [ ] Caching layer implementation
- [ ] Background job processing
- [ ] API rate limiting

This comprehensive setup ensures that the Stripe Connect integration is robust, secure, and handles all edge cases while providing an excellent user experience for restaurant owners.

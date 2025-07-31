# Edge Case Analysis & Improvements

## 🔍 **Current Edge Case Handling**

### ✅ **Well-Handled Areas**

1. **Webhook Error Handling**
   - Retry logic with exponential backoff
   - Graceful degradation for email failures
   - Comprehensive logging
   - Fallback mechanisms for data lookup

2. **Payment Processing**
   - 3D Secure authentication handling
   - Payment and order timeouts
   - Definitive vs temporary failure classification
   - Order cleanup logic

3. **Subscription Management**
   - Trial period preservation during upgrades
   - Plan transition handling
   - Metadata preservation
   - Status synchronization

4. **Stripe Connect**
   - Account status tracking
   - Fallback search mechanisms
   - Error categorization
   - Geographic restrictions

## ⚠️ **Identified Edge Cases & Improvements**

### **1. Database Race Conditions**

**Issue**: Multiple webhook events could create race conditions when updating subscription status.

**Current Code**:
```typescript
const { error: updateError } = await adminSupabase.rpc(
  "update_restaurant_subscription_status",
  { p_restaurant_id: restaurantId, p_subscription_status: subscription.status }
);
```

**Recommendation**: Use upsert operations and add database constraints
```sql
-- Add unique constraint to prevent duplicate subscriptions
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_restaurant_active_subscription 
UNIQUE (restaurant_id, status) 
WHERE status IN ('active', 'trialing');
```

### **2. Webhook Idempotency**

**Issue**: Webhook events could be processed multiple times.

**Current**: Basic event logging but no idempotency checks.

**Recommendation**: Add idempotency tracking
```typescript
// Check if webhook event was already processed
const { data: existingEvent } = await adminSupabase
  .from("webhook_events")
  .select("id, processed_at")
  .eq("stripe_event_id", event.id)
  .single();

if (existingEvent?.processed_at) {
  console.log("Webhook event already processed:", event.id);
  return new NextResponse("Event already processed", { status: 200 });
}
```

### **3. Partial Payment Failures**

**Issue**: What happens if only part of a subscription payment succeeds?

**Current**: Handles full payment success/failure but not partial scenarios.

**Recommendation**: Add partial payment handling
```typescript
case "invoice.payment_failed": {
  const invoice = event.data.object as Stripe.Invoice;
  
  // Check for partial payments
  if (invoice.amount_paid > 0 && invoice.amount_paid < invoice.amount_due) {
    console.log("Partial payment detected:", {
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      remaining: invoice.amount_due - invoice.amount_paid
    });
    
    // Handle partial payment logic
    await handlePartialPayment(invoice);
  }
}
```

### **4. Network Timeouts**

**Issue**: Stripe API calls could timeout during high load.

**Current**: Basic error handling but no timeout configuration.

**Recommendation**: Add timeout configuration
```typescript
// Add timeout to Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
  timeout: 30000, // 30 second timeout
  maxNetworkRetries: 3,
});
```

### **5. Currency Mismatches**

**Issue**: What if a restaurant changes currency after subscription creation?

**Current**: No handling for currency changes during active subscriptions.

**Recommendation**: Add currency change validation
```typescript
export async function validateCurrencyChange(
  restaurantId: string, 
  newCurrency: string
) {
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("status, currency")
    .eq("restaurant_id", restaurantId)
    .in("status", ["active", "trialing"]);
    
  if (subscriptions?.length > 0) {
    const hasActiveSubscriptions = subscriptions.some(
      sub => sub.status === "active" || sub.status === "trialing"
    );
    
    if (hasActiveSubscriptions) {
      return {
        error: "Cannot change currency while active subscriptions exist. Please cancel subscriptions first."
      };
    }
  }
  
  return { success: true };
}
```

### **6. Stripe Account Deletion**

**Issue**: What happens if a Stripe Connect account is deleted?

**Current**: Handles deauthorization but not account deletion.

**Recommendation**: Add account deletion handling
```typescript
case "account.application.deauthorized": {
  const application = event.data.object as Stripe.Application;
  
  // Find restaurants using this account
  const { data: restaurants } = await adminSupabase
    .from("restaurants")
    .select("id, name, email")
    .eq("stripe_account_id", application.account);
    
  for (const restaurant of restaurants || []) {
    // Disable payment processing
    await adminSupabase
      .from("restaurants")
      .update({
        stripe_account_enabled: false,
        stripe_account_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", restaurant.id);
      
    // Send notification email
    await sendStripeAccountDeletionEmail(restaurant.email, {
      restaurantName: restaurant.name,
      accountId: application.account
    });
  }
}
```

### **7. Duplicate Order Prevention**

**Issue**: QR payments could create duplicate orders if webhook fails.

**Current**: Basic order cleanup but no duplicate prevention.

**Recommendation**: Add idempotency keys
```typescript
export async function createQRPaymentIntent(paymentData: QRPaymentData) {
  // Generate idempotency key
  const idempotencyKey = `qr_payment_${paymentData.tableId}_${Date.now()}`;
  
  const paymentIntent = await stripe.paymentIntents.create({
    // ... existing config
    metadata: {
      ...paymentData,
      idempotencyKey,
      isQRPayment: "true"
    }
  }, {
    idempotencyKey // Stripe will prevent duplicate payments
  });
}
```

### **8. Subscription Proration Edge Cases**

**Issue**: Complex proration scenarios during plan changes.

**Current**: Basic upgrade handling but limited proration logic.

**Recommendation**: Add comprehensive proration handling
```typescript
export async function calculateProration(
  currentSubscription: Stripe.Subscription,
  newPriceId: string
) {
  const currentPeriodEnd = currentSubscription.current_period_end;
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = (currentPeriodEnd - now) / (24 * 60 * 60);
  
  // Calculate proration based on remaining days
  const prorationDate = now;
  
  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: currentSubscription.customer as string,
    subscription: currentSubscription.id,
    subscription_items: [{
      id: currentSubscription.items.data[0].id,
      price: newPriceId,
    }],
    subscription_proration_date: prorationDate,
  });
  
  return {
    prorationAmount: invoice.total,
    daysRemaining,
    prorationDate
  };
}
```

### **9. Webhook Signature Verification**

**Issue**: Webhook signature verification could fail in edge cases.

**Current**: Basic signature verification.

**Recommendation**: Add multiple webhook secret support
```typescript
// Support multiple webhook secrets for different environments
const webhookSecrets = [
  process.env.STRIPE_WEBHOOK_SECRET,
  process.env.STRIPE_WEBHOOK_SECRET_BACKUP
].filter(Boolean);

let event: Stripe.Event;
let lastError: Error;

for (const secret of webhookSecrets) {
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
    break;
  } catch (error) {
    lastError = error as Error;
    continue;
  }
}

if (!event) {
  console.error("All webhook signature verifications failed:", lastError);
  return new NextResponse("Invalid signature", { status: 400 });
}
```

### **10. Database Connection Failures**

**Issue**: Database connection could fail during webhook processing.

**Current**: Basic error handling but no connection retry logic.

**Recommendation**: Add connection retry logic
```typescript
const safeDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection error
      if (error.message?.includes("connection") || error.code === "ECONNRESET") {
        console.error(`${operationName} connection error attempt ${attempt}:`, error);
        
        if (attempt < maxRetries) {
          // Wait longer for connection issues
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(3, attempt) * 1000)
          );
          continue;
        }
      }
      
      // For other errors, use normal retry logic
      console.error(`${operationName} attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError!;
};
```

## 🚀 **Implementation Priority**

### **High Priority**
1. Webhook idempotency tracking
2. Database race condition prevention
3. Stripe account deletion handling

### **Medium Priority**
4. Partial payment handling
5. Currency change validation
6. Duplicate order prevention

### **Low Priority**
7. Network timeout configuration
8. Subscription proration improvements
9. Multiple webhook secret support
10. Database connection retry logic

## 📊 **Monitoring Recommendations**

### **Add These Metrics**
- Webhook processing time
- Database operation success rate
- Payment failure patterns
- Subscription upgrade success rate
- Stripe API response times

### **Alert Thresholds**
- Webhook processing time > 10 seconds
- Database error rate > 5%
- Payment failure rate > 10%
- Stripe API error rate > 2%

## 🔧 **Testing Recommendations**

### **Test These Scenarios**
1. Webhook replay attacks
2. Network interruptions during payment
3. Database connection failures
4. Stripe API rate limiting
5. Currency change during active subscription
6. Account deletion scenarios
7. Partial payment processing
8. Duplicate order creation
9. Subscription upgrade edge cases
10. Webhook signature verification failures

---

**Status**: Ready for implementation  
**Last Updated**: July 30, 2025  
**Priority**: High - Critical edge cases identified 
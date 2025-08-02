# Payment Constraints Setup

## Overview

This document describes the database constraints and indexes added to prevent duplicate payment records and improve query performance.

## Migration Files

### Main Migration: `20250802120000_add_payment_constraints.sql`

This migration adds the following constraints and indexes:

#### 1. Unique Constraint
```sql
ALTER TABLE payments 
ADD CONSTRAINT payments_order_id_unique 
UNIQUE (order_id);
```
- **Purpose**: Prevents duplicate payment records per order
- **Effect**: Database will reject any attempt to create a second payment record for the same order_id

#### 2. Performance Indexes
```sql
-- Index for order_id queries (most common)
CREATE INDEX IF NOT EXISTS idx_payments_order_id 
ON payments (order_id);

-- Index for Stripe payment ID queries
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id 
ON payments (stripe_payment_id);

-- Index for status and method queries
CREATE INDEX IF NOT EXISTS idx_payments_status_method 
ON payments (status, method);

-- Index for restaurant_id queries
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id 
ON payments (restaurant_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_payments_created_at 
ON payments (created_at);
```

### Rollback Migration: `20250802120001_rollback_payment_constraints.sql`

This migration removes all constraints and indexes added by the main migration.

## How to Apply

### Option 1: Using Supabase CLI
```bash
# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up 20250802120000_add_payment_constraints
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20250802120000_add_payment_constraints.sql`
4. Execute the SQL

### Option 3: Using psql
```bash
# Connect to your database
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Run the migration
\i supabase/migrations/20250802120000_add_payment_constraints.sql
```

## Benefits

### 1. Data Integrity
- **Prevents Duplicates**: The unique constraint ensures only one payment record per order
- **Database-Level Protection**: Even if application logic fails, the database will reject duplicates

### 2. Performance Improvements
- **Faster Queries**: Indexes on commonly queried columns improve query performance
- **Better Scalability**: As the payments table grows, queries remain fast

### 3. Query Optimization
- **order_id**: Most common query pattern for payment lookups
- **stripe_payment_id**: For Stripe webhook processing
- **status + method**: For filtering payments by type and status
- **restaurant_id**: For restaurant-specific payment queries
- **created_at**: For time-based reporting and analytics

## Impact on Existing Data

### Before Applying Migration
If you have existing duplicate payment records, the migration will fail. You need to clean up duplicates first:

```sql
-- Find duplicate payment records
SELECT order_id, COUNT(*) as count
FROM payments
GROUP BY order_id
HAVING COUNT(*) > 1;

-- Keep only the first payment record for each order
DELETE FROM payments 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM payments 
  GROUP BY order_id
);
```

### After Applying Migration
- New duplicate payment records will be rejected with a constraint violation error
- Application code should handle this error gracefully
- Existing single payment records per order will continue to work normally

## Error Handling

### Application-Level Error Handling
When the unique constraint is violated, your application will receive an error like:
```
duplicate key value violates unique constraint "payments_order_id_unique"
```

### Recommended Error Handling in Code
```typescript
try {
  const { error } = await supabase.from("payments").insert(paymentData);
  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      console.log("Payment record already exists for this order");
      // Handle gracefully - maybe update existing record instead
    } else {
      throw error;
    }
  }
} catch (error) {
  console.error("Error creating payment record:", error);
}
```

## Monitoring

### Check Constraint Status
```sql
-- Verify the constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payments' 
AND constraint_name = 'payments_order_id_unique';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'payments';
```

### Monitor for Constraint Violations
```sql
-- Check for any constraint violations in logs
-- This would depend on your logging setup
```

## Rollback

If you need to remove these constraints:

```bash
# Using Supabase CLI
supabase migration up 20250802120001_rollback_payment_constraints

# Or manually run the rollback SQL
```

## Best Practices

1. **Always test migrations** in a development environment first
2. **Backup your database** before applying production migrations
3. **Monitor application logs** for constraint violation errors
4. **Update application code** to handle constraint violations gracefully
5. **Consider the impact** on existing queries and performance

## Related Code Changes

The application code has been updated to:
- Use array queries instead of `.single()` to avoid race conditions
- Add proper error handling for constraint violations
- Include debug logging for payment record operations
- Detect and warn about multiple payment records

These database constraints work together with the application-level fixes to ensure data integrity and prevent duplicate payment records. 
# Performance Optimization Implementation

## Overview

This document outlines the performance optimizations implemented to address the remaining Supabase database linter warnings: `auth_rls_initplan`, `multiple_permissive_policies`, and `duplicate_index`.

## Issues Addressed

### 1. auth_rls_initplan Warnings

**Problem**: RLS policies using `auth.uid()`, `auth.role()`, and `auth.email()` functions were being re-evaluated for each row, causing performance degradation.

**Solution**: Wrapped all auth function calls in `(SELECT ...)` to ensure they are evaluated once per query instead of per row.

**Example Fix**:
```sql
-- Before (performance issue)
CREATE POLICY "Users can view their own restaurants" ON "public"."restaurants" 
FOR SELECT USING (owner_id = auth.uid());

-- After (optimized)
CREATE POLICY "Users can view their own restaurants" ON "public"."restaurants" 
FOR SELECT USING ((SELECT owner_id = auth.uid()));
```

**Affected Policies**:
- All policies using `auth.uid()` for user identification
- All policies using `auth.role()` for service role checks
- All policies using `auth.email()` for email-based access control

### 2. multiple_permissive_policies Warnings

**Problem**: Multiple permissive policies existed for the same role and action on tables, leading to performance issues as all policies must be evaluated.

**Solution**: Consolidated redundant policies by removing overly permissive ones and keeping the most specific ones.

**Policies Removed**:
- `"Allow public order tracking"` on orders table (too permissive)
- `"Users can manage their own newsletter subscriptions"` (redundant with specific policies)

### 3. duplicate_index Warnings

**Problem**: Identical indexes existed on the same columns, wasting storage and potentially confusing the query planner.

**Solution**: Removed duplicate indexes while keeping the most descriptive ones.

**Indexes Removed**:
- `idx_subscriptions_stripe_id` (duplicate of `idx_subscriptions_stripe_subscription_id`)
- `orders_order_number_idx` (duplicate of `idx_orders_order_number`)

## Performance Benefits

### Query Performance
- **RLS Policy Evaluation**: Auth function calls now evaluated once per query instead of per row
- **Index Efficiency**: Removed redundant indexes that could confuse the query planner
- **Policy Consolidation**: Reduced number of policies that need to be evaluated

### Storage Optimization
- **Index Storage**: Removed duplicate indexes to save storage space
- **Maintenance**: Fewer indexes to maintain and update

### Security Improvements
- **Policy Clarity**: More specific policies reduce the attack surface
- **Access Control**: Removed overly permissive policies that could grant unintended access

## Migration Details

The optimizations were implemented in migration `20250101000006_fix_performance_warnings.sql` which:

1. **Fixed 25 RLS policies** by wrapping auth function calls
2. **Removed 2 redundant policies** that were too permissive
3. **Removed 2 duplicate indexes** to optimize storage and query planning
4. **Added documentation** for all changes

## Verification

To verify the optimizations are working:

1. **Check RLS Policy Performance**:
   ```sql
   -- Query should be faster now
   SELECT * FROM restaurants WHERE owner_id = auth.uid();
   ```

2. **Verify Index Removal**:
   ```sql
   -- Should not show duplicate indexes
   SELECT indexname, tablename FROM pg_indexes 
   WHERE tablename IN ('orders', 'subscriptions') 
   ORDER BY tablename, indexname;
   ```

3. **Monitor Query Performance**:
   - Use Supabase dashboard to monitor query performance
   - Check for reduced execution times on RLS-protected queries

## Maintenance

### Regular Monitoring
- Monitor query performance on tables with RLS policies
- Check for any new duplicate indexes during schema changes
- Review RLS policies when adding new tables or modifying access patterns

### Best Practices
- Always wrap auth function calls in `(SELECT ...)` for new RLS policies
- Avoid creating overly permissive policies
- Use descriptive index names to avoid confusion
- Regularly review and consolidate redundant policies

## Related Documentation

- [Security Fixes Implementation](./security-fixes-implementation.md)
- [Database Schema Overview](./stripe-schema-overview.md)
- [RLS Policy Guidelines](./tables-management-system.md)

## Next Steps

The only remaining manual step is to enable **Leaked Password Protection** in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Enable "Leaked password protection"
4. This will prevent users from using passwords found in data breaches

This completes all the database linter warning fixes for optimal performance and security. 
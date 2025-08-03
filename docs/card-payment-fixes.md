# Card Payment System Fixes

## Issues Fixed

### 1. Duplicate Transactions
**Problem**: When using card payments from the QR client, two transactions were being created:
- One with "Stripe payment ID not available" message
- One properly synced with Stripe

**Root Cause**: The `createOrder` function was creating a payment record immediately for card payments, and then the Stripe webhook was creating another payment record when the payment was completed.

**Solution**: 
- Modified `createOrder` function to skip payment record creation for card payments
- Card payment records are now only created by the Stripe webhook when payment is actually completed
- The `create_payment_with_fallback` function already has duplicate prevention logic

### 2. Incorrect Order Status Flow
**Problem**: Card orders were being marked as "completed" immediately after payment instead of going to "preparing" orders.

### 3. Order Status for All Orders
**Problem**: All orders (cash and card) were starting from "pending" status, but they should start from "preparing" status since they're ready for the kitchen to prepare.

**Root Cause**: The Stripe webhook was setting order status to "completed" when payment was successful, but orders should follow this flow:
1. `preparing` → Order created, ready for preparation
2. `ready` → Order is ready for service
3. `served` → Order has been served to customer
4. `completed` → Order is fully completed (only after served)

**Solution**:
- Modified Stripe webhook to set card orders to "preparing" status when payment is completed
- Updated database function and code to set all orders to "preparing" status when created
- Orders now properly appear in the preparing orders list
- Orders are only marked as "completed" when they are served (handled by existing logic)

## Code Changes

### 1. `lib/actions/qr-payments.ts`
- Modified `createOrder` function to skip payment record creation for card payments
- Updated manual order creation to use "preparing" status instead of "pending"
- Added logging to track when payment records are skipped

### 2. `app/api/webhooks/stripe/route.ts`
- Changed order status update from "completed" to "preparing" for card payments
- Enhanced logging for payment record creation

### 3. Database Migrations
- `20250803000000_cleanup_duplicate_payments.sql`: Cleans up existing duplicate payment records
- `20250803000001_fix_card_order_status.sql`: Fixes card orders incorrectly marked as completed
- `20250803000002_update_order_status_to_preparing.sql`: Updates database function to use "preparing" status

## Testing

To verify the fixes:

1. **Test Card Payment Flow**:
   - Create a card payment through QR client
   - Verify only one transaction appears in payments page
   - Verify the transaction has proper Stripe payment ID
   - Verify the order appears in preparing orders (not completed)

2. **Test Order Status Flow**:
   - All orders should go: preparing → ready → served → completed

3. **Test Duplicate Prevention**:
   - Attempt to create multiple payments for the same order
   - Verify only one payment record is created

## Migration Notes

The cleanup migrations will:
1. Remove any existing duplicate payment records (keeping the one with Stripe payment ID)
2. Fix any card orders that were incorrectly marked as "completed"

Run the migrations with:
```bash
npx supabase db push
```

## Monitoring

Enhanced logging has been added to:
- Track payment record creation in webhooks
- Log when payment records are skipped for card payments
- Monitor order status changes

Check the logs for any issues with the payment flow. 
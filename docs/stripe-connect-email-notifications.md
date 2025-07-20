# Stripe Connect Email Notifications

## Overview

DineEasy now sends email notifications to restaurants when they successfully complete their Stripe Connect integration. This provides immediate feedback and guidance to restaurants about their payment setup status.

## Email Trigger

### **When the Email is Sent**

The Stripe Connect success email is automatically sent when:

1. **Webhook Event**: `account.updated` is received from Stripe
2. **Account Status**: The Stripe Connect account has:
   - ✅ `charges_enabled: true` (can accept payments)
   - ✅ `details_submitted: true` (business information completed)

### **Webhook Integration**

The email is sent in the Stripe webhook handler (`app/api/webhooks/stripe/route.ts`) in the `account.updated` case:

```typescript
case "account.updated": {
  const account = event.data.object as Stripe.Account;

  // Update restaurant with new account status
  await updateStripeConnectStatus(restaurantId, accountId, chargesEnabled, requirements);

  // Send success email when fully set up
  if (account.charges_enabled && account.details_submitted) {
    await sendStripeConnectSuccessEmail(restaurant.email, {
      restaurantName: restaurant.name,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: restaurant.country,
      businessType: account.business_type,
      setupDate: new Date().toLocaleDateString(),
    });
  }
}
```

## Email Content

### **Subject Line**

```
🎉 Your Stripe Connect Account is Ready!
```

### **Email Sections**

1. **🎉 Congratulations Header**
   - Confirms successful setup
   - Clear success message

2. **Account Details Table**
   - Restaurant name
   - Stripe account ID
   - Country
   - Business type
   - Setup date

3. **Account Status Indicators**
   - ✅ Accepting Payments (Enabled/Disabled)
   - ✅ Payouts (Enabled/Pending)

4. **What's Next?**
   - QR code payments
   - Automatic settlement
   - Transaction monitoring
   - Menu setup

5. **Important Notes**
   - Payout timing (2-7 business days)
   - Stripe fees
   - Business information updates

6. **Call to Action**
   - Dashboard link
   - Support contact

## Email Function

### **Function Signature**

```typescript
export const sendStripeConnectSuccessEmail = async (
  email: string,
  connectData: {
    restaurantName: string;
    accountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    country: string;
    businessType: string;
    setupDate: string;
  }
)
```

### **Error Handling**

- ✅ Email failures don't break webhook processing
- ✅ Comprehensive error logging
- ✅ Graceful degradation
- ✅ No impact on account setup

## Email Recipients

### **Primary Recipient**

- **Email**: Restaurant's business email (from `restaurants.email`)
- **Source**: Retrieved from database during webhook processing
- **Consistency**: Same email used for all business communications

### **Fallback Handling**

- If restaurant email is missing, email is skipped
- Error is logged but webhook continues processing
- No impact on account setup completion

## Email Design

### **Visual Elements**

- 🎉 Emoji for celebration
- ✅ Status indicators with colors
- 📊 Clean table layout
- 🎨 Professional color scheme
- 📱 Mobile-responsive design

### **Branding**

- DineEasy logo and colors
- Consistent with other email templates
- Professional business appearance

## Integration Points

### **Database Integration**

- Retrieves restaurant details from `restaurants` table
- Uses restaurant name, email, and country
- No additional database writes

### **Stripe Integration**

- Uses account data from Stripe webhook
- Extracts business type and status
- Real-time account status

### **Email Service**

- Uses Resend email service
- Consistent with other DineEasy emails
- Reliable delivery

## Testing

### **Test Scenarios**

1. **New Account Setup**: Email sent when account becomes active
2. **Existing Account**: Email sent when account is verified
3. **Missing Email**: Graceful handling when restaurant email is null
4. **Email Failure**: Webhook continues processing

### **Manual Testing**

```typescript
// Test the email function directly
await sendStripeConnectSuccessEmail("test@example.com", {
  restaurantName: "Test Restaurant",
  accountId: "acct_test123",
  chargesEnabled: true,
  payoutsEnabled: true,
  country: "CH",
  businessType: "Individual",
  setupDate: "2024-01-15",
});
```

## Monitoring

### **Logging**

- Success: "Stripe Connect success email sent to: {email}"
- Error: "Error sending Stripe Connect success email: {error}"
- Fallback: "Stripe Connect success email sent to (fallback): {email}"

### **Metrics**

- Email delivery success rate
- Webhook processing time
- Account setup completion rate

## Future Enhancements

### **Potential Improvements**

1. **Welcome Series**: Multiple emails for onboarding
2. **Status Updates**: Emails for account status changes
3. **Troubleshooting**: Emails for account issues
4. **Analytics**: Track email engagement
5. **Localization**: Multi-language support

### **Additional Triggers**

- Account verification requirements
- Payout enablement
- Account suspension
- Requirements updates

## Troubleshooting

### **Common Issues**

1. **Email Not Sent**: Check webhook logs for errors
2. **Missing Data**: Verify restaurant email exists
3. **Delivery Issues**: Check Resend API status
4. **Account Status**: Verify charges_enabled and details_submitted

### **Debug Steps**

1. Check webhook logs for email errors
2. Verify restaurant email in database
3. Test email function manually
4. Check Stripe account status
5. Verify webhook endpoint is receiving events

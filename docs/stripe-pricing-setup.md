# Stripe Pricing Setup Guide

## Overview

This document outlines the comprehensive Stripe pricing configuration for DineEasy, including plan structures, pricing strategy, and setup instructions.

## Pricing Strategy

### Standard Pricing Format

All prices follow the standard `.99` pricing format to create psychological pricing advantages:

- **Starter**: 34.99 CHF/month, 334.99 CHF/year
- **Pro**: 94.99 CHF/month, 911.99 CHF/year
- **Elite**: 239.99 CHF/month, 2294.99 CHF/year

### Annual Discount

All plans offer a 20% discount for annual billing to encourage longer commitments and improve cash flow.

## Plan Structure

### 🥗 Starter Plan - 34.99 CHF/month

**Target**: Independent owners, food stalls & small cafés

**Features**:

- Digital Menu Builder
- Up to 25 menu items
- QR-Based Table Ordering (Up to 6 Tables)
- Stripe & Cash Payment Processing
- Real-Time Order Dashboard
- Single User Access
- Basic Receipt Printing (ESC/POS)
- Weekly Sales Reports (Email)
- 14-Day Free Trial
- Email Support

**Limitations**:

- No Staff Role Permissions
- No Analytics Dashboard
- No Custom Receipt Branding
- Limited to 6 Tables/QR Codes
- No Customer Feedback Analytics

### 🍽️ Pro Plan - 94.99 CHF/month

**Target**: Growing restaurants with staff management needs

**Features**:

- Everything in Starter
- Up to 100 menu items
- Up to 12 Tables with QR Codes
- Up to 3 Staff Accounts with Role-Based Permissions
- Advanced Role-Based Access Control (RBAC)
- Custom Branded PDF Receipts
- Daily Sales Reports (Email & Download)
- Customer Feedback Analytics
- Basic Order Analytics Dashboard
- Early Access to New Features
- Priority Email Support
- 14-Day Free Trial

**Limitations**:

- Limited to 12 Tables/QR Codes
- No Advanced Analytics
- No API Access
- No Multi-location Support
- No Custom Integrations

### 🏢 Elite Plan - 239.99 CHF/month

**Target**: High-volume restaurants with unlimited features

**Features**:

- Everything in Pro
- Unlimited menu items
- Unlimited Tables with QR Codes
- Unlimited Staff Accounts
- Advanced Analytics Dashboard
- Comprehensive Customer Feedback Analytics
- Custom Branding & White-labeling
- API Access for Custom Integrations
- Priority Phone & Email Support
- Dedicated Account Manager
- Custom Integration Development
- Advanced Reporting & Audit Logs
- Multi-location Support
- 14-Day Free Trial

**Limitations**: None

## Currency Support

### Primary Currency (CHF)

- **Default**: Swiss Franc (CHF)
- **Pricing**: All prices optimized for Swiss market
- **Tax**: VAT-compliant pricing

### Commented Out Currencies

The following currencies are commented out but ready for future expansion:

- USD, EUR, GBP, INR, AUD, AED, SEK, CAD, NZD, LKR, SGD, MYR, THB, JPY, HKD, KRW

## Stripe Configuration

### Price Creation

Use the `scripts/setup-stripe.ts` script to create Stripe prices:

```bash
npm run setup-stripe
```

### Environment Variables

The script generates the following environment variables:

```
STRIPE_STARTER_MONTHLY_CHF_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_CHF_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_CHF_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_CHF_PRICE_ID=price_xxx
STRIPE_ELITE_MONTHLY_CHF_PRICE_ID=price_xxx
STRIPE_ELITE_YEARLY_CHF_PRICE_ID=price_xxx
```

### Product Metadata

Each Stripe price includes metadata for:

- `plan`: starter, pro, or elite
- `interval`: monthly or yearly
- `currency`: CHF (or other supported currencies)

## Implementation Details

### Pricing Constants

Located in `lib/constants/pricing.ts`:

- Plan definitions with features and limits
- Price configurations for all currencies
- Stripe price ID mappings
- Helper functions for price formatting

### Billing Integration

- **Subscription Creation**: `lib/actions/subscription.ts`
- **Plan Changes**: `lib/actions/billing.ts`
- **Webhook Handling**: `app/api/webhooks/stripe/route.ts`

### Frontend Display

- **Pricing Page**: `app/(website)/pricing/page.tsx`
- **Plan Selection**: `app/(onboarding)/select-plan/page.tsx`
- **Billing Management**: `app/(dashboard)/dashboard/billing/page.tsx`

## Testing

### Price Validation

1. Run the Stripe setup script
2. Verify all price IDs are generated
3. Test subscription creation with each plan
4. Verify webhook processing
5. Test plan upgrades/downgrades

### Currency Testing

1. Test with CHF (primary currency)
2. Verify price formatting displays correctly
3. Test annual vs monthly billing
4. Verify discount calculations

## Best Practices

### Pricing Psychology

- Use `.99` endings for psychological pricing
- Clear value proposition for each tier
- Obvious upgrade path between plans
- Annual discount to encourage longer commitments

### Feature Differentiation

- Clear feature limits for each plan
- Logical progression from Starter → Pro → Elite
- Compelling upgrade reasons at each level
- No feature overlap confusion

### Customer Experience

- 14-day free trial on all plans
- Clear pricing display with currency symbols
- Transparent feature comparisons
- Easy plan switching

## Future Considerations

### Currency Expansion

To add new currencies:

1. Uncomment currency in pricing constants
2. Add currency to Stripe setup script
3. Create new Stripe prices
4. Update environment variables
5. Test pricing display

### Plan Evolution

- Monitor usage patterns
- Gather customer feedback
- Adjust feature limits based on usage
- Consider new plan tiers if needed

### Pricing Optimization

- A/B test pricing changes
- Monitor conversion rates
- Analyze churn by plan
- Optimize for customer lifetime value

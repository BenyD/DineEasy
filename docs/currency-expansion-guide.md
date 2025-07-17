# Currency Expansion Guide

## Overview

This guide explains how to add back the commented currencies to DineEasy's pricing system. Currently, only CHF (Swiss Franc) is active, with 16 other currencies commented out and ready for expansion.

## Current Currency Status

### Active Currency

- **CHF (Swiss Franc)**: Primary currency, fully configured

### Commented Currencies (Ready for Activation)

1. **USD** - US Dollar
2. **EUR** - Euro
3. **GBP** - British Pound
4. **INR** - Indian Rupee
5. **AUD** - Australian Dollar
6. **AED** - UAE Dirham
7. **SEK** - Swedish Krona
8. **CAD** - Canadian Dollar
9. **NZD** - New Zealand Dollar
10. **LKR** - Sri Lankan Rupee
11. **SGD** - Singapore Dollar
12. **MYR** - Malaysian Ringgit
13. **THB** - Thai Baht
14. **JPY** - Japanese Yen
15. **HKD** - Hong Kong Dollar
16. **KRW** - South Korean Won

## Step-by-Step Currency Activation Process

### Step 1: Update Currency Constants

**File**: `lib/constants/currencies.ts`

Uncomment the desired currencies:

```typescript
export const CURRENCIES = {
  CHF: "CHF",
  USD: "USD", // Uncomment this line
  EUR: "EUR", // Uncomment this line
  // ... uncomment other currencies as needed
} as const;

export const CURRENCY_SYMBOLS = {
  CHF: "CHF ",
  USD: "$", // Uncomment this line
  EUR: "€", // Uncomment this line
  // ... uncomment other symbols as needed
} as const;

export const CURRENCY_NAMES = {
  CHF: "Swiss Franc",
  USD: "US Dollar", // Uncomment this line
  EUR: "Euro", // Uncomment this line
  // ... uncomment other names as needed
} as const;
```

### Step 2: Update Country Configuration

**File**: `lib/constants/countries.ts`

Uncomment the corresponding countries:

```typescript
export const COUNTRIES = {
  CH: { name: "Switzerland", currency: "CHF" },
  US: { name: "United States", currency: "USD" }, // Uncomment this line
  DE: { name: "Germany", currency: "EUR" }, // Uncomment this line
  // ... uncomment other countries as needed
} as const;
```

### Step 3: Update Pricing Configuration

**File**: `lib/constants/pricing.ts`

Uncomment the pricing for each plan:

```typescript
export const PRICING = {
  starter: {
    name: "Starter",
    price: {
      CHF: { monthly: 34.99, yearly: 334.99 },
      USD: { monthly: 39.99, yearly: 374.99 }, // Uncomment this line
      EUR: { monthly: 36.99, yearly: 345.99 }, // Uncomment this line
      // ... uncomment other currencies as needed
    },
    stripe_price_id: {
      CHF: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_CHF_PRICE_ID!,
      },
      USD: {
        // Uncomment this block
        monthly: process.env.STRIPE_STARTER_MONTHLY_USD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_USD_PRICE_ID!,
      },
      // ... uncomment other currency blocks as needed
    },
    // ... rest of plan configuration
  },
  // Repeat for pro and elite plans
};
```

### Step 4: Update Stripe Setup Script

**File**: `scripts/setup-stripe.ts`

Uncomment the pricing configuration:

```typescript
const PRICING = {
  starter: {
    CHF: { monthly: 34.99, yearly: 334.99 },
    USD: { monthly: 39.99, yearly: 374.99 }, // Uncomment this line
    EUR: { monthly: 36.99, yearly: 345.99 }, // Uncomment this line
    // ... uncomment other currencies as needed
  },
  // Repeat for pro and elite plans
};
```

### Step 5: Update Database Schema (if needed)

**File**: Create new migration in `supabase/migrations/`

```sql
-- Add new currencies to the enum if they don't exist
DO $$
BEGIN
    -- Add USD if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typarray::regtype::text LIKE '%USD%') THEN
        ALTER TYPE currency ADD VALUE 'USD';
    END IF;

    -- Add EUR if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency' AND typarray::regtype::text LIKE '%EUR%') THEN
        ALTER TYPE currency ADD VALUE 'EUR';
    END IF;

    -- Repeat for other currencies
END $$;
```

### Step 6: Create Stripe Prices

Run the updated setup script:

```bash
npm run setup-stripe
```

This will generate new environment variables for the uncommented currencies.

### Step 7: Update Environment Variables

Add the new Stripe price IDs to your `.env.local`:

```bash
# USD Prices
STRIPE_STARTER_MONTHLY_USD_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_USD_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_USD_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_USD_PRICE_ID=price_xxx
STRIPE_ELITE_MONTHLY_USD_PRICE_ID=price_xxx
STRIPE_ELITE_YEARLY_USD_PRICE_ID=price_xxx

# EUR Prices
STRIPE_STARTER_MONTHLY_EUR_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_EUR_PRICE_ID=price_xxx
# ... continue for all currencies
```

### Step 8: Update TypeScript Types

**File**: `types/index.ts`

Ensure currency types are updated:

```typescript
export type Currency = keyof typeof CURRENCIES;
```

## Currency-Specific Considerations

### Exchange Rate Strategy

**Option 1: Fixed Exchange Rates**

- Use predetermined rates for consistent pricing
- Update rates quarterly or annually
- Good for predictable revenue

**Option 2: Dynamic Exchange Rates**

- Use real-time rates from currency APIs
- More complex but market-responsive
- Consider rate fluctuation risks

### Pricing Strategy by Region

#### North America (USD, CAD)

- **USD**: $39.99/month, $374.99/year
- **CAD**: $53.99/month, $509.99/year
- **Strategy**: Competitive with US SaaS pricing

#### Europe (EUR, GBP, SEK)

- **EUR**: €36.99/month, €345.99/year
- **GBP**: £31.99/month, £297.99/year
- **SEK**: 408 SEK/month, 3917 SEK/year
- **Strategy**: VAT-compliant pricing

#### Asia Pacific (AUD, NZD, SGD, JPY, HKD, KRW)

- **AUD**: A$59.99/month, A$566.99/year
- **SGD**: S$53.99/month, S$509.99/year
- **JPY**: ¥5,900/month, ¥56,640/year
- **Strategy**: Local market pricing

#### Middle East (AED)

- **AED**: 143 AED/month, 1373 AED/year
- **Strategy**: Premium pricing for business market

#### South Asia (INR, LKR)

- **INR**: ₹3,250/month, ₹31,200/year
- **LKR**: 12,400 LKR/month, 119,040 LKR/year
- **Strategy**: Affordable pricing for emerging markets

## Testing Checklist

### Currency Display Testing

- [ ] Currency selector shows new currencies
- [ ] Prices display with correct symbols
- [ ] Formatting is appropriate for each currency
- [ ] Currency names are displayed correctly

### Stripe Integration Testing

- [ ] Price IDs are correctly mapped
- [ ] Checkout sessions work with new currencies
- [ ] Webhooks process payments correctly
- [ ] Subscription creation works

### Database Testing

- [ ] Currency enum includes new values
- [ ] Restaurant currency selection works
- [ ] Subscription currency tracking works
- [ ] Payment processing with new currencies

### User Experience Testing

- [ ] Currency switching works smoothly
- [ ] Pricing page displays correctly
- [ ] Plan selection with new currencies
- [ ] Billing management with new currencies

## Deployment Strategy

### Phase 1: Single Currency Addition

1. Add one currency (e.g., USD)
2. Test thoroughly
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

### Phase 2: Regional Rollout

1. Add currencies by region
2. Test regional pricing
3. Monitor conversion rates
4. Optimize pricing if needed

### Phase 3: Full Rollout

1. Activate all currencies
2. Monitor global performance
3. A/B test pricing strategies
4. Optimize based on data

## Monitoring and Analytics

### Key Metrics to Track

- **Conversion rates** by currency
- **Average order value** by region
- **Churn rates** by currency
- **Payment success rates** by region
- **Customer support requests** by currency

### Tools for Monitoring

- **Stripe Dashboard**: Payment analytics by currency
- **Google Analytics**: User behavior by region
- **Custom Analytics**: Currency-specific metrics
- **Customer Feedback**: Regional satisfaction scores

## Risk Management

### Currency Fluctuation Risk

- **Hedging**: Consider currency hedging for large volumes
- **Pricing Updates**: Regular price reviews based on exchange rates
- **Customer Communication**: Transparent pricing policies

### Compliance Risk

- **Tax Regulations**: Ensure VAT/GST compliance
- **Local Laws**: Verify payment processing regulations
- **Data Protection**: GDPR compliance for EU customers

### Technical Risk

- **Rate Limiting**: Monitor API usage for exchange rates
- **Fallback Mechanisms**: Handle currency API failures
- **Testing**: Comprehensive testing before deployment

## Cost Considerations

### Stripe Fees

- **Processing Fees**: Vary by currency and region
- **Conversion Fees**: For cross-border transactions
- **Monthly Costs**: Additional Stripe fees for new currencies

### Development Costs

- **Testing Time**: Comprehensive testing for each currency
- **Support Overhead**: Customer support for multiple currencies
- **Maintenance**: Ongoing currency management

## Future Considerations

### Currency Optimization

- **Performance Analysis**: Which currencies perform best
- **Pricing Optimization**: Adjust prices based on market data
- **Feature Localization**: Currency-specific features

### Expansion Opportunities

- **New Markets**: Identify high-potential regions
- **Partnerships**: Local payment providers
- **Localization**: Language and cultural adaptation

## Troubleshooting

### Common Issues

**Issue**: Currency not showing in selector
**Solution**: Check currency constants and TypeScript types

**Issue**: Stripe price creation fails
**Solution**: Verify currency codes and Stripe account settings

**Issue**: Pricing displays incorrectly
**Solution**: Check formatting functions and currency symbols

**Issue**: Database errors with new currencies
**Solution**: Verify enum values and migration execution

### Support Resources

- **Stripe Documentation**: Currency support guides
- **TypeScript Handbook**: Type system documentation
- **Supabase Docs**: Database migration guides
- **Community Forums**: Developer community support

## Conclusion

Adding currencies to DineEasy is a systematic process that requires careful planning, thorough testing, and ongoing monitoring. By following this guide, you can successfully expand the platform's global reach while maintaining quality and compliance standards.

Remember to:

1. **Start small** with one or two currencies
2. **Test thoroughly** before full deployment
3. **Monitor performance** and optimize based on data
4. **Maintain compliance** with local regulations
5. **Provide excellent support** for all regions

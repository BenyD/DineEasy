# Multi-Currency Pricing Update

## Overview

This document outlines the comprehensive update to DineEasy's pricing system to support multiple currencies and countries with new CHF-based pricing.

## New Pricing Structure

### Base Prices (CHF)

- **Starter**: 34.9 CHF/month, 334 CHF/year (20% discount)
- **Pro**: 94.9 CHF/month, 911 CHF/year (20% discount)
- **Elite**: 239 CHF/month, 2294 CHF/year (20% discount)

### Currency Conversions

All prices have been converted to the following currencies using approximate exchange rates:

| Currency           | Code | Starter Monthly | Starter Yearly | Pro Monthly | Pro Yearly  | Elite Monthly | Elite Yearly |
| ------------------ | ---- | --------------- | -------------- | ----------- | ----------- | ------------- | ------------ |
| US Dollar          | USD  | $39             | $374           | $105        | $1008       | $265          | $2544        |
| Swiss Franc        | CHF  | 34.9 CHF        | 334 CHF        | 94.9 CHF    | 911 CHF     | 239 CHF       | 2294 CHF     |
| Euro               | EUR  | €36             | €345           | €97         | €931        | €245          | €2352        |
| British Pound      | GBP  | £31             | £297           | £83         | £797        | £210          | £2016        |
| Indian Rupee       | INR  | ₹3,250          | ₹31,200        | ₹8,750      | ₹84,000     | ₹22,000       | ₹211,200     |
| Australian Dollar  | AUD  | A$59            | A$566          | A$159       | A$1526      | A$399         | A$3830       |
| UAE Dirham         | AED  | 143 AED         | 1373 AED       | 385 AED     | 3696 AED    | 973 AED       | 9341 AED     |
| Swedish Krona      | SEK  | 408 SEK         | 3917 SEK       | 1100 SEK    | 10560 SEK   | 2770 SEK      | 26592 SEK    |
| Canadian Dollar    | CAD  | C$53            | C$509          | C$143       | C$1373      | C$360         | C$3456       |
| New Zealand Dollar | NZD  | NZ$64           | NZ$614         | NZ$172      | NZ$1651     | NZ$433        | NZ$4157      |
| Sri Lankan Rupee   | LKR  | 12,400 LKR      | 119,040 LKR    | 33,400 LKR  | 320,640 LKR | 84,000 LKR    | 806,400 LKR  |
| Singapore Dollar   | SGD  | S$53            | S$509          | S$143       | S$1373      | S$360         | S$3456       |
| Malaysian Ringgit  | MYR  | RM184           | RM1766         | RM495       | RM4752      | RM1245        | RM11952      |
| Thai Baht          | THB  | ฿1,400          | ฿13,440        | ฿3,760      | ฿36,096     | ฿9,470        | ฿90,912      |
| Japanese Yen       | JPY  | ¥5,900          | ¥56,640        | ¥15,800     | ¥151,680    | ¥39,800       | ¥382,080     |
| Hong Kong Dollar   | HKD  | HK$305          | HK$2,928       | HK$820      | HK$7,872    | HK$2,065      | HK$19,824    |
| South Korean Won   | KRW  | ₩52,000         | ₩499,200       | ₩140,000    | ₩1,344,000  | ₩352,000      | ₩3,379,200   |

## Supported Countries

### Full Payment Processing (Stripe Connect)

- 🇺🇸 United States (USD)
- 🇨🇭 Switzerland (CHF)
- 🇩🇪 Germany (EUR)
- 🇦🇹 Austria (EUR)
- 🇳🇱 Netherlands (EUR)
- 🇪🇸 Spain (EUR)
- 🇵🇹 Portugal (EUR)
- 🇦🇪 United Arab Emirates (AED)
- 🇫🇷 France (EUR)
- 🇸🇪 Sweden (SEK)
- 🇦🇺 Australia (AUD)
- 🇨🇦 Canada (CAD)
- 🇳🇿 New Zealand (NZD)
- 🇮🇹 Italy (EUR)
- 🇬🇧 United Kingdom (GBP)
- 🇸🇬 Singapore (SGD)
- 🇲🇾 Malaysia (MYR)
- 🇹🇭 Thailand (THB)
- 🇯🇵 Japan (JPY)
- 🇭🇰 Hong Kong (HKD)
- 🇰🇷 South Korea (KRW)

### Limited Payment Processing (Cash Only)

- 🇱🇰 Sri Lanka (LKR)
- 🇮🇳 India (INR)

## Files Updated

### 1. Currency Configuration

- **File**: `lib/constants/currencies.ts`
- **Changes**: Added 11 new currencies with symbols and names

### 2. Country Configuration

- **File**: `lib/constants/countries.ts`
- **Changes**: Added 20 new countries with currency mappings and Stripe Connect availability

### 3. Pricing Configuration

- **File**: `lib/constants/pricing.ts`
- **Changes**: Updated all prices with new CHF-based pricing and added all new currencies

### 4. Setup Page

- **File**: `app/(onboarding)/setup/page.tsx`
- **Changes**: Updated to use constants from lib instead of hardcoded options

### 5. Environment Variables

- **File**: `env.example`
- **Changes**: Added all new Stripe price ID environment variables

### 6. Stripe Setup Script

- **File**: `scripts/setup-stripe.ts`
- **Changes**: Created comprehensive script to generate all price IDs

## Setup Instructions

### 1. Run the Stripe Setup Script

```bash
npm run setup-stripe
# or
npx tsx scripts/setup-stripe.ts
```

### 2. Update Environment Variables

Copy the generated price IDs from the script output to your `.env.local` file.

### 3. Test the Implementation

1. Test the pricing page with different currencies
2. Test the setup page with different countries
3. Test subscription creation with new prices
4. Verify Stripe Connect availability for each country

## Key Features

### Auto-Sync Country & Currency

- When selecting a country, currency automatically updates
- When selecting a currency, country automatically updates
- Visual feedback shows when auto-updates occur

### Stripe Connect Availability

- Countries with full payment processing show green checkmark
- Countries with limited payment processing show amber warning
- Clear messaging about payment options

### Comprehensive Validation

- All currencies and countries are properly validated
- Price formatting works for all currencies
- Proper error handling for unsupported combinations

## Testing Checklist

- [ ] Pricing page displays all currencies correctly
- [ ] Setup page shows all countries with proper flags
- [ ] Currency selection works in pricing page
- [ ] Country selection works in setup page
- [ ] Auto-sync between country and currency works
- [ ] Stripe Connect availability is correctly displayed
- [ ] Price formatting works for all currencies
- [ ] Subscription creation works with new prices
- [ ] All environment variables are properly set

## Notes

- Exchange rates are approximate and should be updated regularly
- Some currencies may need Stripe account configuration
- LKR and INR are marked as limited payment processing
- All prices include 20% discount for yearly billing
- CHF is now the base currency for pricing calculations

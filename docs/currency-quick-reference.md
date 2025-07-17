# Currency Quick Reference Card

## Current Status: CHF Only (16 Currencies Commented)

### ✅ Active Currency

| Currency    | Code | Symbol | Monthly | Yearly | Status    |
| ----------- | ---- | ------ | ------- | ------ | --------- |
| Swiss Franc | CHF  | CHF    | 34.99   | 334.99 | ✅ Active |

### 🔒 Commented Currencies (Ready for Activation)

#### North America

| Currency        | Code | Symbol | Starter          | Pro                | Elite              | Status       |
| --------------- | ---- | ------ | ---------------- | ------------------ | ------------------ | ------------ |
| US Dollar       | USD  | $      | $39.99/$374.99   | $105.99/$1008.99   | $265.99/$2544.99   | 🔒 Commented |
| Canadian Dollar | CAD  | C$     | C$53.99/C$509.99 | C$143.99/C$1373.99 | C$360.99/C$3456.99 | 🔒 Commented |

#### Europe

| Currency      | Code | Symbol | Starter        | Pro            | Elite            | Status       |
| ------------- | ---- | ------ | -------------- | -------------- | ---------------- | ------------ |
| Euro          | EUR  | €      | €36.99/€345.99 | €97.99/€931.99 | €245.99/€2352.99 | 🔒 Commented |
| British Pound | GBP  | £      | £31.99/£297.99 | £83.99/£797.99 | £210.99/£2016.99 | 🔒 Commented |
| Swedish Krona | SEK  | SEK    | 408/3917       | 1100/10560     | 2770/26592       | 🔒 Commented |

#### Asia Pacific

| Currency           | Code | Symbol | Starter            | Pro                  | Elite                | Status       |
| ------------------ | ---- | ------ | ------------------ | -------------------- | -------------------- | ------------ |
| Australian Dollar  | AUD  | A$     | A$59.99/A$566.99   | A$159.99/A$1526.99   | A$399.99/A$3830.99   | 🔒 Commented |
| New Zealand Dollar | NZD  | NZ$    | NZ$64.99/NZ$614.99 | NZ$172.99/NZ$1651.99 | NZ$433.99/NZ$4157.99 | 🔒 Commented |
| Singapore Dollar   | SGD  | S$     | S$53.99/S$509.99   | S$143.99/S$1373.99   | S$360.99/S$3456.99   | 🔒 Commented |
| Japanese Yen       | JPY  | ¥      | ¥5,900/¥56,640     | ¥15,800/¥151,680     | ¥39,800/¥382,080     | 🔒 Commented |
| Hong Kong Dollar   | HKD  | HK$    | HK$305/HK$2,928    | HK$820/HK$7,872      | HK$2,065/HK$19,824   | 🔒 Commented |
| South Korean Won   | KRW  | ₩      | ₩52,000/₩499,200   | ₩140,000/₩1,344,000  | ₩352,000/₩3,379,200  | 🔒 Commented |

#### Middle East

| Currency   | Code | Symbol | Starter  | Pro      | Elite    | Status       |
| ---------- | ---- | ------ | -------- | -------- | -------- | ------------ |
| UAE Dirham | AED  | AED    | 143/1373 | 385/3696 | 973/9341 | 🔒 Commented |

#### South Asia

| Currency         | Code | Symbol | Starter        | Pro            | Elite            | Status       |
| ---------------- | ---- | ------ | -------------- | -------------- | ---------------- | ------------ |
| Indian Rupee     | INR  | ₹      | ₹3,250/₹31,200 | ₹8,750/₹84,000 | ₹22,000/₹211,200 | 🔒 Commented |
| Sri Lankan Rupee | LKR  | LKR    | 12,400/119,040 | 33,400/320,640 | 84,000/806,400   | 🔒 Commented |

#### Southeast Asia

| Currency          | Code | Symbol | Starter    | Pro        | Elite      | Status       |
| ----------------- | ---- | ------ | ---------- | ---------- | ---------- | ------------ |
| Malaysian Ringgit | MYR  | RM     | 184/1766   | 495/4752   | 1245/11952 | 🔒 Commented |
| Thai Baht         | THB  | ฿      | 1400/13440 | 3760/36096 | 9480/91008 | 🔒 Commented |

## Activation Priority Recommendations

### 🥇 High Priority (Major Markets)

1. **USD** - US Dollar (Largest SaaS market)
2. **EUR** - Euro (European Union)
3. **GBP** - British Pound (UK market)
4. **AUD** - Australian Dollar (Australia/NZ)

### 🥈 Medium Priority (Growing Markets)

5. **CAD** - Canadian Dollar (Canada)
6. **SGD** - Singapore Dollar (Singapore)
7. **JPY** - Japanese Yen (Japan)
8. **HKD** - Hong Kong Dollar (Hong Kong)

### 🥉 Lower Priority (Emerging Markets)

9. **INR** - Indian Rupee (India)
10. **AED** - UAE Dirham (UAE)
11. **SEK** - Swedish Krona (Sweden)
12. **NZD** - New Zealand Dollar (New Zealand)
13. **KRW** - South Korean Won (South Korea)
14. **MYR** - Malaysian Ringgit (Malaysia)
15. **THB** - Thai Baht (Thailand)
16. **LKR** - Sri Lankan Rupee (Sri Lanka)

## Quick Activation Commands

### Single Currency (e.g., USD)

```bash
# 1. Run the example script to see the process
node scripts/add-currency-example.js

# 2. Follow the step-by-step guide
# See: docs/currency-expansion-guide.md

# 3. Create Stripe prices
npm run setup-stripe

# 4. Apply database migration
npx supabase db push
```

### Multiple Currencies

```bash
# 1. Uncomment desired currencies in:
# - lib/constants/currencies.ts
# - lib/constants/countries.ts
# - lib/constants/pricing.ts
# - scripts/setup-stripe.ts

# 2. Create migration for all currencies
# See: docs/currency-expansion-guide.md

# 3. Run setup and deploy
npm run setup-stripe
npx supabase db push
```

## Pricing Strategy by Region

### North America (USD, CAD)

- **Strategy**: Competitive with US SaaS pricing
- **Pricing**: Premium pricing for established markets
- **Features**: Full feature set, priority support

### Europe (EUR, GBP, SEK)

- **Strategy**: VAT-compliant pricing
- **Pricing**: Market-appropriate pricing
- **Features**: GDPR compliance, local support

### Asia Pacific (AUD, NZD, SGD, JPY, HKD, KRW)

- **Strategy**: Local market pricing
- **Pricing**: Competitive regional pricing
- **Features**: Local payment methods, regional support

### Middle East (AED)

- **Strategy**: Premium pricing for business market
- **Pricing**: Higher pricing for enterprise features
- **Features**: Business-focused features

### South Asia (INR, LKR)

- **Strategy**: Affordable pricing for emerging markets
- **Pricing**: Lower pricing to match local purchasing power
- **Features**: Basic features, self-service support

## Environment Variables Template

When activating currencies, you'll need these environment variables:

```bash
# Template for each currency (replace XXX with currency code)
STRIPE_STARTER_MONTHLY_XXX_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_XXX_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_XXX_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_XXX_PRICE_ID=price_xxx
STRIPE_ELITE_MONTHLY_XXX_PRICE_ID=price_xxx
STRIPE_ELITE_YEARLY_XXX_PRICE_ID=price_xxx
```

## Testing Checklist

For each activated currency, verify:

- [ ] Currency appears in selector
- [ ] Prices display correctly with symbols
- [ ] Stripe checkout works
- [ ] Webhooks process payments
- [ ] Database stores currency correctly
- [ ] User experience is smooth
- [ ] Support documentation updated

## Notes

- **Annual Discount**: All currencies offer 20% discount for yearly billing
- **Exchange Rates**: Prices are based on approximate exchange rates
- **Stripe Support**: Verify currency support in your Stripe account
- **Compliance**: Ensure local tax and payment regulations compliance
- **Testing**: Always test thoroughly before production deployment

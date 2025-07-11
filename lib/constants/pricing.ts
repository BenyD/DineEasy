import { CURRENCIES, type Currency } from "./currencies";

// Pricing configuration for each currency
export const PRICING = {
  starter: {
    name: "Starter",
    price: {
      USD: { monthly: 29, yearly: 279 },
      CHF: { monthly: 35, yearly: 335 },
      EUR: { monthly: 27, yearly: 259 },
      GBP: { monthly: 23, yearly: 219 },
      INR: { monthly: 2400, yearly: 23000 },
      AUD: { monthly: 44, yearly: 419 },
    },
    stripe_price_id: {
      USD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_USD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_USD_PRICE_ID!,
      },
      CHF: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_CHF_PRICE_ID!,
      },
      EUR: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_EUR_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_EUR_PRICE_ID!,
      },
      GBP: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_GBP_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_GBP_PRICE_ID!,
      },
      INR: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_INR_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_INR_PRICE_ID!,
      },
      AUD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_AUD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_AUD_PRICE_ID!,
      },
    },
    features: [
      "Up to 100 orders per month",
      "Basic menu management",
      "QR code table ordering",
      "Email support",
      "Basic analytics",
      "1 staff account",
    ],
  },
  pro: {
    name: "Pro",
    price: {
      USD: { monthly: 79, yearly: 759 },
      CHF: { monthly: 95, yearly: 915 },
      EUR: { monthly: 73, yearly: 699 },
      GBP: { monthly: 62, yearly: 599 },
      INR: { monthly: 6500, yearly: 62500 },
      AUD: { monthly: 119, yearly: 1149 },
    },
    stripe_price_id: {
      USD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_USD_PRICE_ID!,
      },
      CHF: {
        monthly: process.env.STRIPE_PRO_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_CHF_PRICE_ID!,
      },
      EUR: {
        monthly: process.env.STRIPE_PRO_MONTHLY_EUR_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_EUR_PRICE_ID!,
      },
      GBP: {
        monthly: process.env.STRIPE_PRO_MONTHLY_GBP_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_GBP_PRICE_ID!,
      },
      INR: {
        monthly: process.env.STRIPE_PRO_MONTHLY_INR_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_INR_PRICE_ID!,
      },
      AUD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_AUD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_AUD_PRICE_ID!,
      },
    },
    features: [
      "Up to 500 orders per month",
      "Advanced menu management",
      "Custom QR code branding",
      "Priority email & chat support",
      "Advanced analytics & reports",
      "5 staff accounts",
      "Kitchen display system",
      "Table management",
    ],
  },
  elite: {
    name: "Elite",
    price: {
      USD: { monthly: 199, yearly: 1919 },
      CHF: { monthly: 239, yearly: 2309 },
      EUR: { monthly: 183, yearly: 1759 },
      GBP: { monthly: 155, yearly: 1499 },
      INR: { monthly: 16500, yearly: 158500 },
      AUD: { monthly: 299, yearly: 2879 },
    },
    stripe_price_id: {
      USD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_USD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_USD_PRICE_ID!,
      },
      CHF: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_CHF_PRICE_ID!,
      },
      EUR: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_EUR_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_EUR_PRICE_ID!,
      },
      GBP: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_GBP_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_GBP_PRICE_ID!,
      },
      INR: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_INR_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_INR_PRICE_ID!,
      },
      AUD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_AUD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_AUD_PRICE_ID!,
      },
    },
    features: [
      "Unlimited orders",
      "Full menu customization",
      "White-label QR codes",
      "24/7 priority support",
      "Custom analytics",
      "Unlimited staff accounts",
      "Advanced inventory management",
      "API access",
      "Custom integrations",
    ],
  },
} as const;

// Helper function to get price for a specific plan, currency, and interval
export function getPrice(
  plan: keyof typeof PRICING,
  currency: Currency,
  interval: "monthly" | "yearly"
): number {
  return PRICING[plan].price[currency][interval];
}

// Helper function to get Stripe price ID for a specific plan, currency, and interval
export function getStripePriceId(
  plan: keyof typeof PRICING,
  currency: Currency,
  interval: "monthly" | "yearly"
): string {
  return PRICING[plan].stripe_price_id[currency][interval];
}

// Helper function to format price with currency symbol
export function formatPrice(
  price: number,
  currency: Currency,
  showSymbol: boolean = true
): string {
  const symbol = showSymbol ? CURRENCIES[currency] : "";

  // Special formatting for INR (no decimals)
  if (currency === "INR") {
    return `${symbol}${price.toLocaleString("en-IN")}`;
  }

  // For other currencies, show 2 decimal places
  return `${symbol}${price.toFixed(2)}`;
}

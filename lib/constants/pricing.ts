import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from "./currencies";

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
      "Manual Digital Menu",
      "Up to 25 menu items",
      "QR-Based Table Ordering (Up to 6 Tables)",
      "Stripe & Cash Payments",
      "Real-Time Order Dashboard",
      "1 User Login",
      "ESC/POS Basic Receipt Printing",
      "Weekly Sales Summary (via Email)",
    ],
    limits: {
      staff: 1,
      analytics: false,
      roles: false,
      tables: 6,
    },
    negativeFeatures: [
      "No Staff Role Permissions (RBAC)",
      "No Analytics or Feedback Dashboard",
      "No Custom Receipts",
      "Limited to 6 Tables/QR Codes",
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
      "Everything in Starter",
      "Up to 100 menu items",
      "Up to 12 Tables with QR Codes",
      "Up to 3 Staff Accounts (Waiter, Staff, Supervisor)",
      "Role-Based Permissions (RBAC)",
      "PDF Receipts with Restaurant Branding",
      "Daily Sales Reports (Email & Download)",
      "View Customer Feedback",
      "Basic Order Analytics",
      "Early Access to Features",
      "Priority Email Support",
    ],
    limits: {
      staff: 3,
      analytics: "basic",
      roles: true,
      tables: 12,
    },
    negativeFeatures: [
      "No Staff Role Permissions (RBAC)",
      "No Analytics or Feedback Dashboard",
      "No Custom Receipts",
      "Limited to 6 Tables/QR Codes",
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
      "Everything in Pro",
      "Unlimited Tables & QR Codes",
      "Unlimited menu items",
      "Unlimited Staff Accounts",
      "Full Audit Logs (Order actions, logins, changes)",
      "Enhanced Analytics",
      "Early Access: Experimental AI Features",
      "Dedicated Onboarding Session",
      "Priority Feature Requests Queue",
      "Assisted Printer Setup & Configuration",
      "24/7 Priority Support (Email + Phone)",
    ],
    limits: {
      staff: "unlimited",
      analytics: "advanced",
      roles: true,
      tables: "unlimited",
    },
    negativeFeatures: [
      "No Staff Role Permissions (RBAC)",
      "No Analytics or Feedback Dashboard",
      "No Custom Receipts",
      "Limited to 6 Tables/QR Codes",
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
  const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : "";

  // Special formatting for INR (no decimals)
  if (currency === "INR") {
    return `${symbol}${price.toLocaleString("en-IN")}`;
  }

  // For other currencies, show 2 decimal places
  return `${symbol}${price.toFixed(2)}`;
}

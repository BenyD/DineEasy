import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from "./currencies";

// Pricing configuration for each currency
export const PRICING = {
  starter: {
    name: "Starter",
    price: {
      USD: { monthly: 39, yearly: 374 },
      CHF: { monthly: 34.9, yearly: 334 },
      EUR: { monthly: 36, yearly: 345 },
      GBP: { monthly: 31, yearly: 297 },
      INR: { monthly: 3250, yearly: 31200 },
      AUD: { monthly: 59, yearly: 566 },
      AED: { monthly: 143, yearly: 1373 },
      SEK: { monthly: 408, yearly: 3917 },
      CAD: { monthly: 53, yearly: 509 },
      NZD: { monthly: 64, yearly: 614 },
      LKR: { monthly: 12400, yearly: 119040 },
      SGD: { monthly: 53, yearly: 509 },
      MYR: { monthly: 184, yearly: 1766 },
      THB: { monthly: 1400, yearly: 13440 },
      JPY: { monthly: 5900, yearly: 56640 },
      HKD: { monthly: 305, yearly: 2928 },
      KRW: { monthly: 52000, yearly: 499200 },
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
      AED: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_AED_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_AED_PRICE_ID!,
      },
      SEK: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_SEK_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_SEK_PRICE_ID!,
      },
      CAD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_CAD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_CAD_PRICE_ID!,
      },
      NZD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_NZD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_NZD_PRICE_ID!,
      },
      LKR: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_LKR_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_LKR_PRICE_ID!,
      },
      SGD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_SGD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_SGD_PRICE_ID!,
      },
      MYR: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_MYR_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_MYR_PRICE_ID!,
      },
      THB: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_THB_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_THB_PRICE_ID!,
      },
      JPY: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_JPY_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_JPY_PRICE_ID!,
      },
      HKD: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_HKD_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_HKD_PRICE_ID!,
      },
      KRW: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_KRW_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_KRW_PRICE_ID!,
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
      USD: { monthly: 105, yearly: 1008 },
      CHF: { monthly: 94.9, yearly: 911 },
      EUR: { monthly: 97, yearly: 931 },
      GBP: { monthly: 83, yearly: 797 },
      INR: { monthly: 8750, yearly: 84000 },
      AUD: { monthly: 159, yearly: 1526 },
      AED: { monthly: 385, yearly: 3696 },
      SEK: { monthly: 1100, yearly: 10560 },
      CAD: { monthly: 143, yearly: 1373 },
      NZD: { monthly: 172, yearly: 1651 },
      LKR: { monthly: 33400, yearly: 320640 },
      SGD: { monthly: 143, yearly: 1373 },
      MYR: { monthly: 495, yearly: 4752 },
      THB: { monthly: 3760, yearly: 36096 },
      JPY: { monthly: 15800, yearly: 151680 },
      HKD: { monthly: 820, yearly: 7872 },
      KRW: { monthly: 140000, yearly: 999999 },
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
      AED: {
        monthly: process.env.STRIPE_PRO_MONTHLY_AED_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_AED_PRICE_ID!,
      },
      SEK: {
        monthly: process.env.STRIPE_PRO_MONTHLY_SEK_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_SEK_PRICE_ID!,
      },
      CAD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_CAD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_CAD_PRICE_ID!,
      },
      NZD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_NZD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_NZD_PRICE_ID!,
      },
      LKR: {
        monthly: process.env.STRIPE_PRO_MONTHLY_LKR_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_LKR_PRICE_ID!,
      },
      SGD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_SGD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_SGD_PRICE_ID!,
      },
      MYR: {
        monthly: process.env.STRIPE_PRO_MONTHLY_MYR_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_MYR_PRICE_ID!,
      },
      THB: {
        monthly: process.env.STRIPE_PRO_MONTHLY_THB_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_THB_PRICE_ID!,
      },
      JPY: {
        monthly: process.env.STRIPE_PRO_MONTHLY_JPY_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_JPY_PRICE_ID!,
      },
      HKD: {
        monthly: process.env.STRIPE_PRO_MONTHLY_HKD_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_HKD_PRICE_ID!,
      },
      KRW: {
        monthly: process.env.STRIPE_PRO_MONTHLY_KRW_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_KRW_PRICE_ID!,
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
      USD: { monthly: 265, yearly: 2544 },
      CHF: { monthly: 239, yearly: 2294 },
      EUR: { monthly: 245, yearly: 2352 },
      GBP: { monthly: 210, yearly: 2016 },
      INR: { monthly: 22000, yearly: 211200 },
      AUD: { monthly: 399, yearly: 3830 },
      AED: { monthly: 973, yearly: 9341 },
      SEK: { monthly: 2770, yearly: 26592 },
      CAD: { monthly: 360, yearly: 3456 },
      NZD: { monthly: 433, yearly: 4157 },
      LKR: { monthly: 84000, yearly: 806400 },
      SGD: { monthly: 360, yearly: 3456 },
      MYR: { monthly: 1245, yearly: 11952 },
      THB: { monthly: 9470, yearly: 90912 },
      JPY: { monthly: 39800, yearly: 382080 },
      HKD: { monthly: 2065, yearly: 19824 },
      KRW: { monthly: 352000, yearly: 999999 },
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
      AED: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_AED_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_AED_PRICE_ID!,
      },
      SEK: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_SEK_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_SEK_PRICE_ID!,
      },
      CAD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_CAD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_CAD_PRICE_ID!,
      },
      NZD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_NZD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_NZD_PRICE_ID!,
      },
      LKR: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_LKR_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_LKR_PRICE_ID!,
      },
      SGD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_SGD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_SGD_PRICE_ID!,
      },
      MYR: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_MYR_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_MYR_PRICE_ID!,
      },
      THB: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_THB_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_THB_PRICE_ID!,
      },
      JPY: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_JPY_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_JPY_PRICE_ID!,
      },
      HKD: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_HKD_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_HKD_PRICE_ID!,
      },
      KRW: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_KRW_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_KRW_PRICE_ID!,
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

import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from "./currencies";

// Pricing configuration for each currency
export const PRICING = {
  starter: {
    name: "Starter",
    price: {
      CHF: { monthly: 34.99, yearly: 334.99 },
      // USD: { monthly: 39.99, yearly: 374.99 },
      // EUR: { monthly: 36.99, yearly: 345.99 },
      // GBP: { monthly: 31.99, yearly: 297.99 },
      // INR: { monthly: 3250, yearly: 31200 },
      // AUD: { monthly: 59.99, yearly: 566.99 },
      // AED: { monthly: 143, yearly: 1373 },
      // SEK: { monthly: 408, yearly: 3917 },
      // CAD: { monthly: 53.99, yearly: 509.99 },
      // NZD: { monthly: 64.99, yearly: 614.99 },
      // LKR: { monthly: 12400, yearly: 119040 },
      // SGD: { monthly: 53.99, yearly: 509.99 },
      // MYR: { monthly: 184, yearly: 1766 },
      // THB: { monthly: 1400, yearly: 13440 },
      // JPY: { monthly: 5900, yearly: 56640 },
      // HKD: { monthly: 305, yearly: 2928 },
      // KRW: { monthly: 52000, yearly: 499200 },
    },
    stripe_price_id: {
      CHF: {
        monthly: process.env.STRIPE_STARTER_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_STARTER_YEARLY_CHF_PRICE_ID!,
      },
      // USD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_USD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_USD_PRICE_ID!,
      // },
      // EUR: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_EUR_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_EUR_PRICE_ID!,
      // },
      // GBP: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_GBP_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_GBP_PRICE_ID!,
      // },
      // INR: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_INR_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_INR_PRICE_ID!,
      // },
      // AUD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_AUD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_AUD_PRICE_ID!,
      // },
      // AED: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_AED_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_AED_PRICE_ID!,
      // },
      // SEK: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_SEK_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_SEK_PRICE_ID!,
      // },
      // CAD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_CAD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_CAD_PRICE_ID!,
      // },
      // NZD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_NZD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_NZD_PRICE_ID!,
      // },
      // LKR: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_LKR_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_LKR_PRICE_ID!,
      // },
      // SGD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_SGD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_SGD_PRICE_ID!,
      // },
      // MYR: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_MYR_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_MYR_PRICE_ID!,
      // },
      // THB: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_THB_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_THB_PRICE_ID!,
      // },
      // JPY: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_JPY_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_JPY_PRICE_ID!,
      // },
      // HKD: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_HKD_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_HKD_PRICE_ID!,
      // },
      // KRW: {
      //   monthly: process.env.STRIPE_STARTER_MONTHLY_KRW_PRICE_ID!,
      //   yearly: process.env.STRIPE_STARTER_YEARLY_KRW_PRICE_ID!,
      // },
    },
    features: [
      "Digital Menu Builder",
      "Up to 25 menu items",
      "QR-Based Table Ordering (Up to 6 Tables)",
      "Stripe & Cash Payment Processing",
      "Real-Time Order Dashboard",
      "Single User Access",
      "Basic Receipt Printing (ESC/POS)",
      "Weekly Sales Reports (Email)",
      "14-Day Free Trial",
      "Email Support",
    ],
    limits: {
      staff: 1,
      menuItems: 25,
      analytics: false,
      roles: false,
      tables: 6,
    },
    negativeFeatures: [
      "No Staff Role Permissions",
      "No Analytics Dashboard",
      "No Custom Receipt Branding",
      "Limited to 6 Tables/QR Codes",
      "No Customer Feedback Analytics",
    ],
  },
  pro: {
    name: "Pro",
    price: {
      CHF: { monthly: 94.99, yearly: 911.99 },
      // USD: { monthly: 105.99, yearly: 1008.99 },
      // EUR: { monthly: 97.99, yearly: 931.99 },
      // GBP: { monthly: 83.99, yearly: 797.99 },
      // INR: { monthly: 8750, yearly: 84000 },
      // AUD: { monthly: 159.99, yearly: 1526.99 },
      // AED: { monthly: 385, yearly: 3696 },
      // SEK: { monthly: 1100, yearly: 10560 },
      // CAD: { monthly: 143.99, yearly: 1373.99 },
      // NZD: { monthly: 172.99, yearly: 1651.99 },
      // LKR: { monthly: 33400, yearly: 320640 },
      // SGD: { monthly: 143.99, yearly: 1373.99 },
      // MYR: { monthly: 495, yearly: 4752 },
      // THB: { monthly: 3760, yearly: 36096 },
      // JPY: { monthly: 15800, yearly: 151680 },
      // HKD: { monthly: 820, yearly: 7872 },
      // KRW: { monthly: 140000, yearly: 999999 },
    },
    stripe_price_id: {
      CHF: {
        monthly: process.env.STRIPE_PRO_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_PRO_YEARLY_CHF_PRICE_ID!,
      },
      // USD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_USD_PRICE_ID!,
      // },
      // EUR: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_EUR_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_EUR_PRICE_ID!,
      // },
      // GBP: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_GBP_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_GBP_PRICE_ID!,
      // },
      // INR: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_INR_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_INR_PRICE_ID!,
      // },
      // AUD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_AUD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_AUD_PRICE_ID!,
      // },
      // AED: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_AED_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_AED_PRICE_ID!,
      // },
      // SEK: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_SEK_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_SEK_PRICE_ID!,
      // },
      // CAD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_CAD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_CAD_PRICE_ID!,
      // },
      // NZD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_NZD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_NZD_PRICE_ID!,
      // },
      // LKR: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_LKR_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_LKR_PRICE_ID!,
      // },
      // SGD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_SGD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_SGD_PRICE_ID!,
      // },
      // MYR: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_MYR_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_MYR_PRICE_ID!,
      // },
      // THB: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_THB_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_THB_PRICE_ID!,
      // },
      // JPY: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_JPY_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_JPY_PRICE_ID!,
      // },
      // HKD: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_HKD_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_HKD_PRICE_ID!,
      // },
      // KRW: {
      //   monthly: process.env.STRIPE_PRO_MONTHLY_KRW_PRICE_ID!,
      //   yearly: process.env.STRIPE_PRO_YEARLY_KRW_PRICE_ID!,
      // },
    },
    features: [
      "Everything in Starter",
      "Up to 100 menu items",
      "Up to 12 Tables with QR Codes",
      "Up to 3 Staff Accounts with Role-Based Permissions",
      "Advanced Role-Based Access Control (RBAC)",
      "Custom Branded PDF Receipts",
      "Daily Sales Reports (Email & Download)",
      "Customer Feedback Analytics",
      "Basic Order Analytics Dashboard",
      "Early Access to New Features",
      "Priority Email Support",
      "14-Day Free Trial",
    ],
    limits: {
      staff: 3,
      menuItems: 100,
      analytics: "basic",
      roles: true,
      tables: 12,
    },
    negativeFeatures: [
      "Limited to 12 Tables/QR Codes",
      "No Advanced Analytics",
      "No API Access",
      "No Multi-location Support",
      "No Custom Integrations",
    ],
  },
  elite: {
    name: "Elite",
    price: {
      CHF: { monthly: 239.99, yearly: 2294.99 },
      // USD: { monthly: 265.99, yearly: 2544.99 },
      // EUR: { monthly: 245.99, yearly: 2352.99 },
      // GBP: { monthly: 210.99, yearly: 2016.99 },
      // INR: { monthly: 22000, yearly: 211200 },
      // AUD: { monthly: 399.99, yearly: 3830.99 },
      // AED: { monthly: 973, yearly: 9341 },
      // SEK: { monthly: 2770, yearly: 26592 },
      // CAD: { monthly: 360.99, yearly: 3456.99 },
      // NZD: { monthly: 433.99, yearly: 4157.99 },
      // LKR: { monthly: 84000, yearly: 806400 },
      // SGD: { monthly: 360.99, yearly: 3456.99 },
      // MYR: { monthly: 1245, yearly: 11952 },
      // THB: { monthly: 9480, yearly: 91008 },
      // JPY: { monthly: 39800, yearly: 382080 },
      // HKD: { monthly: 2065, yearly: 19824 },
      // KRW: { monthly: 352000, yearly: 3379200 },
    },
    stripe_price_id: {
      CHF: {
        monthly: process.env.STRIPE_ELITE_MONTHLY_CHF_PRICE_ID!,
        yearly: process.env.STRIPE_ELITE_YEARLY_CHF_PRICE_ID!,
      },
      // USD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_USD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_USD_PRICE_ID!,
      // },
      // EUR: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_EUR_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_EUR_PRICE_ID!,
      // },
      // GBP: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_GBP_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_GBP_PRICE_ID!,
      // },
      // INR: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_INR_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_INR_PRICE_ID!,
      // },
      // AUD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_AUD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_AUD_PRICE_ID!,
      // },
      // AED: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_AED_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_AED_PRICE_ID!,
      // },
      // SEK: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_SEK_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_SEK_PRICE_ID!,
      // },
      // CAD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_CAD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_CAD_PRICE_ID!,
      // },
      // NZD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_NZD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_NZD_PRICE_ID!,
      // },
      // LKR: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_LKR_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_LKR_PRICE_ID!,
      // },
      // SGD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_SGD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_SGD_PRICE_ID!,
      // },
      // MYR: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_MYR_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_MYR_PRICE_ID!,
      // },
      // THB: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_THB_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_THB_PRICE_ID!,
      // },
      // JPY: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_JPY_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_JPY_PRICE_ID!,
      // },
      // HKD: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_HKD_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_HKD_PRICE_ID!,
      // },
      // KRW: {
      //   monthly: process.env.STRIPE_ELITE_MONTHLY_KRW_PRICE_ID!,
      //   yearly: process.env.STRIPE_ELITE_YEARLY_KRW_PRICE_ID!,
      // },
    },
    features: [
      "Everything in Pro",
      "Unlimited menu items",
      "Unlimited Tables with QR Codes",
      "Unlimited Staff Accounts",
      "Advanced Analytics Dashboard",
      "Comprehensive Customer Feedback Analytics",
      "Custom Branding & White-labeling",
      "API Access for Custom Integrations",
      "Priority Phone & Email Support",
      "Dedicated Account Manager",
      "Custom Integration Development",
      "Advanced Reporting & Audit Logs",
      "Multi-location Support",
      "14-Day Free Trial",
    ],
    limits: {
      staff: -1, // Unlimited
      menuItems: -1, // Unlimited
      analytics: "advanced",
      roles: true,
      tables: -1, // Unlimited
    },
    negativeFeatures: [],
  },
} as const;

// Helper function to get price for a specific plan, currency, and interval
export function getPrice(
  plan: keyof typeof PRICING,
  currency: Currency,
  interval: "monthly" | "yearly"
): number {
  if (currency !== "CHF") {
    console.warn(`Only CHF pricing is supported. Requested: ${currency}`);
    return 0;
  }
  const planPricing = PRICING[plan].price[currency];
  if (!planPricing) {
    console.warn(`No pricing found for plan ${plan} and currency ${currency}`);
    return 0;
  }
  return planPricing[interval];
}

// Helper function to get Stripe price ID for a specific plan, currency, and interval
export function getStripePriceId(
  plan: keyof typeof PRICING,
  currency: Currency,
  interval: "monthly" | "yearly"
): string {
  if (currency !== "CHF") {
    console.warn(`Only CHF pricing is supported. Requested: ${currency}`);
    return "";
  }
  const planPricing = PRICING[plan].stripe_price_id[currency];
  if (!planPricing) {
    console.warn(
      `No Stripe price ID found for plan ${plan} and currency ${currency}`
    );
    return "";
  }
  return planPricing[interval];
}

// Helper function to format price with currency symbol
export function formatPrice(
  price: number,
  currency: Currency,
  showSymbol: boolean = true
): string {
  const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : "";

  // Special formatting for INR (no decimals)
  // if (currency === "INR") {
  //   return `${symbol}${price.toLocaleString("en-IN")}`;
  // }

  // For other currencies, show 2 decimal places
  return `${symbol}${price.toFixed(2)}`;
}

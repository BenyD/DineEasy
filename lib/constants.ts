export const CURRENCIES = {
  USD: "USD",
  CHF: "CHF",
  EUR: "EUR",
} as const;

export const DEFAULT_CURRENCY = CURRENCIES.USD;

export const SUBSCRIPTION = {
  YEARLY_DISCOUNT_PERCENTAGE: 20,
  TRIAL_DAYS: 14,
  BILLING_PERIODS: {
    monthly: "monthly",
    yearly: "yearly",
  } as const,
} as const;

export const PLANS = {
  starter: {
    name: "Starter",
    price: {
      monthly: 29,
      yearly: 279,
    },
    stripe_price_id: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
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
      monthly: 79,
      yearly: 759,
    },
    stripe_price_id: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
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
      monthly: 199,
      yearly: 1919,
    },
    stripe_price_id: {
      monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_ELITE_YEARLY_PRICE_ID!,
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

export const ORDER_STATUSES = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const PAYMENT_METHODS = {
  card: "Credit Card",
  cash: "Cash",
  other: "Other",
} as const;

export const PLATFORM_COMMISSION = 0.02; // 2% commission on restaurant payments

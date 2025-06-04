export const PLANS = {
  starter: {
    name: "Starter",
    price: { monthly: 5.99, yearly: 59.99 },
    currency: "USD",
    features: [
      "Digital menu builder",
      "QR code generation for 5 tables",
      "Basic order management",
      "Stripe payment integration",
      "TWINT payment support",
      "Auto thermal printing",
      "Email support",
    ],
    limits: {
      tables: 5,
      analytics: false,
      staff: false,
    },
  },
  pro: {
    name: "Pro",
    price: { monthly: 11.99, yearly: 119.99 },
    currency: "USD",
    features: [
      "Everything in Starter",
      "Unlimited tables",
      "Real-time analytics dashboard",
      "Advanced reporting",
      "Priority email support",
      "AI OCR menu upload",
      "Custom receipt formatting",
    ],
    limits: {
      tables: "unlimited",
      analytics: true,
      staff: false,
    },
  },
  elite: {
    name: "Elite",
    price: { monthly: 24.99, yearly: 239.99 },
    currency: "USD",
    features: [
      "Everything in Pro",
      "Multi-user staff management",
      "Staff role permissions",
      "Advanced analytics & insights",
      "Custom branding",
      "API access",
      "24/7 phone support",
      "Dedicated account manager",
    ],
    limits: {
      tables: "unlimited",
      analytics: true,
      staff: true,
    },
  },
} as const

export const ORDER_STATUSES = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
} as const

export const PAYMENT_METHODS = {
  stripe: "Credit Card",
  twint: "TWINT",
  cash: "Cash",
} as const

export const PLATFORM_COMMISSION = 0.02 // 2% commission on restaurant payments
export const TRIAL_DAYS = 14

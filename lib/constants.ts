export const PLANS = {
  starter: {
    name: "Starter",
    price: { monthly: 15, yearly: 144 },
    currency: "CHF",
    stripe_price_id: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
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
    price: { monthly: 39, yearly: 374 },
    currency: "CHF",
    stripe_price_id: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
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
  },
  elite: {
    name: "Elite",
    price: { monthly: 79, yearly: 758 },
    currency: "CHF",
    stripe_price_id: {
      monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_ELITE_YEARLY_PRICE_ID!,
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
  },
} as const;

export const ORDER_STATUSES = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
} as const;

export const PAYMENT_METHODS = {
  stripe: "Credit Card",
  twint: "TWINT",
  cash: "Cash",
} as const;

export const PLATFORM_COMMISSION = 0.02; // 2% commission on restaurant payments
export const TRIAL_DAYS = 14;

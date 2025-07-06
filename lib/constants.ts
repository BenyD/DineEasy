export const PLANS = {
  starter: {
    name: "Starter",
    price: { monthly: 15, yearly: 150 },
    currency: "USD",
    features: [
      "Digital Menu (Manual Entry)",
      "QR-Based Table Ordering",
      "Stripe & Cash Payments",
      "Realtime Order Dashboard",
      "1 Staff Login (No Roles)",
      "Basic Receipt Printing (ESC/POS)",
      "Weekly Sales Summary via Email",
    ],
    limits: {
      staff: 1,
      analytics: false,
      roles: false,
    },
  },
  pro: {
    name: "Pro",
    price: { monthly: 39, yearly: 390 },
    currency: "USD",
    features: [
      "Everything in Starter",
      "Up to 3 Staff Roles",
      "Role-Based Permissions (RBAC)",
      "PDF Receipts + Custom Branding",
      "Daily Sales Reports",
      "Customer Feedback Management",
      "Basic Order Analytics",
      "Early Access: AI OCR Menu Upload",
      "Priority Email Support",
    ],
    limits: {
      staff: 3,
      analytics: "basic",
      roles: true,
    },
  },
  elite: {
    name: "Elite",
    price: { monthly: 79, yearly: 790 },
    currency: "USD",
    features: [
      "Everything in Pro",
      "Unlimited Staff Accounts",
      "Supervisor Tools",
      "Audit Logs",
      "Full Receipt Customization",
      "Enhanced Analytics",
      "Early Access: AI Features",
      "Priority Support (Slack + Email)",
      "Staff Performance Metrics (Coming Soon)",
    ],
    limits: {
      staff: "unlimited",
      analytics: "advanced",
      roles: true,
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

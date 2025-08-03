export const SUBSCRIPTION = {
  YEARLY_DISCOUNT_PERCENTAGE: 20,
  TRIAL_DAYS: 30,
  BILLING_PERIODS: {
    monthly: "monthly",
    yearly: "yearly",
  } as const,
} as const;

export const PLATFORM_COMMISSION = 0.02; // 2% commission on restaurant payments

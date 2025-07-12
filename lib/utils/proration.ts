import { PRICING } from "@/lib/constants/pricing";

export interface ProrationDetails {
  currentPlanPrice: number;
  newPlanPrice: number;
  prorationAmount: number;
  nextBillingDate: Date;
  currency: string;
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSamePrice: boolean;
  message: string;
}

export function calculateProration(
  currentPlan: string,
  newPlan: string,
  currentInterval: "monthly" | "yearly",
  newInterval: "monthly" | "yearly",
  currency: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): ProrationDetails {
  // Get current and new plan prices
  const currentPlanPricing =
    PRICING[currentPlan.toLowerCase() as keyof typeof PRICING];
  const newPlanPricing = PRICING[newPlan.toLowerCase() as keyof typeof PRICING];

  const currentPrice =
    currentPlanPricing?.price?.[
      currency as keyof typeof currentPlanPricing.price
    ]?.[currentInterval] || 0;
  const newPrice =
    newPlanPricing?.price?.[currency as keyof typeof newPlanPricing.price]?.[
      newInterval
    ] || 0;

  // Calculate time remaining in current period
  const now = new Date();
  const timeRemaining = currentPeriodEnd.getTime() - now.getTime();
  const totalPeriodTime =
    currentPeriodEnd.getTime() - currentPeriodStart.getTime();
  const remainingRatio = Math.max(0, timeRemaining / totalPeriodTime);

  // Calculate proration
  const unusedAmount = currentPrice * remainingRatio;
  const prorationAmount = newPrice - unusedAmount;

  // Determine if it's an upgrade, downgrade, or same price
  const isUpgrade = newPrice > currentPrice;
  const isDowngrade = newPrice < currentPrice;
  const isSamePrice = newPrice === currentPrice;

  // Generate user-friendly message
  let message = "";
  if (isUpgrade) {
    if (prorationAmount > 0) {
      message = `You'll be charged ${formatCurrency(prorationAmount, currency)} today for the upgrade, then ${formatCurrency(newPrice, currency)} on your next billing date.`;
    } else {
      message = `Your upgrade is free! You'll be charged ${formatCurrency(newPrice, currency)} on your next billing date.`;
    }
  } else if (isDowngrade) {
    if (prorationAmount < 0) {
      message = `You'll receive a credit of ${formatCurrency(Math.abs(prorationAmount), currency)} for the downgrade, then ${formatCurrency(newPrice, currency)} on your next billing date.`;
    } else {
      message = `Your downgrade is free! You'll be charged ${formatCurrency(newPrice, currency)} on your next billing date.`;
    }
  } else {
    message = `No charge today. You'll continue paying ${formatCurrency(newPrice, currency)} on your next billing date.`;
  }

  return {
    currentPlanPrice: currentPrice,
    newPlanPrice: newPrice,
    prorationAmount,
    nextBillingDate: currentPeriodEnd,
    currency,
    isUpgrade,
    isDowngrade,
    isSamePrice,
    message,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    CHF: "CHF ",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function getProrationColor(
  isUpgrade: boolean,
  isDowngrade: boolean
): string {
  if (isUpgrade) return "text-green-600";
  if (isDowngrade) return "text-blue-600";
  return "text-gray-600";
}

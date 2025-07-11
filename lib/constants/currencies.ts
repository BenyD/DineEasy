export const CURRENCIES = {
  USD: "USD",
  CHF: "CHF",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
  AUD: "AUD",
} as const;

export const DEFAULT_CURRENCY = CURRENCIES.USD;

// Currency display names
export const CURRENCY_NAMES = {
  USD: "US Dollar",
  CHF: "Swiss Franc",
  EUR: "Euro",
  GBP: "British Pound",
  INR: "Indian Rupee",
  AUD: "Australian Dollar",
} as const;

// Currency symbols
export const CURRENCY_SYMBOLS = {
  USD: "$",
  CHF: "CHF",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
} as const;

export type Currency = keyof typeof CURRENCIES;

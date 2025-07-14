export const CURRENCIES = {
  USD: "USD",
  CHF: "CHF",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
  AUD: "AUD",
  AED: "AED",
  SEK: "SEK",
  CAD: "CAD",
  NZD: "NZD",
  LKR: "LKR",
  SGD: "SGD",
  MYR: "MYR",
  THB: "THB",
  JPY: "JPY",
  HKD: "HKD",
  KRW: "KRW",
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
  AED: "UAE Dirham",
  SEK: "Swedish Krona",
  CAD: "Canadian Dollar",
  NZD: "New Zealand Dollar",
  LKR: "Sri Lankan Rupee",
  SGD: "Singapore Dollar",
  MYR: "Malaysian Ringgit",
  THB: "Thai Baht",
  JPY: "Japanese Yen",
  HKD: "Hong Kong Dollar",
  KRW: "South Korean Won",
} as const;

// Currency symbols
export const CURRENCY_SYMBOLS = {
  USD: "$",
  CHF: "CHF",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  AED: "AED",
  SEK: "SEK",
  CAD: "C$",
  NZD: "NZ$",
  LKR: "LKR",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  JPY: "¥",
  HKD: "HK$",
  KRW: "₩",
} as const;

export type Currency = keyof typeof CURRENCIES;

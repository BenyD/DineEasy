// Import currencies from separate file
export {
  CURRENCIES,
  DEFAULT_CURRENCY,
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
  type Currency,
} from "./constants/currencies";

// Import countries from separate file
export {
  COUNTRIES,
  COUNTRY_OPTIONS,
  type CountryCode,
  getCountryByCurrency,
  getCurrencyByCountry,
} from "./constants/countries";

// Import subscription constants
export { SUBSCRIPTION, PLATFORM_COMMISSION } from "./constants/subscription";

// Import the new pricing configuration
import {
  PRICING,
  getPrice,
  getStripePriceId,
  formatPrice,
} from "./constants/pricing";

export { PRICING, getPrice, getStripePriceId, formatPrice };

// Legacy PLANS export for backward compatibility
export { PRICING as PLANS };

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

// Domain configuration
export const DOMAIN_CONFIG = {
  PRODUCTION: "https://dineeasy.ch",
  DEVELOPMENT: "http://localhost:3000",
  CURRENT: process.env.NEXT_PUBLIC_APP_URL || "https://dineeasy.ch",
} as const;

// QR code configuration
export const QR_CONFIG = {
  BASE_URL: DOMAIN_CONFIG.CURRENT,
  PATH_PREFIX: "/qr",
} as const;

export const COUNTRIES = {
  US: {
    name: "United States",
    code: "US",
    currency: "USD",
    flag: "🇺🇸",
  },
  CH: {
    name: "Switzerland",
    code: "CH",
    currency: "CHF",
    flag: "🇨🇭",
  },
  EU: {
    name: "European Union",
    code: "EU",
    currency: "EUR",
    flag: "🇪🇺",
  },
  GB: {
    name: "United Kingdom",
    code: "GB",
    currency: "GBP",
    flag: "🇬🇧",
  },
  IN: {
    name: "India",
    code: "IN",
    currency: "INR",
    flag: "🇮🇳",
  },
  AU: {
    name: "Australia",
    code: "AU",
    currency: "AUD",
    flag: "🇦🇺",
  },
} as const;

export const COUNTRY_OPTIONS = [
  { value: "US", label: "🇺🇸 United States", currency: "USD" },
  { value: "CH", label: "🇨🇭 Switzerland", currency: "CHF" },
  { value: "EU", label: "🇪🇺 European Union", currency: "EUR" },
  { value: "GB", label: "🇬🇧 United Kingdom", currency: "GBP" },
  { value: "IN", label: "🇮🇳 India", currency: "INR" },
  { value: "AU", label: "🇦🇺 Australia", currency: "AUD" },
] as const;

export type CountryCode = keyof typeof COUNTRIES;

// Helper function to get country by currency
export const getCountryByCurrency = (currency: string) => {
  return Object.values(COUNTRIES).find(
    (country) => country.currency === currency
  );
};

// Helper function to get currency by country
export const getCurrencyByCountry = (countryCode: string) => {
  return COUNTRIES[countryCode as CountryCode]?.currency;
};

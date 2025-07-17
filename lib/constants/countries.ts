export const COUNTRIES = {
  CH: {
    name: "Switzerland",
    code: "CH",
    currency: "CHF",
    flag: "🇨🇭",
  },
  // US: {
  //   name: "United States",
  //   code: "US",
  //   currency: "USD",
  //   flag: "🇺🇸",
  // },
  // DE: {
  //   name: "Germany",
  //   code: "DE",
  //   currency: "EUR",
  //   flag: "🇩🇪",
  // },
  // AT: {
  //   name: "Austria",
  //   code: "AT",
  //   currency: "EUR",
  //   flag: "🇦🇹",
  // },
  // NL: {
  //   name: "Netherlands",
  //   code: "NL",
  //   currency: "EUR",
  //   flag: "🇳🇱",
  // },
  // ES: {
  //   name: "Spain",
  //   code: "ES",
  //   currency: "EUR",
  //   flag: "🇪🇸",
  // },
  // PT: {
  //   name: "Portugal",
  //   code: "PT",
  //   currency: "EUR",
  //   flag: "🇵🇹",
  // },
  // AE: {
  //   name: "United Arab Emirates",
  //   code: "AE",
  //   currency: "AED",
  //   flag: "🇦🇪",
  // },
  // FR: {
  //   name: "France",
  //   code: "FR",
  //   currency: "EUR",
  //   flag: "🇫🇷",
  // },
  // SE: {
  //   name: "Sweden",
  //   code: "SE",
  //   currency: "SEK",
  //   flag: "🇸🇪",
  // },
  // AU: {
  //   name: "Australia",
  //   code: "AU",
  //   currency: "AUD",
  //   flag: "🇦🇺",
  // },
  // CA: {
  //   name: "Canada",
  //   code: "CA",
  //   currency: "CAD",
  //   flag: "🇨🇦",
  // },
  // NZ: {
  //   name: "New Zealand",
  //   code: "NZ",
  //   currency: "NZD",
  //   flag: "🇳🇿",
  // },
  // IT: {
  //   name: "Italy",
  //   code: "IT",
  //   currency: "EUR",
  //   flag: "🇮🇹",
  // },
  // GB: {
  //   name: "United Kingdom",
  //   code: "GB",
  //   currency: "GBP",
  //   flag: "🇬🇧",
  // },
  // LK: {
  //   name: "Sri Lanka",
  //   code: "LK",
  //   currency: "LKR",
  //   flag: "🇱🇰",
  // },
  // SG: {
  //   name: "Singapore",
  //   code: "SG",
  //   currency: "SGD",
  //   flag: "🇸🇬",
  // },
  // MY: {
  //   name: "Malaysia",
  //   code: "MY",
  //   currency: "MYR",
  //   flag: "🇲🇾",
  // },
  // TH: {
  //   name: "Thailand",
  //   code: "TH",
  //   currency: "THB",
  //   flag: "🇹🇭",
  // },
  // JP: {
  //   name: "Japan",
  //   code: "JP",
  //   currency: "JPY",
  //   flag: "🇯🇵",
  // },
  // HK: {
  //   name: "Hong Kong",
  //   code: "HK",
  //   currency: "HKD",
  //   flag: "🇭🇰",
  // },
  // KR: {
  //   name: "South Korea",
  //   code: "KR",
  //   currency: "KRW",
  //   flag: "🇰🇷",
  // },
  // IN: {
  //   name: "India",
  //   code: "IN",
  //   currency: "INR",
  //   flag: "🇮🇳",
  // },
} as const;

export const COUNTRY_OPTIONS = [
  {
    value: "CH",
    label: "🇨🇭 Switzerland",
    currency: "CHF",
    stripeConnect: true, // Supported by Stripe Connect Express
  },
  // {
  //   value: "US",
  //   label: "🇺🇸 United States",
  //   currency: "USD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "DE",
  //   label: "🇩🇪 Germany",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "AT",
  //   label: "🇦🇹 Austria",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "NL",
  //   label: "🇳🇱 Netherlands",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "ES",
  //   label: "🇪🇸 Spain",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "PT",
  //   label: "🇵🇹 Portugal",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "AE",
  //   label: "🇦🇪 United Arab Emirates",
  //   currency: "AED",
  //   stripeConnect: false, // Not in Stripe's Express supported list
  // },
  // {
  //   value: "FR",
  //   label: "🇫🇷 France",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "SE",
  //   label: "🇸🇪 Sweden",
  //   currency: "SEK",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "AU",
  //   label: "🇦🇺 Australia",
  //   currency: "AUD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "CA",
  //   label: "🇨🇦 Canada",
  //   currency: "CAD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "NZ",
  //   label: "🇳🇿 New Zealand",
  //   currency: "NZD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "IT",
  //   label: "🇮🇹 Italy",
  //   currency: "EUR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "GB",
  //   label: "🇬🇧 United Kingdom",
  //   currency: "GBP",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "LK",
  //   label: "🇱🇰 Sri Lanka",
  //   currency: "LKR",
  //   stripeConnect: false, // Not in Stripe's Express supported list
  // },
  // {
  //   value: "SG",
  //   label: "🇸🇬 Singapore",
  //   currency: "SGD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "MY",
  //   label: "🇲🇾 Malaysia",
  //   currency: "MYR",
  //   stripeConnect: false, // Not in Stripe's Express supported list
  // },
  // {
  //   value: "TH",
  //   label: "🇹🇭 Thailand",
  //   currency: "THB",
  //   stripeConnect: false, // Not in Stripe's Express supported list
  // },
  // {
  //   value: "JP",
  //   label: "🇯🇵 Japan",
  //   currency: "JPY",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "HK",
  //   label: "🇭🇰 Hong Kong",
  //   currency: "HKD",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "KR",
  //   label: "🇰🇷 South Korea",
  //   currency: "KRW",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
  // {
  //   value: "IN",
  //   label: "🇮🇳 India",
  //   currency: "INR",
  //   stripeConnect: true, // Supported by Stripe Connect Express
  // },
];

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

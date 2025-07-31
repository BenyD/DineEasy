export interface CountryData {
  name: string;
  code: string;
  currency: string;
  flag: string;
  phoneCode: string;
  phoneFormat?: string;
  postalCodeFormat?: string;
}

export const COUNTRIES: Record<string, CountryData> = {
  // Switzerland (Primary focus)
  CH: {
    name: "Switzerland",
    code: "CH",
    currency: "CHF",
    flag: "🇨🇭",
    phoneCode: "+41",
    phoneFormat: "+41 XX XXX XX XX",
    postalCodeFormat: "XXXX",
  },

  // Major European Countries
  DE: {
    name: "Germany",
    code: "DE",
    currency: "EUR",
    flag: "🇩🇪",
    phoneCode: "+49",
    phoneFormat: "+49 XXX XXXXXXXX",
    postalCodeFormat: "XXXXX",
  },
  FR: {
    name: "France",
    code: "FR",
    currency: "EUR",
    flag: "🇫🇷",
    phoneCode: "+33",
    phoneFormat: "+33 X XX XX XX XX",
    postalCodeFormat: "XXXXX",
  },
  IT: {
    name: "Italy",
    code: "IT",
    currency: "EUR",
    flag: "🇮🇹",
    phoneCode: "+39",
    phoneFormat: "+39 XXX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  AT: {
    name: "Austria",
    code: "AT",
    currency: "EUR",
    flag: "🇦🇹",
    phoneCode: "+43",
    phoneFormat: "+43 XXX XXX XXXX",
    postalCodeFormat: "XXXX",
  },
  NL: {
    name: "Netherlands",
    code: "NL",
    currency: "EUR",
    flag: "🇳🇱",
    phoneCode: "+31",
    phoneFormat: "+31 X XXX XXXX",
    postalCodeFormat: "XXXX XX",
  },
  ES: {
    name: "Spain",
    code: "ES",
    currency: "EUR",
    flag: "🇪🇸",
    phoneCode: "+34",
    phoneFormat: "+34 XXX XXX XXX",
    postalCodeFormat: "XXXXX",
  },
  PT: {
    name: "Portugal",
    code: "PT",
    currency: "EUR",
    flag: "🇵🇹",
    phoneCode: "+351",
    phoneFormat: "+351 XXX XXX XXX",
    postalCodeFormat: "XXXX-XXX",
  },
  SE: {
    name: "Sweden",
    code: "SE",
    currency: "SEK",
    flag: "🇸🇪",
    phoneCode: "+46",
    phoneFormat: "+46 XX XXX XXXX",
    postalCodeFormat: "XXX XX",
  },
  NO: {
    name: "Norway",
    code: "NO",
    currency: "NOK",
    flag: "🇳🇴",
    phoneCode: "+47",
    phoneFormat: "+47 XXX XX XXX",
    postalCodeFormat: "XXXX",
  },
  DK: {
    name: "Denmark",
    code: "DK",
    currency: "DKK",
    flag: "🇩🇰",
    phoneCode: "+45",
    phoneFormat: "+45 XX XX XX XX",
    postalCodeFormat: "XXXX",
  },
  FI: {
    name: "Finland",
    code: "FI",
    currency: "EUR",
    flag: "🇫🇮",
    phoneCode: "+358",
    phoneFormat: "+358 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  BE: {
    name: "Belgium",
    code: "BE",
    currency: "EUR",
    flag: "🇧🇪",
    phoneCode: "+32",
    phoneFormat: "+32 X XXX XX XX",
    postalCodeFormat: "XXXX",
  },
  IE: {
    name: "Ireland",
    code: "IE",
    currency: "EUR",
    flag: "🇮🇪",
    phoneCode: "+353",
    phoneFormat: "+353 X XXX XXXX",
    postalCodeFormat: "A65 F4E2",
  },
  PL: {
    name: "Poland",
    code: "PL",
    currency: "PLN",
    flag: "🇵🇱",
    phoneCode: "+48",
    phoneFormat: "+48 XXX XXX XXX",
    postalCodeFormat: "XX-XXX",
  },
  CZ: {
    name: "Czech Republic",
    code: "CZ",
    currency: "CZK",
    flag: "🇨🇿",
    phoneCode: "+420",
    phoneFormat: "+420 XXX XXX XXX",
    postalCodeFormat: "XXX XX",
  },
  HU: {
    name: "Hungary",
    code: "HU",
    currency: "HUF",
    flag: "🇭🇺",
    phoneCode: "+36",
    phoneFormat: "+36 XX XXX XXXX",
    postalCodeFormat: "XXXX",
  },
  RO: {
    name: "Romania",
    code: "RO",
    currency: "RON",
    flag: "🇷🇴",
    phoneCode: "+40",
    phoneFormat: "+40 XXX XXX XXX",
    postalCodeFormat: "XXXXXX",
  },
  BG: {
    name: "Bulgaria",
    code: "BG",
    currency: "BGN",
    flag: "🇧🇬",
    phoneCode: "+359",
    phoneFormat: "+359 XX XXX XXX",
    postalCodeFormat: "XXXX",
  },
  HR: {
    name: "Croatia",
    code: "HR",
    currency: "EUR",
    flag: "🇭🇷",
    phoneCode: "+385",
    phoneFormat: "+385 XX XXX XXX",
    postalCodeFormat: "XXXXX",
  },
  SI: {
    name: "Slovenia",
    code: "SI",
    currency: "EUR",
    flag: "🇸🇮",
    phoneCode: "+386",
    phoneFormat: "+386 XX XXX XXX",
    postalCodeFormat: "XXXX",
  },
  SK: {
    name: "Slovakia",
    code: "SK",
    currency: "EUR",
    flag: "🇸🇰",
    phoneCode: "+421",
    phoneFormat: "+421 XXX XXX XXX",
    postalCodeFormat: "XXX XX",
  },
  LT: {
    name: "Lithuania",
    code: "LT",
    currency: "EUR",
    flag: "🇱🇹",
    phoneCode: "+370",
    phoneFormat: "+370 XXX XXXXX",
    postalCodeFormat: "XXXXX",
  },
  LV: {
    name: "Latvia",
    code: "LV",
    currency: "EUR",
    flag: "🇱🇻",
    phoneCode: "+371",
    phoneFormat: "+371 XXXXXXXX",
    postalCodeFormat: "XXXX",
  },
  EE: {
    name: "Estonia",
    code: "EE",
    currency: "EUR",
    flag: "🇪🇪",
    phoneCode: "+372",
    phoneFormat: "+372 XXXXXXXX",
    postalCodeFormat: "XXXXX",
  },
  GR: {
    name: "Greece",
    code: "GR",
    currency: "EUR",
    flag: "🇬🇷",
    phoneCode: "+30",
    phoneFormat: "+30 XXX XXX XXXX",
    postalCodeFormat: "XXX XX",
  },
  CY: {
    name: "Cyprus",
    code: "CY",
    currency: "EUR",
    flag: "🇨🇾",
    phoneCode: "+357",
    phoneFormat: "+357 XX XXX XXX",
    postalCodeFormat: "XXXX",
  },
  MT: {
    name: "Malta",
    code: "MT",
    currency: "EUR",
    flag: "🇲🇹",
    phoneCode: "+356",
    phoneFormat: "+356 XXXX XXXX",
    postalCodeFormat: "AAA 0000",
  },
  LU: {
    name: "Luxembourg",
    code: "LU",
    currency: "EUR",
    flag: "🇱🇺",
    phoneCode: "+352",
    phoneFormat: "+352 XXX XXX",
    postalCodeFormat: "XXXX",
  },

  // Major English-speaking Countries
  US: {
    name: "United States",
    code: "US",
    currency: "USD",
    flag: "🇺🇸",
    phoneCode: "+1",
    phoneFormat: "+1 (XXX) XXX-XXXX",
    postalCodeFormat: "XXXXX",
  },
  CA: {
    name: "Canada",
    code: "CA",
    currency: "CAD",
    flag: "🇨🇦",
    phoneCode: "+1",
    phoneFormat: "+1 (XXX) XXX-XXXX",
    postalCodeFormat: "A1A 1A1",
  },
  GB: {
    name: "United Kingdom",
    code: "GB",
    currency: "GBP",
    flag: "🇬🇧",
    phoneCode: "+44",
    phoneFormat: "+44 XXXX XXXXXX",
    postalCodeFormat: "A1A 1AA",
  },
  AU: {
    name: "Australia",
    code: "AU",
    currency: "AUD",
    flag: "🇦🇺",
    phoneCode: "+61",
    phoneFormat: "+61 X XXX XXX XXX",
    postalCodeFormat: "XXXX",
  },
  NZ: {
    name: "New Zealand",
    code: "NZ",
    currency: "NZD",
    flag: "🇳🇿",
    phoneCode: "+64",
    phoneFormat: "+64 X XXX XXX XXX",
    postalCodeFormat: "XXXX",
  },

  // Major Asian Countries
  JP: {
    name: "Japan",
    code: "JP",
    currency: "JPY",
    flag: "🇯🇵",
    phoneCode: "+81",
    phoneFormat: "+81 XX XXXX XXXX",
    postalCodeFormat: "XXX-XXXX",
  },
  CN: {
    name: "China",
    code: "CN",
    currency: "CNY",
    flag: "🇨🇳",
    phoneCode: "+86",
    phoneFormat: "+86 XXX XXXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  IN: {
    name: "India",
    code: "IN",
    currency: "INR",
    flag: "🇮🇳",
    phoneCode: "+91",
    phoneFormat: "+91 XXXXX XXXXX",
    postalCodeFormat: "XXXXXX",
  },
  KR: {
    name: "South Korea",
    code: "KR",
    currency: "KRW",
    flag: "🇰🇷",
    phoneCode: "+82",
    phoneFormat: "+82 XX XXXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  SG: {
    name: "Singapore",
    code: "SG",
    currency: "SGD",
    flag: "🇸🇬",
    phoneCode: "+65",
    phoneFormat: "+65 XXXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  MY: {
    name: "Malaysia",
    code: "MY",
    currency: "MYR",
    flag: "🇲🇾",
    phoneCode: "+60",
    phoneFormat: "+60 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  TH: {
    name: "Thailand",
    code: "TH",
    currency: "THB",
    flag: "🇹🇭",
    phoneCode: "+66",
    phoneFormat: "+66 X XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  VN: {
    name: "Vietnam",
    code: "VN",
    currency: "VND",
    flag: "🇻🇳",
    phoneCode: "+84",
    phoneFormat: "+84 XX XXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  PH: {
    name: "Philippines",
    code: "PH",
    currency: "PHP",
    flag: "🇵🇭",
    phoneCode: "+63",
    phoneFormat: "+63 XXX XXX XXXX",
    postalCodeFormat: "XXXX",
  },
  ID: {
    name: "Indonesia",
    code: "ID",
    currency: "IDR",
    flag: "🇮🇩",
    phoneCode: "+62",
    phoneFormat: "+62 XXX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },

  // Major Middle Eastern Countries
  AE: {
    name: "United Arab Emirates",
    code: "AE",
    currency: "AED",
    flag: "🇦🇪",
    phoneCode: "+971",
    phoneFormat: "+971 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  SA: {
    name: "Saudi Arabia",
    code: "SA",
    currency: "SAR",
    flag: "🇸🇦",
    phoneCode: "+966",
    phoneFormat: "+966 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  IL: {
    name: "Israel",
    code: "IL",
    currency: "ILS",
    flag: "🇮🇱",
    phoneCode: "+972",
    phoneFormat: "+972 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  TR: {
    name: "Turkey",
    code: "TR",
    currency: "TRY",
    flag: "🇹🇷",
    phoneCode: "+90",
    phoneFormat: "+90 XXX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
  EG: {
    name: "Egypt",
    code: "EG",
    currency: "EGP",
    flag: "🇪🇬",
    phoneCode: "+20",
    phoneFormat: "+20 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },

  // Major African Countries
  ZA: {
    name: "South Africa",
    code: "ZA",
    currency: "ZAR",
    flag: "🇿🇦",
    phoneCode: "+27",
    phoneFormat: "+27 XX XXX XXXX",
    postalCodeFormat: "XXXX",
  },
  NG: {
    name: "Nigeria",
    code: "NG",
    currency: "NGN",
    flag: "🇳🇬",
    phoneCode: "+234",
    phoneFormat: "+234 XXX XXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  KE: {
    name: "Kenya",
    code: "KE",
    currency: "KES",
    flag: "🇰🇪",
    phoneCode: "+254",
    phoneFormat: "+254 XXX XXX XXX",
    postalCodeFormat: "XXXXX",
  },
  GH: {
    name: "Ghana",
    code: "GH",
    currency: "GHS",
    flag: "🇬🇭",
    phoneCode: "+233",
    phoneFormat: "+233 XX XXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  MA: {
    name: "Morocco",
    code: "MA",
    currency: "MAD",
    flag: "🇲🇦",
    phoneCode: "+212",
    phoneFormat: "+212 XX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },

  // Major South American Countries
  BR: {
    name: "Brazil",
    code: "BR",
    currency: "BRL",
    flag: "🇧🇷",
    phoneCode: "+55",
    phoneFormat: "+55 XX XXXXX XXXX",
    postalCodeFormat: "XXXXX-XXX",
  },
  AR: {
    name: "Argentina",
    code: "AR",
    currency: "ARS",
    flag: "🇦🇷",
    phoneCode: "+54",
    phoneFormat: "+54 XX XXXX XXXX",
    postalCodeFormat: "XXXX",
  },
  CL: {
    name: "Chile",
    code: "CL",
    currency: "CLP",
    flag: "🇨🇱",
    phoneCode: "+56",
    phoneFormat: "+56 X XXXX XXXX",
    postalCodeFormat: "XXXXXXX",
  },
  CO: {
    name: "Colombia",
    code: "CO",
    currency: "COP",
    flag: "🇨🇴",
    phoneCode: "+57",
    phoneFormat: "+57 XXX XXX XXXX",
    postalCodeFormat: "XXXXXX",
  },
  PE: {
    name: "Peru",
    code: "PE",
    currency: "PEN",
    flag: "🇵🇪",
    phoneCode: "+51",
    phoneFormat: "+51 XXX XXX XXX",
    postalCodeFormat: "XXXXX",
  },
  MX: {
    name: "Mexico",
    code: "MX",
    currency: "MXN",
    flag: "🇲🇽",
    phoneCode: "+52",
    phoneFormat: "+52 XXX XXX XXXX",
    postalCodeFormat: "XXXXX",
  },
};

export type CountryCode = keyof typeof COUNTRIES;

// Helper functions
export const getCountryByCurrency = (currency: string) => {
  return Object.values(COUNTRIES).find(
    (country) => country.currency === currency
  );
};

export const getCurrencyByCountry = (countryCode: string) => {
  return COUNTRIES[countryCode]?.currency || "CHF";
};

export const getCountryByPhoneCode = (phoneCode: string) => {
  return Object.values(COUNTRIES).find(
    (country) => country.phoneCode === phoneCode
  );
};

export const getPhoneCodeByCountry = (countryCode: string) => {
  return COUNTRIES[countryCode]?.phoneCode || "+41";
};

// Get all countries as array for dropdowns
export const getCountriesArray = () => {
  return Object.values(COUNTRIES).sort((a, b) => {
    // Switzerland first, then alphabetically
    if (a.code === "CH") return -1;
    if (b.code === "CH") return 1;
    return a.name.localeCompare(b.name);
  });
};

// Get countries for phone selection (grouped by region)
export const getPhoneCountries = () => {
  const countries = getCountriesArray();

  return {
    popular: countries.filter((c) =>
      ["CH", "DE", "FR", "IT", "US", "GB", "CA", "AU"].includes(c.code)
    ),
    europe: countries.filter((c) =>
      [
        "CH",
        "DE",
        "FR",
        "IT",
        "AT",
        "NL",
        "ES",
        "PT",
        "SE",
        "NO",
        "DK",
        "FI",
        "BE",
        "IE",
        "PL",
        "CZ",
        "HU",
        "RO",
        "BG",
        "HR",
        "SI",
        "SK",
        "LT",
        "LV",
        "EE",
        "GR",
        "CY",
        "MT",
        "LU",
      ].includes(c.code)
    ),
    asia: countries.filter((c) =>
      ["JP", "CN", "IN", "KR", "SG", "MY", "TH", "VN", "PH", "ID"].includes(
        c.code
      )
    ),
    americas: countries.filter((c) =>
      ["US", "CA", "BR", "AR", "CL", "CO", "PE", "MX"].includes(c.code)
    ),
    others: countries.filter(
      (c) =>
        ![
          "CH",
          "DE",
          "FR",
          "IT",
          "AT",
          "NL",
          "ES",
          "PT",
          "SE",
          "NO",
          "DK",
          "FI",
          "BE",
          "IE",
          "PL",
          "CZ",
          "HU",
          "RO",
          "BG",
          "HR",
          "SI",
          "SK",
          "LT",
          "LV",
          "EE",
          "GR",
          "CY",
          "MT",
          "LU",
          "JP",
          "CN",
          "IN",
          "KR",
          "SG",
          "MY",
          "TH",
          "VN",
          "PH",
          "ID",
          "US",
          "CA",
          "BR",
          "AR",
          "CL",
          "CO",
          "PE",
          "MX",
        ].includes(c.code)
    ),
  };
};

// Backward compatibility export for setup page
export const COUNTRY_OPTIONS = getCountriesArray().map((country) => ({
  value: country.code,
  label: `${country.flag} ${country.name}`,
  currency: country.currency,
  stripeConnect: true, // Most countries are supported by Stripe Connect
}));

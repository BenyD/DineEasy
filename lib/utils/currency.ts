export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function formatCurrencyCompact(
  amount: number,
  currency: string = "USD"
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: "currency",
    currency: currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return formatter.format(amount);
}

function getLocaleForCurrency(currency: string): string {
  const currencyLocales: Record<string, string> = {
    USD: "en-US",
    CHF: "de-CH",
    EUR: "de-DE",
    GBP: "en-GB",
    INR: "en-IN",
    AUD: "en-AU",
    AED: "ar-AE",
    SEK: "sv-SE",
    CAD: "en-CA",
    NZD: "en-NZ",
    LKR: "si-LK",
    SGD: "en-SG",
    MYR: "ms-MY",
    THB: "th-TH",
    JPY: "ja-JP",
    HKD: "zh-HK",
    KRW: "ko-KR",
  };

  return currencyLocales[currency] || "en-US";
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    CHF: "CHF",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    AED: "AED",
    SEK: "kr",
    CAD: "C$",
    NZD: "NZ$",
    LKR: "Rs",
    SGD: "S$",
    MYR: "RM",
    THB: "฿",
    JPY: "¥",
    HKD: "HK$",
    KRW: "₩",
  };

  return symbols[currency] || currency;
}

export function parseCurrencyAmount(
  amount: string,
  currency: string = "USD"
): number {
  // Remove currency symbols and commas, then parse
  const cleanAmount = amount.replace(/[^\d.-]/g, "");
  return parseFloat(cleanAmount) || 0;
}

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export const getCookieConsent = (): CookieConsent | null => {
  if (typeof window === "undefined") return null;

  const consent = localStorage.getItem("cookie-consent");
  if (!consent) return null;

  try {
    return JSON.parse(consent);
  } catch {
    return null;
  }
};

export const hasAnalyticsConsent = (): boolean => {
  const consent = getCookieConsent();
  return !!consent?.analytics;
};

export const hasMarketingConsent = (): boolean => {
  const consent = getCookieConsent();
  return !!consent?.marketing;
};

export const clearCookieConsent = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("cookie-consent");

  // Clear analytics cookies
  document.cookie = "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear any marketing cookies
  document.cookie = "__fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

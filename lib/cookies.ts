interface CookieConsent {
  necessary: boolean;
  functional: boolean;
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

export const hasFunctionalConsent = (): boolean => {
  const consent = getCookieConsent();
  return !!consent?.functional;
};

export const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof window === "undefined") return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const clearCookieConsent = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("cookie-consent");

  // Clear analytics cookies
  document.cookie =
    "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=.${window.location.hostname}";
  document.cookie =
    "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=.${window.location.hostname}";
  document.cookie =
    "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=.${window.location.hostname}";

  // Clear marketing cookies
  document.cookie =
    "__fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=.${window.location.hostname}";

  // Clear functional cookies (except necessary ones)
  document.cookie =
    "sidebar_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
};

export const initializeCookies = () => {
  const consent = getCookieConsent();
  if (!consent) return;

  if (
    consent.analytics &&
    !document.querySelector('script[src*="googletagmanager"]')
  ) {
    // Initialize analytics if consent given and script not already loaded
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag("js", new Date());
      gtag("config", process.env.NEXT_PUBLIC_GA_ID);
    };
  }

  if (consent.marketing) {
    // Initialize marketing cookies if needed
    // This is where you would initialize Facebook Pixel
  }
};

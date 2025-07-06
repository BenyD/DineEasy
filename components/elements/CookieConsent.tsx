"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_TYPES = {
  necessary: {
    title: "Essential Cookies",
    description:
      "Required for the website to function properly. Cannot be disabled.",
    examples: ["Session ID", "CSRF Token", "Cookie Consent"],
  },
  functional: {
    title: "Functional Cookies",
    description: "Enable enhanced functionality and personalization.",
    examples: ["Language Preferences", "User Settings", "Live Chat Services"],
  },
  analytics: {
    title: "Analytics Cookies",
    description: "Help us understand how visitors interact with our website.",
    examples: ["Google Analytics", "Page Views", "Scroll Depth"],
  },
  marketing: {
    title: "Marketing Cookies",
    description: "Used to deliver personalized advertisements.",
    examples: [
      "Ad Platform Cookies",
      "Social Media Pixels",
      "Conversion Tracking",
    ],
  },
};

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Add event listener for cookie consent changes
    const handleConsentChange = () => {
      setShowBanner(true);
      setSettings({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      });
    };

    window.addEventListener("cookieConsentChange", handleConsentChange);
    return () =>
      window.removeEventListener("cookieConsentChange", handleConsentChange);
  }, []);

  useEffect(() => {
    // Only run after component is mounted
    if (!mounted) {
      console.log("CookieConsent: Not mounted yet");
      return;
    }

    // Ensure we're running on client-side
    if (typeof window === "undefined") {
      console.log("CookieConsent: Not on client side");
      return;
    }

    console.log("CookieConsent: Checking consent status");

    // Use setTimeout to avoid hydration mismatch
    const timer = setTimeout(() => {
      // Check if user has already made a choice
      const consent = localStorage.getItem("cookie-consent");
      const hasExistingCookies =
        document.cookie.includes("_ga") || document.cookie.includes("__fbp");

      console.log("CookieConsent: Consent:", consent);
      console.log("CookieConsent: Existing cookies:", hasExistingCookies);

      if (!consent && !hasExistingCookies) {
        console.log("CookieConsent: Showing banner - no consent or cookies");
        // Only show banner if no consent and no existing cookies
        setShowBanner(true);
      } else if (consent) {
        // If we have consent, load the settings
        try {
          const savedSettings = JSON.parse(consent);
          console.log("CookieConsent: Loading saved settings:", savedSettings);
          setSettings(savedSettings);
        } catch (error) {
          console.log("CookieConsent: Error parsing consent:", error);
          // If parsing fails, show the banner
          setShowBanner(true);
        }
      } else if (hasExistingCookies) {
        console.log("CookieConsent: Has existing cookies, assuming consent");
        // If we have existing cookies but no consent, assume consent was given
        const assumedSettings = {
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
        };
        setSettings(assumedSettings);
        saveSettings(assumedSettings);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [mounted]);

  const saveSettings = (newSettings: CookieSettings) => {
    // Ensure we're running on client-side
    if (typeof window === "undefined") return;

    try {
      // Store previous analytics state to check if it changed
      const previousSettings = settings;

      localStorage.setItem(
        "cookie-consent",
        JSON.stringify({
          ...newSettings,
          timestamp: new Date().toISOString(),
        })
      );
      setShowBanner(false);
      setSettings(newSettings);

      // Clear non-essential cookies if they're disabled
      if (!newSettings.analytics) {
        document.cookie =
          "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=." +
          window.location.hostname;
        document.cookie =
          "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=." +
          window.location.hostname;
        document.cookie =
          "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=." +
          window.location.hostname;
      }

      if (!newSettings.marketing) {
        document.cookie =
          "__fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=." +
          window.location.hostname;
      }

      // Only reload if analytics state changed from disabled to enabled
      if (!previousSettings.analytics && newSettings.analytics) {
        // Initialize analytics
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
    } catch (error) {
      console.error("Failed to save cookie settings:", error);
    }
  };

  const acceptAll = () => {
    const allEnabled = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setSettings(allEnabled);
    saveSettings(allEnabled);
  };

  const rejectAll = () => {
    const essentialOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setSettings(essentialOnly);
    saveSettings(essentialOnly);
  };

  const toggleSetting = (key: keyof CookieSettings) => {
    if (key === "necessary") return; // Cannot disable necessary cookies
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
  };

  const renderCookieType = ([key, value]: [
    string,
    (typeof COOKIE_TYPES)[keyof typeof COOKIE_TYPES]
  ]) => {
    return (
      <AccordionItem key={key} value={key}>
        <div className="flex items-center justify-between w-full">
          <AccordionTrigger className="flex-1 text-sm hover:no-underline py-2">
            <span className="text-left">{value.title}</span>
          </AccordionTrigger>
          <div className="pr-2 sm:pr-4">
            <Switch
              checked={settings[key as keyof CookieSettings]}
              onCheckedChange={() => toggleSetting(key as keyof CookieSettings)}
              disabled={key === "necessary"}
              className="ml-2 sm:ml-4 data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
            />
          </div>
        </div>
        <AccordionContent>
          <div className="py-2 sm:py-3">
            <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
              {value.description}
            </p>
            <div className="text-xs text-gray-500">
              <strong>Examples:</strong> {value.examples.join(", ")}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (!mounted || !showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-3">
              <span className="text-lg">🍪</span>
              <h3 className="text-base font-semibold sm:text-lg">
                Cookie Settings
              </h3>
            </div>
            <p className="mt-1.5 text-sm text-gray-600">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. See our{" "}
              <Link
                href="/privacy"
                className="text-green-600 hover:text-green-700 underline underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              for more details.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="h-9 px-4 text-sm"
            >
              Reject All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-9 px-4 text-sm"
            >
              {showDetails ? "Hide Details" : "Customize"}
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="h-9 px-4 text-sm bg-green-600 hover:bg-green-700"
            >
              Accept All
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 border-t pt-4">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {Object.entries(COOKIE_TYPES).map(renderCookieType)}
            </Accordion>
          </div>
        )}

        <button
          onClick={() => setShowBanner(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

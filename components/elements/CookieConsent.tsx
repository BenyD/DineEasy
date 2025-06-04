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
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedSettings = JSON.parse(consent);
      setSettings(savedSettings);
    }
  }, []);

  const saveSettings = (newSettings: CookieSettings) => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        ...newSettings,
        timestamp: new Date().toISOString(),
      })
    );
    setShowBanner(false);

    // Clear non-essential cookies if they're disabled
    if (!newSettings.analytics) {
      document.cookie = "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    if (!newSettings.marketing) {
      document.cookie =
        "__fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
              className="ml-2 sm:ml-4"
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

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">
                🍪 Cookie Settings
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                We value your privacy and comply with Swiss and EU data
                protection laws
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors -mt-1"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="prose prose-sm max-w-none mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. Click "Accept All"
              to allow all cookies, "Reject All" for essential cookies only, or
              "Customize" to manage your preferences. See our{" "}
              <Link
                href="/privacy"
                className="text-green-600 hover:text-green-700 underline underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              for more details.
            </p>
          </div>

          {showDetails ? (
            <div className="mb-4 sm:mb-6">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {Object.entries(COOKIE_TYPES).map(renderCookieType)}
              </Accordion>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            >
              Reject All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            >
              {showDetails ? "Hide Details" : "Customize"}
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9 bg-green-600 hover:bg-green-700"
            >
              Accept All
            </Button>
          </div>

          <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-700"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-700"
            >
              Terms of Service
            </a>{" "}
            apply.
          </div>
        </div>
      </div>
    </div>
  );
}

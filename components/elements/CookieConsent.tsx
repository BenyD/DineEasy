import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString(),
      })
    );
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: new Date().toISOString(),
      })
    );
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white/80 backdrop-blur-sm border-t">
      <div className="container relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:gap-8 items-end">
          <div className="pr-8">
            <div className="flex items-start">
              <div>
                <h3 className="text-base font-semibold mb-2">
                  🍪 Cookie Settings
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We use cookies to enhance your browsing experience, serve
                  personalized content, and analyze our traffic. By clicking
                  "Accept All" you consent to our use of cookies.
                  <Link
                    href="/privacy"
                    className="text-green-600 hover:text-green-700 underline underline-offset-4 ml-1"
                  >
                    Learn more in our Privacy Policy
                  </Link>
                </p>
                <div className="mt-2 text-xs text-gray-500">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 md:min-w-[260px]">
            <Button
              variant="outline"
              size="sm"
              onClick={acceptNecessary}
              className="flex-1 text-sm"
            >
              Necessary Only
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="flex-1 text-sm bg-green-600 hover:bg-green-700"
            >
              Accept All
            </Button>
          </div>
        </div>

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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getCookieConsent, clearCookieConsent } from "@/lib/cookies";

export function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true and disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) {
      setPreferences({
        necessary: true,
        analytics: consent.analytics,
        marketing: consent.marketing,
      });
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      })
    );

    // If user disabled any cookies, clear them
    if (!preferences.analytics || !preferences.marketing) {
      clearCookieConsent();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Necessary Cookies</h3>
            <p className="text-sm text-gray-500">
              Required for the website to function properly. Cannot be disabled.
            </p>
          </div>
          <Switch checked disabled />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Analytics Cookies</h3>
            <p className="text-sm text-gray-500">
              Help us understand how visitors interact with our website.
            </p>
          </div>
          <Switch
            checked={preferences.analytics}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, analytics: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Marketing Cookies</h3>
            <p className="text-sm text-gray-500">
              Used to deliver personalized advertisements and track their
              performance.
            </p>
          </div>
          <Switch
            checked={preferences.marketing}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({ ...prev, marketing: checked }))
            }
          />
        </div>
      </div>

      <Button
        onClick={savePreferences}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Save Preferences
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function KitchenOrdersPage() {
  const [settings, setSettings] = useState({
    enabled: true,
    autoPrint: true,
    restaurantName: "Bella Vista Restaurant",
    location: "Zürich",
    printAllergies: true,
    printNotes: true,
    printModifiers: true,
    soundAlert: true,
  });

  const [testPrintStatus, setTestPrintStatus] = useState<
    "idle" | "printing" | "success" | "error"
  >("idle");

  const handleTestPrint = () => {
    setTestPrintStatus("printing");
    setTimeout(() => {
      setTestPrintStatus("success");
      setTimeout(() => setTestPrintStatus("idle"), 3000);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Kitchen Order Tickets
        </h1>
        <p className="text-gray-500">
          Configure kitchen order ticket printing settings
        </p>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Kitchen Printer Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Kitchen Printer */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableKitchenPrinter" className="text-base">
                Enable kitchen printer
              </Label>
              <p className="text-sm text-gray-500">
                Use printer for kitchen order tickets instead of display
              </p>
            </div>
            <Switch
              id="enableKitchenPrinter"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
              className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
            />
          </div>

          {settings.enabled && (
            <>
              <Separator />

              {/* Auto Print Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="kitchenAutoPrint" className="text-base">
                    Auto-print kitchen orders
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically print order tickets when new orders arrive
                  </p>
                </div>
                <Switch
                  id="kitchenAutoPrint"
                  checked={settings.autoPrint}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoPrint: checked })
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                />
              </div>

              <Separator />

              {/* Restaurant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={settings.restaurantName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurantName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={settings.location}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Print Options */}
              <div className="space-y-4">
                <h3 className="font-medium">Print Options</h3>

                <div className="flex items-center justify-between">
                  <Label htmlFor="printAllergies" className="cursor-pointer">
                    Print allergies
                  </Label>
                  <Switch
                    id="printAllergies"
                    checked={settings.printAllergies}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        printAllergies: checked,
                      })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="printNotes" className="cursor-pointer">
                    Print customer notes
                  </Label>
                  <Switch
                    id="printNotes"
                    checked={settings.printNotes}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        printNotes: checked,
                      })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="printModifiers" className="cursor-pointer">
                    Print item modifiers
                  </Label>
                  <Switch
                    id="printModifiers"
                    checked={settings.printModifiers}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        printModifiers: checked,
                      })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="soundAlert" className="cursor-pointer">
                    Sound alert on new orders
                  </Label>
                  <Switch
                    id="soundAlert"
                    checked={settings.soundAlert}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        soundAlert: checked,
                      })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                  />
                </div>
              </div>

              {/* Test Print Button */}
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={handleTestPrint}
                  disabled={testPrintStatus === "printing"}
                  className={
                    testPrintStatus === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : testPrintStatus === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {testPrintStatus === "printing" && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  )}
                  {testPrintStatus === "success" && (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {testPrintStatus === "error" && (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {testPrintStatus === "idle" && "Test Print"}
                  {testPrintStatus === "printing" && "Printing..."}
                  {testPrintStatus === "success" && "Print Successful"}
                  {testPrintStatus === "error" && "Print Failed"}
                </Button>
              </div>

              {/* Kitchen Order Preview */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Kitchen Order Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border border-gray-200 p-4 rounded-md font-mono text-sm max-w-sm mx-auto whitespace-pre-wrap">
                    {`+------------------------------------+
|        🍽️  Kitchen Order Ticket       |
|  ${settings.restaurantName} - ${settings.location}   |
+------------------------------------+
|  Table No: 3      Order ID: #9823  |
|  Date: 2025-04-20   Time: 1:13 PM  |
+------------------------------------+

Qty   Item Name
-------------------------------
1     Chicken Biryani
2     Garlic Naan
1     Sweet Lassi

-------------------------------${
                      settings.printNotes
                        ? `
 Notes: Less Spicy on Biryani`
                        : ""
                    }${
                      settings.printAllergies
                        ? `
 Allergies: No Nuts`
                        : ""
                    }
-------------------------------

+------------------------------------+
|       🔔 Please prepare ASAP       |
+------------------------------------+`}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="pt-4">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

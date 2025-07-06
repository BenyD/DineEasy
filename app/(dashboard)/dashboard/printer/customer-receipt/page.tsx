"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerReceiptPage() {
  const [settings, setSettings] = useState({
    autoPrint: true,
    receiptHeader: "Bella Vista Restaurant",
    receiptFooter: "Thank you for dining with us!",
    printLogo: true,
    printItemModifiers: true,
    printCustomerNotes: true,
    fallbackMode: "manual" as "manual" | "email",
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

  // Mock restaurant info - in real app, this would come from your backend
  const restaurantInfo = {
    taxRate: 7.7,
    vatNumber: "CHE-123.456.789",
    address: "123 Main Street, Zurich",
    phone: "+41 44 123 4567",
    website: "www.bellavista.ch",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Receipts</h1>
        <p className="text-gray-500">
          Configure customer receipt printing settings and format
        </p>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Print Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoPrint" className="text-base">
                Auto-print receipts
              </Label>
              <p className="text-sm text-gray-500">
                Automatically print receipts when orders are completed
              </p>
            </div>
            <Switch
              id="autoPrint"
              checked={settings.autoPrint}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoPrint: checked })
              }
              className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
            />
          </div>

          <Separator />

          {/* Fallback Mode */}
          <div className="space-y-2">
            <Label htmlFor="fallbackMode">
              Fallback Mode (If printer is offline)
            </Label>
            <Select
              value={settings.fallbackMode}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  fallbackMode: value as "manual" | "email",
                })
              }
            >
              <SelectTrigger id="fallbackMode">
                <SelectValue placeholder="Select fallback mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Print Later</SelectItem>
                <SelectItem value="email">Email Receipt to Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Receipt Content Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Receipt Content</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="printLogo" className="cursor-pointer">
                Print restaurant logo
              </Label>
              <Switch
                id="printLogo"
                checked={settings.printLogo}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    printLogo: checked,
                  })
                }
                className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printItemModifiers" className="cursor-pointer">
                Print item modifiers
              </Label>
              <Switch
                id="printItemModifiers"
                checked={settings.printItemModifiers}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    printItemModifiers: checked,
                  })
                }
                className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printCustomerNotes" className="cursor-pointer">
                Print customer notes
              </Label>
              <Switch
                id="printCustomerNotes"
                checked={settings.printCustomerNotes}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    printCustomerNotes: checked,
                  })
                }
                className="data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
              />
            </div>
          </div>

          <Separator />

          {/* Receipt Customization */}
          <div className="space-y-4">
            <h3 className="font-medium">Receipt Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <Input
                  id="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      receiptHeader: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Receipt Footer</Label>
              <Textarea
                id="receiptFooter"
                value={settings.receiptFooter}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    receiptFooter: e.target.value,
                  })
                }
                className="min-h-[80px]"
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

          {/* Receipt Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Receipt Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 p-4 rounded-md font-mono text-sm max-w-xs mx-auto">
                <div className="text-center mb-4">
                  {settings.printLogo && (
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-400">
                      Logo
                    </div>
                  )}
                  <div className="font-bold">{settings.receiptHeader}</div>
                  <div className="text-xs text-gray-500">
                    {restaurantInfo.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    Tel: {restaurantInfo.phone}
                  </div>
                  <div className="text-xs text-gray-500">
                    VAT No: {restaurantInfo.vatNumber}
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-2 my-2">
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span>1234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>03/06/2025 13:04</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span>5</span>
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex justify-between font-bold">
                    <span>Item</span>
                    <span>Price</span>
                  </div>
                  <div className="border-b border-dotted border-gray-300 my-1"></div>

                  <div className="flex justify-between">
                    <span>1x Margherita Pizza</span>
                    <span>22.00</span>
                  </div>
                  {settings.printItemModifiers && (
                    <div className="text-xs text-gray-500 ml-4">
                      - Extra cheese
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>1x Caesar Salad</span>
                    <span>16.50</span>
                  </div>

                  <div className="flex justify-between">
                    <span>2x House Wine</span>
                    <span>17.00</span>
                  </div>
                </div>

                {settings.printCustomerNotes && (
                  <div className="text-xs border-t border-dotted border-gray-300 pt-2 mb-2">
                    <span className="font-bold">Notes: </span>
                    <span>Please bring extra napkins</span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-300 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>55.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({restaurantInfo.taxRate}%):</span>
                    <span>4.27</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>59.77</span>
                  </div>
                </div>

                <div className="text-center mt-4 text-xs">
                  <p>{settings.receiptFooter}</p>
                  <p className="mt-1">{restaurantInfo.website}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

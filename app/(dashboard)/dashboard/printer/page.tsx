"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Printer, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PrinterPage() {
  const [printerSettings, setPrinterSettings] = useState({
    autoPrint: true,
    printerName: "EPSON TM-T20III",
    printerStatus: "connected", // connected, disconnected, error
    receiptHeader: "Bella Vista Restaurant",
    receiptFooter: "Thank you for dining with us!",
    taxRate: 7.7,
    paperSize: "80mm",
    printLogo: true,
    printItemModifiers: true,
    printCustomerNotes: true,
    fallbackMode: "manual", // manual, email
  });

  const [testPrintStatus, setTestPrintStatus] = useState<
    "idle" | "printing" | "success" | "error"
  >("idle");

  const handleTestPrint = () => {
    setTestPrintStatus("printing");

    // Simulate print process
    setTimeout(() => {
      if (printerSettings.printerStatus === "connected") {
        setTestPrintStatus("success");
        setTimeout(() => setTestPrintStatus("idle"), 3000);
      } else {
        setTestPrintStatus("error");
      }
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Printer Settings</h1>
        <p className="text-gray-500">
          Configure your receipt printer and receipt format
        </p>
      </div>

      {/* Printer Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={
            printerSettings.printerStatus === "connected"
              ? "border-green-200"
              : "border-red-200"
          }
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    printerSettings.printerStatus === "connected"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <Printer
                    className={`h-6 w-6 ${
                      printerSettings.printerStatus === "connected"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {printerSettings.printerStatus === "connected"
                      ? "Printer Connected"
                      : "Printer Disconnected"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {printerSettings.printerName}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPrinterSettings({
                      ...printerSettings,
                      printerStatus:
                        printerSettings.printerStatus === "connected"
                          ? "disconnected"
                          : "connected",
                    })
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleTestPrint}
                  disabled={testPrintStatus === "printing"}
                  className={
                    testPrintStatus === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : testPrintStatus === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Alert - Show only when printer is disconnected */}
      {printerSettings.printerStatus !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Printer Connection Error</AlertTitle>
            <AlertDescription>
              Your receipt printer is currently disconnected. Please check the
              connection and power status. Orders will still be processed, but
              receipts will need to be printed manually.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Printer Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Printer Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Print Setting */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoPrint" className="text-base">
                  Auto-print receipts
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically print receipts when orders are received
                </p>
              </div>
              <Switch
                id="autoPrint"
                checked={printerSettings.autoPrint}
                onCheckedChange={(checked) =>
                  setPrinterSettings({ ...printerSettings, autoPrint: checked })
                }
              />
            </div>

            <Separator />

            {/* Printer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="printerName">Printer Name</Label>
                <Select
                  value={printerSettings.printerName}
                  onValueChange={(value) =>
                    setPrinterSettings({
                      ...printerSettings,
                      printerName: value,
                    })
                  }
                >
                  <SelectTrigger id="printerName">
                    <SelectValue placeholder="Select printer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EPSON TM-T20III">
                      EPSON TM-T20III
                    </SelectItem>
                    <SelectItem value="Star Micronics TSP143">
                      Star Micronics TSP143
                    </SelectItem>
                    <SelectItem value="HP LaserJet Pro">
                      HP LaserJet Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select
                  value={printerSettings.paperSize}
                  onValueChange={(value) =>
                    setPrinterSettings({ ...printerSettings, paperSize: value })
                  }
                >
                  <SelectTrigger id="paperSize">
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fallback Mode */}
            <div className="space-y-2">
              <Label htmlFor="fallbackMode">
                Fallback Mode (If printer is offline)
              </Label>
              <Select
                value={printerSettings.fallbackMode}
                onValueChange={(value) =>
                  setPrinterSettings({
                    ...printerSettings,
                    fallbackMode: value as "manual" | "email",
                  })
                }
              >
                <SelectTrigger id="fallbackMode">
                  <SelectValue placeholder="Select fallback mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Print Later</SelectItem>
                  <SelectItem value="email">
                    Email Receipt to Customer
                  </SelectItem>
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
                  checked={printerSettings.printLogo}
                  onCheckedChange={(checked) =>
                    setPrinterSettings({
                      ...printerSettings,
                      printLogo: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="printItemModifiers" className="cursor-pointer">
                  Print item modifiers
                </Label>
                <Switch
                  id="printItemModifiers"
                  checked={printerSettings.printItemModifiers}
                  onCheckedChange={(checked) =>
                    setPrinterSettings({
                      ...printerSettings,
                      printItemModifiers: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="printCustomerNotes" className="cursor-pointer">
                  Print customer notes
                </Label>
                <Switch
                  id="printCustomerNotes"
                  checked={printerSettings.printCustomerNotes}
                  onCheckedChange={(checked) =>
                    setPrinterSettings({
                      ...printerSettings,
                      printCustomerNotes: checked,
                    })
                  }
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
                    value={printerSettings.receiptHeader}
                    onChange={(e) =>
                      setPrinterSettings({
                        ...printerSettings,
                        receiptHeader: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={printerSettings.taxRate}
                    onChange={(e) =>
                      setPrinterSettings({
                        ...printerSettings,
                        taxRate: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <Textarea
                  id="receiptFooter"
                  value={printerSettings.receiptFooter}
                  onChange={(e) =>
                    setPrinterSettings({
                      ...printerSettings,
                      receiptFooter: e.target.value,
                    })
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Receipt Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border border-gray-200 p-4 rounded-md font-mono text-sm max-w-xs mx-auto">
              <div className="text-center mb-4">
                {printerSettings.printLogo && (
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-400">
                    Logo
                  </div>
                )}
                <div className="font-bold">{printerSettings.receiptHeader}</div>
                <div className="text-xs text-gray-500">
                  123 Main Street, Zurich
                </div>
                <div className="text-xs text-gray-500">
                  Tel: +41 44 123 4567
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
                {printerSettings.printItemModifiers && (
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

              {printerSettings.printCustomerNotes && (
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
                  <span>Tax ({printerSettings.taxRate}%):</span>
                  <span>4.27</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>59.77</span>
                </div>
              </div>

              <div className="text-center mt-4 text-xs">
                <p>{printerSettings.receiptFooter}</p>
                <p className="mt-1">www.bellavista.ch</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

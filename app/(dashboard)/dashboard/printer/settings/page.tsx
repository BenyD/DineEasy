"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  RefreshCw,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PrinterSettingsPage() {
  const [printerSettings, setPrinterSettings] = useState({
    printerName: "",
    printerStatus: "disconnected", // connected, disconnected, error
    paperSize: "80mm",
    connectionType: "network", // network, usb
    ipAddress: "",
    port: "9100",
    isSearching: false,
  });

  const [testPrintStatus, setTestPrintStatus] = useState<
    "idle" | "printing" | "success" | "error"
  >("idle");

  const handleTestPrint = () => {
    setTestPrintStatus("printing");
    setTimeout(() => {
      if (printerSettings.printerStatus === "connected") {
        setTestPrintStatus("success");
        setTimeout(() => setTestPrintStatus("idle"), 3000);
      } else {
        setTestPrintStatus("error");
      }
    }, 2000);
  };

  const handleSearchPrinters = () => {
    setPrinterSettings((prev) => ({ ...prev, isSearching: true }));
    // Simulate printer search
    setTimeout(() => {
      setPrinterSettings((prev) => ({ ...prev, isSearching: false }));
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Printer Setup</h1>
        <p className="text-gray-500">
          Configure your receipt printer connection and settings
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
                    {printerSettings.printerName || "No printer selected"}
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
                  disabled={
                    testPrintStatus === "printing" ||
                    printerSettings.printerStatus !== "connected"
                  }
                  className={
                    testPrintStatus === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : testPrintStatus === "error"
                      ? "bg-red-600 hover:bg-red-700"
                      : ""
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
              Your printer is currently disconnected. Please check the
              connection settings below and ensure the printer is powered on.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Printer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Configuration</CardTitle>
          <CardDescription>
            Set up your receipt printer connection and basic settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Type */}
          <div className="space-y-2">
            <Label htmlFor="connectionType">Connection Type</Label>
            <Select
              value={printerSettings.connectionType}
              onValueChange={(value) =>
                setPrinterSettings({
                  ...printerSettings,
                  connectionType: value,
                })
              }
            >
              <SelectTrigger id="connectionType">
                <SelectValue placeholder="Select connection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="network">Network Printer</SelectItem>
                <SelectItem value="usb">USB Printer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Network Settings */}
          {printerSettings.connectionType === "network" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  value={printerSettings.ipAddress}
                  onChange={(e) =>
                    setPrinterSettings({
                      ...printerSettings,
                      ipAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="9100"
                  value={printerSettings.port}
                  onChange={(e) =>
                    setPrinterSettings({
                      ...printerSettings,
                      port: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* USB Printer Search */}
          {printerSettings.connectionType === "usb" && (
            <div className="space-y-4">
              <Button
                onClick={handleSearchPrinters}
                disabled={printerSettings.isSearching}
                className="w-full"
              >
                {printerSettings.isSearching ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Searching for printers...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search for USB Printers
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator />

          {/* Paper Size */}
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

          <div className="pt-4">
            <Button className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

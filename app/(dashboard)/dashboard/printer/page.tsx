"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Printer, ChefHat, Receipt, Settings } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function PrinterPage() {
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
    <motion.div
      className="p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Printer Management</h1>
        <p className="text-gray-500">
          Manage your printer settings and receipt formats
        </p>
      </motion.div>

      {/* Printer Management Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {/* Printer Settings */}
        <motion.div variants={itemVariants}>
          <Link href="/dashboard/printer/settings">
            <Card className="hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Printer Settings
                </CardTitle>
                <CardDescription>
                  Configure printer connection and setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Set up your printer connection, configure network settings,
                  and manage basic printer options
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Kitchen Orders */}
        <motion.div variants={itemVariants}>
          <Link href="/dashboard/printer/kitchen-orders">
            <Card className="hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Kitchen Orders
                </CardTitle>
                <CardDescription>Kitchen order ticket settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Configure kitchen order ticket format, auto-printing options,
                  and notification settings
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Customer Receipts */}
        <motion.div variants={itemVariants}>
          <Link href="/dashboard/printer/customer-receipt">
            <Card className="hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Customer Receipts
                </CardTitle>
                <CardDescription>Customer receipt settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Customize receipt layout, configure auto-printing, and manage
                  receipt content options
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

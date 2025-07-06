"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Receipt, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ payment?: string; total?: string; tip?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [orderNumber] = useState(() => Math.floor(Math.random() * 1000) + 1);
  const [estimatedTime] = useState(() => Math.floor(Math.random() * 20) + 15); // 15-35 minutes

  const paymentMethod = resolvedSearchParams.payment || "stripe";
  const total = resolvedSearchParams.total || "0.00";
  const tip = resolvedSearchParams.tip || "0.00";

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "stripe":
        return "Credit Card";
      case "twint":
        return "TWINT";
      case "cash":
        return "Cash at Counter";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Enhanced Success Animation */}
      <div className="px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2,
          }}
          className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl"
        >
          <Check className="w-16 h-16 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Order Confirmed! 🎉
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Thank you for your order. We'll start preparing it right away.
          </p>
        </motion.div>

        {/* Enhanced Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white border border-green-200 rounded-2xl p-6 mb-6 text-left shadow-lg"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-center text-lg">
            Order Details
          </h3>

          <div className="space-y-4 text-base">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Order Number</span>
              <span className="font-mono font-bold text-green-700 text-lg">
                #{orderNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Table</span>
              <span className="font-semibold text-lg">
                {resolvedParams.tableId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold">
                {getPaymentMethodName(paymentMethod)}
              </span>
            </div>
            {Number.parseFloat(tip) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tip</span>
                <span className="font-semibold text-green-600">CHF {tip}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-xl text-green-700">
                CHF {total}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Estimated Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-blue-900 text-lg">
              Estimated Preparation Time
            </h3>
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-2">
            {estimatedTime} minutes
          </p>
          <p className="text-blue-600">We'll notify the kitchen immediately</p>
        </motion.div>

        {/* Tip Appreciation */}
        {Number.parseFloat(tip) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2 text-yellow-700 mb-2">
              <Gift className="w-5 h-5" />
              <span className="font-semibold">Thank you for the tip!</span>
            </div>
            <p className="text-yellow-600 text-sm">
              Your generosity is greatly appreciated by our staff
            </p>
          </motion.div>
        )}

        {/* Receipt Info */}
        {paymentMethod !== "cash" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm"
          >
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Receipt className="w-5 h-5" />
              <span className="font-medium">Receipt sent to your email</span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="space-y-4"
        >
          <Link
            href={{
              pathname: `/qr/${resolvedParams.tableId}/feedback`,
              query: { order: orderNumber },
            }}
          >
            <Button
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50 h-14 text-lg rounded-2xl shadow-sm"
            >
              <Star className="w-5 h-5 mr-2" />
              Rate Your Experience
            </Button>
          </Link>

          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:bg-gray-50 h-14 text-lg rounded-2xl"
            >
              Order More Items
            </Button>
          </Link>
        </motion.div>

        {/* Enhanced Thank You Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-lg">Enjoy your meal! 🍽️</p>
        </motion.div>
      </div>
    </div>
  );
}

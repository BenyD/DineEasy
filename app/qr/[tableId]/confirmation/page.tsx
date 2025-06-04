"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Clock, Receipt, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConfirmationPage({
  params,
  searchParams,
}: {
  params: { tableId: string }
  searchParams: { payment?: string; total?: string }
}) {
  const [orderNumber] = useState(() => Math.floor(Math.random() * 1000) + 1)
  const [estimatedTime] = useState(() => Math.floor(Math.random() * 20) + 15) // 15-35 minutes

  const paymentMethod = searchParams.payment || "stripe"
  const total = searchParams.total || "0.00"

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "stripe":
        return "Credit Card"
      case "twint":
        return "TWINT"
      case "cash":
        return "Cash at Counter"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Success Animation */}
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
          className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-600">Thank you for your order. We'll start preparing it right away.</p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Order Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-mono font-bold text-green-700">#{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Table</span>
              <span className="font-semibold">{params.tableId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold">{getPaymentMethodName(paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-lg text-green-700">CHF {total}</span>
            </div>
          </div>
        </motion.div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Estimated Preparation Time</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">{estimatedTime} minutes</p>
          <p className="text-sm text-blue-600 mt-1">We'll notify the kitchen immediately</p>
        </motion.div>

        {/* Receipt Info */}
        {paymentMethod !== "cash" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Receipt className="w-4 h-4" />
              <span className="text-sm">Receipt sent to your email</span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="space-y-3"
        >
          <Link href={`/qr/${params.tableId}/feedback?order=${orderNumber}`}>
            <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 h-12">
              <Star className="w-4 h-4 mr-2" />
              Rate Your Experience
            </Button>
          </Link>

          <Link href={`/qr/${params.tableId}`}>
            <Button variant="ghost" className="w-full text-gray-600 hover:bg-gray-50 h-12">
              Order More Items
            </Button>
          </Link>
        </motion.div>

        {/* Thank You Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">Enjoy your meal! 🍽️</p>
        </motion.div>
      </div>
    </div>
  )
}

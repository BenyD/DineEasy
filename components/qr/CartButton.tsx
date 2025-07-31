"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Sparkles, Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatAmountWithCurrency } from "@/lib/utils/currency";

interface CartButtonProps {
  totalItems: number;
  totalPrice: number;
  tableId: string;
  currency?: string;
  disabled?: boolean;
}

export function CartButton({
  totalItems,
  totalPrice,
  tableId,
  currency = "CHF",
  disabled = false,
}: CartButtonProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50">
      <Link
        href={disabled ? "#" : `/qr/${tableId}/cart`}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border h-14 sm:h-16 px-4 sm:px-6 flex items-center gap-3 sm:gap-4 transition-all duration-200 ${
            disabled
              ? "bg-gray-400 text-gray-600 border-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white border-green-200"
          }`}
        >
          <div className="relative">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />

              {/* Cart badge */}
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
                {totalItems}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start flex-1">
            <span className="text-xs sm:text-sm font-medium">View Cart</span>
            <span className="font-bold text-base sm:text-lg">
              {formatAmountWithCurrency(totalPrice, currency)}
            </span>
          </div>

          <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

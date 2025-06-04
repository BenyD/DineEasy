"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CartButtonProps {
  totalItems: number;
  totalPrice: number;
  tableId: string;
}

export function CartButton({
  totalItems,
  totalPrice,
  tableId,
}: CartButtonProps) {
  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent"
      >
        <Link href={`/qr/${tableId}/cart`}>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-16 rounded-2xl"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <motion.div
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                  >
                    {totalItems}
                  </motion.div>
                </div>
                <span className="font-semibold text-lg">View Cart</span>
              </div>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-bold text-xl"
              >
                CHF {totalPrice.toFixed(2)}
              </motion.span>
            </div>
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

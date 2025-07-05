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
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-white via-white/95 to-transparent"
      >
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href={`/qr/${tableId}/cart`}>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-16 rounded-2xl relative overflow-hidden group"
            >
              <motion.div
                initial={false}
                animate={{
                  x: [-4, 4, -4],
                  rotate: [-2, 2, -2],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 group-hover:skew-x-12 transition-transform duration-700"
              />
              <div className="flex items-center justify-between w-full relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ShoppingCart className="w-7 h-7" />
                    <motion.div
                      key={totalItems}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md"
                    >
                      {totalItems}
                    </motion.div>
                  </div>
                  <span className="font-semibold text-lg">View Cart</span>
                </div>
                <div className="flex flex-col items-end">
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-bold text-2xl"
                  >
                    CHF {totalPrice.toFixed(2)}
                  </motion.span>
                  <span className="text-xs text-white/80">Tap to checkout</span>
                </div>
              </div>
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

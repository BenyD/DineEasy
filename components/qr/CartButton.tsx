"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ChevronRight } from "lucide-react";
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
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-gradient-to-t from-white via-white/95 to-transparent"
      >
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        >
          <Link href={`/qr/${tableId}/cart`}>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-20 rounded-2xl relative overflow-hidden group"
            >
              {/* Animated background shine effect */}
              <motion.div
                initial={false}
                animate={{
                  x: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              <div className="relative flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="bg-white/10 p-3 rounded-xl"
                    >
                      <ShoppingCart className="w-8 h-8" />
                      <motion.div
                        key={totalItems}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg"
                      >
                        {totalItems}
                      </motion.div>
                    </motion.div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-lg">View Cart</span>
                    <span className="text-sm text-white/80">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <motion.span
                      key={totalPrice}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-bold text-2xl"
                    >
                      CHF {totalPrice.toFixed(2)}
                    </motion.span>
                    <span className="text-xs text-white/80">
                      Tap to checkout
                    </span>
                  </div>
                  <motion.div
                    animate={{
                      x: [0, 4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronRight className="w-6 h-6 text-white/80" />
                  </motion.div>
                </div>
              </div>
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CartButtonProps {
  totalItems: number
  totalPrice: number
  tableId: string
}

export function CartButton({ totalItems, totalPrice, tableId }: CartButtonProps) {
  if (totalItems === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-white via-white to-transparent"
      >
        <Link href={`/qr/${tableId}/cart`}>
          <Button
            size="lg"
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <motion.div
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                  >
                    {totalItems}
                  </motion.div>
                </div>
                <span className="font-medium">View Cart</span>
              </div>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-bold text-lg"
              >
                CHF {totalPrice.toFixed(2)}
              </motion.span>
            </div>
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}

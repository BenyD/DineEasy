"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MenuItem } from "@/types"

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
  cartQuantity: number
  onUpdateQuantity: (id: string, quantity: number) => void
  index: number
}

export function MenuItemCard({ item, onAddToCart, cartQuantity, onUpdateQuantity, index }: MenuItemCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    onAddToCart(item)

    // Brief animation delay
    setTimeout(() => setIsAdding(false), 300)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onUpdateQuantity(item.id, 0)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-white rounded-xl border shadow-xs overflow-hidden transition-all duration-200 ${
        cartQuantity > 0
          ? "border-green-200 shadow-md ring-1 ring-green-100"
          : "border-gray-200 hover:shadow-md hover:border-gray-300"
      } ${!item.available ? "opacity-60" : ""}`}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">{item.name}</h3>
            <span className="font-bold text-gray-900 text-sm sm:text-base ml-2">CHF {item.price.toFixed(2)}</span>
          </div>

          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{item.description}</p>

          {/* Add to Cart Controls */}
          {item.available && (
            <div className="flex items-center justify-between">
              {cartQuantity === 0 ? (
                <Button
                  onClick={handleAdd}
                  disabled={isAdding}
                  size="sm"
                  className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 h-8 text-xs font-medium"
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleQuantityChange(cartQuantity - 1)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 border-green-200 hover:bg-green-50"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <motion.span
                    key={cartQuantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-semibold text-green-700 min-w-6 text-center"
                  >
                    {cartQuantity}
                  </motion.span>

                  <Button
                    onClick={() => handleQuantityChange(cartQuantity + 1)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 border-green-200 hover:bg-green-50"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

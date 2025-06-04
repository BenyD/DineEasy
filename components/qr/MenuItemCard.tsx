"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem & { tags?: string[] };
  onAddToCart: (item: MenuItem) => void;
  cartQuantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  index: number;
}

export function MenuItemCard({
  item,
  onAddToCart,
  cartQuantity,
  onUpdateQuantity,
  index,
}: MenuItemCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    onAddToCart(item);

    // Brief animation delay
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onUpdateQuantity(item.id, 0);
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
        cartQuantity > 0
          ? "border-green-200 shadow-lg ring-2 ring-green-100"
          : "border-gray-200 hover:shadow-lg hover:border-gray-300"
      } ${!item.available ? "opacity-60" : ""}`}
    >
      <div className="flex gap-4 p-4">
        {/* Enhanced Image */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Sold Out
              </Badge>
            </div>
          )}
          {item.tags?.includes("Popular") && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Popular
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                {item.name}
              </h3>
              <div className="flex gap-1 mt-1">
                {item.tags
                  ?.filter((tag) => tag !== "Popular")
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
            <span className="font-bold text-gray-900 text-base sm:text-lg ml-2">
              CHF {item.price.toFixed(2)}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Enhanced Add to Cart Controls */}
          {item.available && (
            <div className="flex items-center justify-between">
              {cartQuantity === 0 ? (
                <Button
                  onClick={handleAdd}
                  disabled={isAdding}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 h-10 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
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
                    className="w-10 h-10 p-0 border-green-200 hover:bg-green-50 rounded-full"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <motion.span
                    key={cartQuantity}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-green-700 min-w-[2rem] text-center text-lg"
                  >
                    {cartQuantity}
                  </motion.span>

                  <Button
                    onClick={() => handleQuantityChange(cartQuantity + 1)}
                    size="sm"
                    variant="outline"
                    className="w-10 h-10 p-0 border-green-200 hover:bg-green-50 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

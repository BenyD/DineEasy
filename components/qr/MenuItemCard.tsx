"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Clock, AlertCircle } from "lucide-react";
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAdd = async () => {
    setIsAdding(true);
    onAddToCart(item);
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
      className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
        cartQuantity > 0
          ? "border-2 border-green-500 shadow-lg ring-4 ring-green-100"
          : "border border-gray-200 hover:shadow-lg hover:border-gray-300"
      } ${!item.available ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Container */}
        <div className="relative w-full sm:w-56 h-48 sm:h-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0 }}
            className="absolute inset-0"
          >
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              onLoad={() => setIsImageLoaded(true)}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          )}
          {!item.available && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <Badge variant="secondary" className="text-base mb-2 px-4 py-1">
                Sold Out
              </Badge>
              <p className="text-sm text-gray-600 font-medium">
                Currently unavailable
              </p>
            </div>
          )}
          {item.tags?.includes("Popular") && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium px-3 py-1 shadow-sm">
                Popular Choice
              </Badge>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold text-gray-900 mb-2"
              >
                {item.name}
              </motion.h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.tags
                  ?.filter((tag) => tag !== "Popular")
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-green-50 text-green-700 font-medium px-2.5 py-0.5 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
            <div className="text-right">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
              >
                CHF {item.price.toFixed(2)}
              </motion.span>
            </div>
          </div>

          <p className="text-gray-600 text-base mb-4 flex-grow leading-relaxed">
            {item.description}
          </p>

          {/* Item Details */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {item.preparationTime && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {item.preparationTime} min prep
                </span>
              </div>
            )}
            {item.allergens?.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 font-medium">
                  Contains: {item.allergens.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Controls */}
          {item.available && (
            <div className="flex items-center justify-between mt-2">
              <AnimatePresence mode="wait">
                {cartQuantity === 0 ? (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <Button
                      ref={buttonRef}
                      onClick={handleAdd}
                      disabled={isAdding}
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 h-14 rounded-xl group overflow-hidden relative"
                    >
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {isAdding ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" />
                          <span className="font-medium text-lg">
                            Add to Cart
                          </span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="quantity"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-6 w-full"
                  >
                    <Button
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      variant="outline"
                      size="lg"
                      className="w-14 h-14 p-0 border-green-200 hover:bg-green-50 rounded-xl"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>

                    <motion.span
                      key={cartQuantity}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="font-bold text-green-700 text-3xl min-w-[3rem] text-center"
                    >
                      {cartQuantity}
                    </motion.span>

                    <Button
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      variant="outline"
                      size="lg"
                      className="w-14 h-14 p-0 border-green-200 hover:bg-green-50 rounded-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

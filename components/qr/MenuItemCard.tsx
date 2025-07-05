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
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        cartQuantity > 0
          ? "border-green-200 shadow-lg ring-2 ring-green-100"
          : "border-gray-200 hover:shadow-lg hover:border-gray-300"
      } ${!item.available ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Container */}
        <div className="relative w-full sm:w-48 h-48 sm:h-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0 }}
            className="absolute inset-0 bg-gray-100"
          >
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              onLoad={() => setIsImageLoaded(true)}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          {!item.available && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Badge variant="secondary" className="text-base mb-2">
                Sold Out
              </Badge>
              <p className="text-sm text-gray-600">Currently unavailable</p>
            </div>
          )}
          {item.tags?.includes("Popular") && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-orange-500 text-white font-medium px-3 py-1">
                Popular Choice
              </Badge>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {item.name}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {item.tags
                  ?.filter((tag) => tag !== "Popular")
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-green-50 text-green-700 font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                CHF {item.price.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-base mb-4 flex-grow">
            {item.description}
          </p>

          {/* Item Details */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {item.preparationTime && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{item.preparationTime} min prep</span>
              </div>
            )}
            {item.allergens?.length > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>Contains: {item.allergens.join(", ")}</span>
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
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 h-12 rounded-xl"
                    >
                      {isAdding ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="quantity"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 w-full"
                  >
                    <Button
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      variant="outline"
                      size="lg"
                      className="w-12 h-12 p-0 border-green-200 hover:bg-green-50 rounded-xl"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>

                    <motion.span
                      key={cartQuantity}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="font-bold text-green-700 text-2xl min-w-[3rem] text-center"
                    >
                      {cartQuantity}
                    </motion.span>

                    <Button
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      variant="outline"
                      size="lg"
                      className="w-12 h-12 p-0 border-green-200 hover:bg-green-50 rounded-xl"
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

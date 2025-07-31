"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Clock, AlertCircle, Star, Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { MenuItem } from "@/types";
import { getTagInfo } from "@/lib/constants/menu-tags";
import { formatAmountWithCurrency } from "@/lib/utils/currency";

interface MenuItemCardProps {
  item: MenuItem & { tags?: string[] };
  onAddToCart: (item: MenuItem) => void;
  cartQuantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  index: number;
  isVisible?: boolean;
}

export function MenuItemCard({
  item,
  onAddToCart,
  cartQuantity,
  onUpdateQuantity,
  index,
  isVisible = true,
}: MenuItemCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAdd = async () => {
    if (!item.available) {
      return; // Don't allow adding unavailable items
    }

    setIsAdding(true);
    onAddToCart(item);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!item.available) {
      return; // Don't allow quantity changes for unavailable items
    }

    if (newQuantity <= 0) {
      onUpdateQuantity(item.id, 0);
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Get tags to display (combine item tags with popular if applicable)
  const displayTags = [
    ...(item.tags || []),
    ...(item.popular ? ["popular"] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 ${
        cartQuantity > 0
          ? "border-green-500 ring-1 ring-green-200"
          : "hover:border-gray-300"
      } ${!item.available ? "opacity-75" : ""}`}
      data-item-id={item.id}
      role="article"
      aria-labelledby={`item-name-${item.id}`}
      aria-describedby={`item-description-${item.id}`}
    >
      {!item.available && (
        <div
          className="absolute inset-0 bg-gray-900/20 flex items-center justify-center z-10"
          aria-label="Item unavailable"
        >
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Unavailable
          </div>
        </div>
      )}

      {isVisible && (
        <div className="flex flex-col lg:flex-row">
          {/* Image Container - Full height on tablets */}
          <div className="relative w-full lg:w-64 h-48 lg:h-auto lg:min-h-[200px] overflow-hidden">
            <ImageWithFallback
              src={item.image}
              alt={`${item.name} - ${item.description || "Menu item"}`}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              showLoadingState={true}
              loadingClassName="bg-gray-100"
            />

            {/* Tags overlay */}
            {displayTags.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                {displayTags.map((tag) => {
                  const tagInfo = getTagInfo(tag);
                  return (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`text-xs px-2 py-1 ${
                        tag === "popular"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {tagInfo.icon && (
                        <span className="mr-1">{tagInfo.icon}</span>
                      )}
                      {tagInfo.label}
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Popular badge */}
            {item.popular && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      id={`item-name-${item.id}`}
                      className="text-lg lg:text-xl font-bold text-gray-900 mb-1 line-clamp-2"
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p
                        id={`item-description-${item.id}`}
                        className="text-sm text-gray-600 line-clamp-3 mb-3"
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg lg:text-xl font-bold text-gray-900">
                      {formatAmountWithCurrency(item.price, "CHF")}
                    </div>
                  </div>
                </div>

                {/* Preparation time */}
                {item.preparationTime && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{item.preparationTime} min</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {cartQuantity === 0 ? (
                  <Button
                    ref={buttonRef}
                    onClick={handleAdd}
                    disabled={!item.available || isAdding}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    aria-label={`Add ${item.name} to cart`}
                    aria-describedby={
                      !item.available
                        ? `item-unavailable-${item.id}`
                        : undefined
                    }
                  >
                    {isAdding ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      disabled={!item.available}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 p-0"
                      aria-label={`Remove one ${item.name} from cart`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span
                      className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center"
                      aria-label={`${cartQuantity} ${item.name} in cart`}
                    >
                      {cartQuantity}
                    </span>
                    <Button
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      disabled={!item.available}
                      variant="outline"
                      size="sm"
                      className="w-10 h-10 p-0"
                      aria-label={`Add one more ${item.name} to cart`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader only text for unavailable items */}
      {!item.available && (
        <div id={`item-unavailable-${item.id}`} className="sr-only">
          This item is currently unavailable and cannot be added to your cart.
        </div>
      )}
    </motion.div>
  );
}

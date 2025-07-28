"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Clock, AlertCircle, Star, Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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
  const [isHovered, setIsHovered] = useState(false);
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

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const getTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "popular":
        return <Star className="w-3 h-3" />;
      case "spicy":
        return <Zap className="w-3 h-3" />;
      case "vegetarian":
      case "vegan":
        return <Leaf className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "popular":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "spicy":
        return "bg-red-100 text-red-700 border-red-200";
      case "vegetarian":
        return "bg-green-100 text-green-700 border-green-200";
      case "vegan":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "gluten-free":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

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
    >
      <div className="flex flex-col lg:flex-row">
        {/* Image Container - Full height on tablets */}
        <div className="relative w-full lg:w-64 h-48 lg:h-auto lg:min-h-[200px] overflow-hidden">
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            showLoadingState={true}
            loadingClassName="bg-gray-100"
            errorClassName="bg-gray-100"
          />

          {!item.available && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center">
              <Badge
                variant="secondary"
                className="mb-2 bg-red-100 text-red-700 border-red-200 text-xs"
              >
                Sold Out
              </Badge>
              <p className="text-xs text-gray-600 font-medium text-center px-4">
                Currently unavailable
              </p>
            </div>
          )}

          {/* Tags - Optimized for tablets */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.tags?.slice(0, 2).map((tag, tagIndex) => (
              <Badge
                key={tag}
                variant="outline"
                className={`${getTagColor(tag)} font-medium text-xs flex items-center gap-1 px-2 py-1`}
              >
                {getTagIcon(tag)}
                <span className="hidden md:inline">{tag}</span>
              </Badge>
            ))}
            {item.tags && item.tags.length > 2 && (
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 border-gray-200 font-medium text-xs px-2 py-1"
              >
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Container - Optimized for tablets */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col">
          {/* Header with price - Moved price to header for tablets */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2 leading-tight line-clamp-2">
                {item.name}
              </h3>
            </div>

            {/* Price - Repositioned for better tablet UX */}
            <div className="flex-shrink-0">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <span className="text-lg lg:text-xl font-bold text-green-600">
                  CHF {item.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm lg:text-base mb-4 flex-grow leading-relaxed line-clamp-3">
            {item.description}
          </p>

          {/* Item Details - Optimized for tablets */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs lg:text-sm">
            {item.preparationTime && (
              <div className="flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">
                  {item.preparationTime} min
                </span>
              </div>
            )}
            {item.allergens?.length > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  {item.allergens.length} allergen
                  {item.allergens.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Controls - Optimized for tablets */}
          {item.available && (
            <div className="flex items-center justify-between mt-auto">
              <AnimatePresence mode="wait">
                {cartQuantity === 0 ? (
                  <Button
                    ref={buttonRef}
                    onClick={handleAdd}
                    disabled={isAdding}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 lg:h-14 text-sm lg:text-base font-medium"
                  >
                    {isAdding ? (
                      <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span>Add to Cart</span>
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <Button
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      variant="outline"
                      size="lg"
                      className="w-12 h-12 lg:w-14 lg:h-14 p-0 border-gray-300 hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>

                    <span className="font-bold text-green-700 text-xl lg:text-2xl min-w-[3rem] lg:min-w-[3.5rem] text-center">
                      {cartQuantity}
                    </span>

                    <Button
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      variant="outline"
                      size="lg"
                      className="w-12 h-12 lg:w-14 lg:h-14 p-0 border-gray-300 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

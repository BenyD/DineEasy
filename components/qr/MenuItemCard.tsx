"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Clock, AlertCircle, Star, Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { MenuItem } from "@/types";
import { getTagInfo } from "@/lib/constants/menu-tags";

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
          />

          {/* Tags overlay */}
          {displayTags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
              {displayTags.slice(0, 3).map((tag) => {
                const tagInfo = getTagInfo(tag);
                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`text-xs ${tagInfo.color} backdrop-blur-sm bg-white/90`}
                  >
                    <span className="mr-1">{tagInfo.icon}</span>
                    {tagInfo.label}
                  </Badge>
                );
              })}
              {displayTags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-100 text-gray-700 border-gray-200 backdrop-blur-sm"
                >
                  +{displayTags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Popular badge */}
          {item.popular && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            </div>
          )}

          {/* Unavailable overlay */}
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <AlertCircle className="w-4 h-4 mr-1" />
                Unavailable
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg lg:text-xl font-bold text-gray-900">
                  ${item.price.toFixed(2)}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.preparationTime} min
                </div>
              </div>
            </div>

            {/* Tags */}
            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayTags.map((tag) => {
                  const tagInfo = getTagInfo(tag);
                  return (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-xs ${tagInfo.color}`}
                    >
                      <span className="mr-1">{tagInfo.icon}</span>
                      {tagInfo.label}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-between">
            {cartQuantity > 0 ? (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(cartQuantity - 1)}
                  className="w-8 h-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">
                  {cartQuantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(cartQuantity + 1)}
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAdd}
                disabled={!item.available || isAdding}
                className="bg-green-600 hover:bg-green-700 text-white"
                ref={buttonRef}
              >
                {isAdding ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

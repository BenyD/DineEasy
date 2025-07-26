"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  CheckCircle,
  XCircle,
  MoreVertical,
  Pencil,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Tag,
  Clock,
  DollarSign,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type MenuItemAllergen } from "@/types";

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    preparationTime: number;
    available: boolean;
    popular: boolean;
    categoryId: string;
    allergens: MenuItemAllergen[];
  };
  category?: {
    id: string;
    name: string;
  };
  viewMode?: "grid" | "list";
  isSelected?: boolean;
  showCheckbox?: boolean;
  currencySymbol: string;
  onSelect?: (itemId: string, selected: boolean) => void;
  onEdit: (item: any) => void;
  onDuplicate: (item: any) => void;
  onToggleAvailability: (item: any) => Promise<void>;
  onTogglePopular: (item: any) => Promise<void>;
  onDelete: (item: any) => void;
}

const imageHoverVariants = {
  hover: {
    scale: 1.08,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const cardHoverVariants = {
  hover: {
    y: -4,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export function MenuItemCard({
  item,
  category,
  viewMode = "grid",
  isSelected = false,
  showCheckbox = false,
  currencySymbol,
  onSelect,
  onEdit,
  onDuplicate,
  onToggleAvailability,
  onTogglePopular,
  onDelete,
}: MenuItemCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get image source
  const getImageSrc = () => {
    if (imageError || !item.image || item.image === "/placeholder.svg") {
      return "/placeholder.svg";
    }
    return item.image;
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Common dropdown items for both grid and list views
  const commonDropdownItems = (
    <>
      <DropdownMenuItem
        onClick={() => onEdit(item)}
        className="hover:bg-green-50 focus:bg-green-50"
      >
        <Pencil className="w-4 h-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDuplicate(item)}
        className="hover:bg-green-50 focus:bg-green-50"
      >
        <Copy className="w-4 h-4 mr-2" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={async () => {
          try {
            setIsLoading(true);
            await onToggleAvailability(item);
          } finally {
            setIsLoading(false);
          }
        }}
        className="hover:bg-green-50 focus:bg-green-50"
        disabled={isLoading}
      >
        {item.available ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Mark as Unavailable
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Mark as Available
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={async () => {
          try {
            setIsLoading(true);
            await onTogglePopular(item);
          } finally {
            setIsLoading(false);
          }
        }}
        className="hover:bg-green-50 focus:bg-green-50"
        disabled={isLoading}
      >
        {item.popular ? (
          <>
            <Star className="w-4 h-4 mr-2" />
            Remove Popular Tag
          </>
        ) : (
          <>
            <Star className="w-4 h-4 mr-2" />
            Mark as Popular
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(item)}
        className="text-red-600 hover:bg-red-50 focus:bg-red-50"
        disabled={isLoading}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </>
  );

  if (viewMode === "grid") {
    return (
      <motion.div
        className={cn(
          "group relative",
          "hover:shadow-xl border border-gray-200/60 relative bg-white/50 backdrop-blur-sm",
          !item.available && "opacity-75 grayscale",
          isSelected && "ring-2 ring-green-500 ring-offset-2",
          "hover:border-green-300/60"
        )}
        variants={cardHoverVariants}
        whileHover="hover"
      >
        <Card className="overflow-hidden h-full">
          {showCheckbox && (
            <motion.div
              className="absolute top-3 left-3 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect?.(item.id, checked as boolean)
                }
                className="bg-white/95 border-2 rounded-md shadow-lg"
              />
            </motion.div>
          )}

          <motion.div
            className="relative aspect-[4/3] overflow-hidden"
            whileHover="hover"
          >
            {/* Image Loading State */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* Image */}
            <motion.img
              src={getImageSrc()}
              alt={item.name}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              variants={imageHoverVariants}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* Image Error State */}
            {imageError && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Image unavailable</p>
                </div>
              </div>
            )}

            {/* Status badges */}
            <motion.div
              className="absolute top-3 right-3 flex flex-col gap-2"
              initial={{ opacity: 0, x: 20 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {item.popular && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-none shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              <Badge
                variant={item.available ? "default" : "secondary"}
                className={cn(
                  "border-none shadow-lg",
                  item.available
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
                )}
              >
                {item.available ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Unavailable
                  </>
                )}
              </Badge>
            </motion.div>

            {/* Category badge */}
            <motion.div
              className="absolute bottom-3 left-3"
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="bg-white/90 text-gray-700 border-none shadow-lg backdrop-blur-sm">
                <Tag className="w-3 h-3 mr-1" />
                {category?.name || "Uncategorized"}
              </Badge>
            </motion.div>
          </motion.div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 text-gray-900 group-hover:text-green-700 transition-colors">
                    {item.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-green-50 hover:text-green-700 transition-colors"
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {commonDropdownItems}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                  {item.description || "No description provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{item.preparationTime} min</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {currencySymbol}
                  {item.price.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.allergens?.length > 0 ? (
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        {item.allergens.length} Allergen
                        {item.allergens.length !== 1 && "s"}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      align="start"
                      className="w-auto p-4 bg-white border shadow-xl rounded-xl"
                      sideOffset={8}
                    >
                      <div className="flex flex-wrap gap-2">
                        {item.allergens.map((allergen) => (
                          <Badge
                            key={allergen.id}
                            variant="outline"
                            className="text-xs bg-green-50/70 hover:bg-green-100/70 border-green-200 transition-colors"
                          >
                            <span className="text-base mr-1">
                              {allergen.icon}
                            </span>
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs border-dashed text-gray-400"
                  >
                    No Allergens
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      className="group relative w-full"
      variants={cardHoverVariants}
      whileHover="hover"
    >
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex gap-6">
            {showCheckbox && (
              <div className="flex items-start pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelect?.(item.id, checked as boolean)
                  }
                  className="bg-white/95 border-2 rounded-md shadow-lg"
                />
              </div>
            )}

            <div className="relative w-[140px] h-[140px] rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
              {/* Image Loading State */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              )}

              {/* Image */}
              <motion.img
                src={getImageSrc()}
                alt={item.name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {/* Image Error State */}
              {imageError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Image unavailable</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <h3 className="font-bold text-xl leading-tight text-gray-900 group-hover:text-green-700 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex gap-2">
                      {item.popular && (
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-none shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      <Badge
                        variant={item.available ? "default" : "secondary"}
                        className={cn(
                          "border-none shadow-lg",
                          item.available
                            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
                        )}
                      >
                        {item.available ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Unavailable
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-gray-600 leading-relaxed line-clamp-2">
                      {item.description || "No description provided"}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge
                        variant="outline"
                        className="bg-gray-50/70 border-gray-200"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {category?.name || "Uncategorized"}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{item.preparationTime} min</span>
                      </div>
                    </div>

                    {item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.allergens.map((allergen) => (
                          <Badge
                            key={allergen.id}
                            variant="outline"
                            className="bg-green-50/70 text-green-700 border-green-200/70 text-xs px-2 py-1 flex items-center gap-1.5 transition-colors hover:bg-green-100/70"
                          >
                            <span className="text-sm">{allergen.icon}</span>
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-green-50 hover:text-green-700 transition-colors"
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {commonDropdownItems}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="text-right">
                    <div className="font-bold text-3xl text-green-600 mb-1">
                      {currencySymbol}
                      {item.price.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">per item</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

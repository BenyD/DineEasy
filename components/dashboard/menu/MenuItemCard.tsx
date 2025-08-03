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
  Utensils,
  Ruler,
  Layers,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type MenuItemAllergen } from "@/types";
import { getTagInfo, MENU_TAGS } from "@/lib/constants/menu-tags";

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
    tags?: string[];
    // Advanced options
    sizes?: Array<{
      id: string;
      name: string;
      priceModifier: number;
      isDefault: boolean;
    }>;
    modifiers?: Array<{
      id: string;
      name: string;
      type: string;
      priceModifier: number;
      isRequired: boolean;
    }>;
    hasAdvancedOptions?: boolean;
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

  // Helper function to format preparation time
  const formatPreparationTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
      } else {
        return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
      }
    } else {
      return `${minutes} min`;
    }
  };

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

  // Determine vegetarian status
  const getVegetarianStatus = () => {
    if (!item.tags || item.tags.length === 0) {
      return {
        status: "unknown",
        label: "Unknown",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: "❓",
      };
    }

    if (item.tags.includes(MENU_TAGS.VEGETARIAN_STATUS.VEGAN)) {
      return {
        status: "vegan",
        label: "Vegan",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: "🌱",
      };
    }

    if (item.tags.includes(MENU_TAGS.VEGETARIAN_STATUS.VEGETARIAN)) {
      return {
        status: "vegetarian",
        label: "Vegetarian",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: "🥬",
      };
    }

    if (item.tags.includes(MENU_TAGS.VEGETARIAN_STATUS.NON_VEGETARIAN)) {
      return {
        status: "non-vegetarian",
        label: "Non-Vegetarian",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: "🥩",
      };
    }

    // Default to non-vegetarian if no specific tag is found
    return {
      status: "non-vegetarian",
      label: "Non-Vegetarian",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: "🥩",
    };
  };

  const vegetarianStatus = getVegetarianStatus();

  // Filter tags for display (exclude vegetarian status tags)
  const getDisplayTags = () => {
    if (!item.tags || item.tags.length === 0) return [];

    const vegetarianStatusTags = [
      MENU_TAGS.VEGETARIAN_STATUS.VEGAN,
      MENU_TAGS.VEGETARIAN_STATUS.VEGETARIAN,
      MENU_TAGS.VEGETARIAN_STATUS.NON_VEGETARIAN,
    ];
    return item.tags.filter(
      (tag) => !vegetarianStatusTags.includes(tag as any)
    );
  };

  const displayTags = getDisplayTags();

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
          "bg-white border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden",
          !item.available && "opacity-70 grayscale",
          isSelected && "ring-2 ring-green-500 ring-offset-2"
        )}
        variants={cardHoverVariants}
        whileHover="hover"
        onClick={() => {
          if (showCheckbox && onSelect) {
            onSelect(item.id, !isSelected);
          }
        }}
        style={{ cursor: showCheckbox ? "pointer" : "default" }}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-xl">
          {/* Checkbox for bulk mode */}
          {showCheckbox && (
            <motion.div
              className="absolute top-3 left-3 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect?.(item.id, checked as boolean)
                }
                className="w-5 h-5 bg-white/95 border-2 border-green-500 rounded-md shadow-lg data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white"
              />
            </motion.div>
          )}

          {/* Status badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {/* Mandatory Vegetarian Status */}
            <Badge
              className={cn(
                "px-2 py-1 text-xs font-semibold border-none shadow-md",
                vegetarianStatus.color
              )}
            >
              <span className="text-sm mr-1">{vegetarianStatus.icon}</span>
              {vegetarianStatus.label}
            </Badge>

            {item.popular && (
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none shadow-md px-2 py-1 text-xs font-semibold">
                <Sparkles className="w-3 h-3 mr-1" /> Popular
              </Badge>
            )}
            <Badge
              className={cn(
                "px-2 py-1 text-xs font-semibold border-none shadow-md",
                item.available
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {item.available ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" /> Available
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" /> Unavailable
                </>
              )}
            </Badge>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="bg-white/90 text-gray-700 border border-gray-200 shadow-sm px-2 py-1 text-xs font-medium">
              <Utensils className="w-3 h-3 mr-1" />
              {category?.name || "Uncategorized"}
            </Badge>
          </div>

          {/* Image */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
          <img
            src={getImageSrc()}
            alt={item.name}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-5 flex flex-col gap-3">
          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg line-clamp-1 text-gray-900 group-hover:text-green-700 transition-colors">
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

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {item.description || "No description provided"}
          </p>

          {/* Big Price */}
          <div className="text-2xl font-bold text-green-600">
            {currencySymbol}
            {item.price.toFixed(2)}
          </div>

          {/* Footer: Allergens and Prep Time */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            {/* Allergens */}
            <div className="flex-1">
              {item.allergens?.length > 0 ? (
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium border-green-200 bg-green-50/70 hover:bg-green-100/70 text-green-700 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {item.allergens.length} Allergen
                      {item.allergens.length !== 1 && "s"}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    side="top"
                    className="w-auto p-3 bg-white border border-gray-200 shadow-lg rounded-lg"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        Allergens:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.allergens && item.allergens.length > 0 ? (
                          item.allergens.map((allergen, index) => (
                            <Badge
                              key={allergen.id || `allergen-${index}`}
                              variant="outline"
                              className="text-xs bg-green-50/70 hover:bg-green-100/70 border-green-200 transition-colors"
                            >
                              <span className="text-base mr-1">
                                {allergen.icon || "⚠️"}
                              </span>
                              {allergen.name || `Allergen ${index + 1}`}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            No allergens listed
                          </span>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs border-dashed text-gray-400 px-3 py-1"
                >
                  No Allergens
                </Badge>
              )}
            </div>

            {/* Preparation Time */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatPreparationTime(item.preparationTime)}</span>
            </div>
          </div>

          {/* Tags Row */}
          {displayTags.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {displayTags.slice(0, 4).map((tag) => {
                  const tagInfo = getTagInfo(tag);
                  return (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "text-xs px-1.5 py-0.5 border opacity-75",
                        tagInfo.color
                      )}
                    >
                      <span className="text-xs mr-1">{tagInfo.icon}</span>
                      {tagInfo.label}
                    </Badge>
                  );
                })}
                {displayTags.length > 4 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-500 border-gray-200 opacity-75"
                  >
                    +{displayTags.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          {(item.sizes && item.sizes.length > 0) ||
          (item.modifiers && item.modifiers.length > 0) ||
          item.hasAdvancedOptions ? (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Advanced Options
                </span>
              </div>

              <div className="space-y-2">
                {/* Size Variations */}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-gray-600">Sizes:</span>
                    <div className="flex gap-1">
                      {item.sizes.slice(0, 3).map((size) => (
                        <Badge
                          key={size.id}
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-0.5",
                            size.isDefault
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                          )}
                        >
                          {size.name}
                          {size.priceModifier > 0 &&
                            ` +${currencySymbol}${size.priceModifier}`}
                        </Badge>
                      ))}
                      {item.sizes.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-600"
                        >
                          +{item.sizes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Modifiers */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-gray-600">Modifiers:</span>
                    <div className="flex gap-1">
                      {item.modifiers.slice(0, 3).map((modifier) => (
                        <Badge
                          key={modifier.id}
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-0.5",
                            modifier.isRequired
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-purple-50 border-purple-200 text-purple-700"
                          )}
                        >
                          {modifier.name}
                          {modifier.priceModifier > 0 &&
                            ` +${currencySymbol}${modifier.priceModifier}`}
                        </Badge>
                      ))}
                      {item.modifiers.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 bg-gray-50 border-gray-200 text-gray-600"
                        >
                          +{item.modifiers.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      className="group relative w-full"
      variants={cardHoverVariants}
      whileHover="hover"
      onClick={() => {
        if (showCheckbox && onSelect) {
          onSelect(item.id, !isSelected);
        }
      }}
      style={{ cursor: showCheckbox ? "pointer" : "default" }}
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
                  className="w-5 h-5 bg-white/95 border-2 border-green-500 rounded-md shadow-lg data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white"
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
                      {/* Mandatory Vegetarian Status */}
                      <Badge
                        className={cn(
                          "border-none shadow-lg font-semibold",
                          vegetarianStatus.color
                        )}
                      >
                        <span className="text-sm mr-1">
                          {vegetarianStatus.icon}
                        </span>
                        {vegetarianStatus.label}
                      </Badge>

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
                        <Utensils className="w-3 h-3 mr-1" />
                        {category?.name || "Uncategorized"}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatPreparationTime(item.preparationTime)}
                        </span>
                      </div>

                      {/* Tags (Subtle) */}
                      {displayTags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <div className="flex gap-0.5">
                            {displayTags.slice(0, 3).map((tag) => {
                              const tagInfo = getTagInfo(tag);
                              return (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className={cn(
                                    "text-xs px-1 py-0.5 border opacity-60",
                                    tagInfo.color
                                  )}
                                >
                                  <span className="text-xs mr-0.5">
                                    {tagInfo.icon}
                                  </span>
                                  {tagInfo.label}
                                </Badge>
                              );
                            })}
                            {displayTags.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0.5 bg-gray-50 text-gray-500 border-gray-200 opacity-60"
                              >
                                +{displayTags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {item.allergens.length > 0 ? (
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium border-green-200 bg-green-50/70 hover:bg-green-100/70 text-green-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertCircle className="w-3 h-3" />
                            {item.allergens.length} Allergen
                            {item.allergens.length !== 1 && "s"}
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          align="start"
                          side="top"
                          className="w-auto p-3 bg-white border border-gray-200 shadow-lg rounded-lg"
                          sideOffset={8}
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">
                              Allergens:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.allergens && item.allergens.length > 0 ? (
                                item.allergens.map((allergen, index) => (
                                  <Badge
                                    key={allergen.id || `allergen-${index}`}
                                    variant="outline"
                                    className="text-xs bg-green-50/70 hover:bg-green-100/70 border-green-200 transition-colors"
                                  >
                                    <span className="text-base mr-1">
                                      {allergen.icon || "⚠️"}
                                    </span>
                                    {allergen.name || `Allergen ${index + 1}`}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">
                                  No allergens listed
                                </span>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs border-dashed text-gray-400 px-3 py-1"
                      >
                        No Allergens
                      </Badge>
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

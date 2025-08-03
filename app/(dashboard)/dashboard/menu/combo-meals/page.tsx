"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ComboMealsManager } from "@/components/dashboard/menu/ComboMealsManager";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { getMenuItemsPaginated } from "@/lib/actions/menu";
import { type MenuItem } from "@/types";
import { toast } from "sonner";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ComboMealsPage() {
  const {
    restaurant,
    currencySymbol,
    fetchRestaurant,
    isLoading: restaurantLoading,
  } = useRestaurantSettings();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    // Fetch restaurant data if not already loaded
    if (!restaurant && !restaurantLoading) {
      fetchRestaurant();
    }
  }, [restaurant, restaurantLoading, fetchRestaurant]);

  useEffect(() => {
    if (restaurant?.id && !restaurantLoading) {
      loadMenuItems();
    }
  }, [restaurant?.id, restaurantLoading]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);

      const result = await getMenuItemsPaginated({
        page: 1,
        pageSize: 1000, // Get all menu items for combo selection
        searchTerm: "",
        categoryId: "",
      });

      if (result.success && result.data) {
        setMenuItems(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load menu items");
      }
    } catch (error) {
      console.error("Error loading menu items:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while restaurant is being fetched
  if (restaurantLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Combo Meals Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if restaurant is not found after loading
  if (!restaurant?.id) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Restaurant Not Found
          </h2>
          <p className="text-gray-600">
            Please select a restaurant to manage combo meals.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while menu items are being loaded
  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Combo Meals Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Combo Meals</h1>
          <p className="text-muted-foreground">
            Create and manage pre-built meal combinations with discounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Combo Meal Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Combo Meal
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Add New Combo Meal</p>
                  <p className="text-xs text-muted-foreground">
                    Create a new pre-built meal combination
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Combo Meals Manager */}
      <motion.div variants={itemVariants}>
        <ComboMealsManager
          restaurantId={restaurant.id}
          menuItems={menuItems}
          currencySymbol={currencySymbol}
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
        />
      </motion.div>
    </motion.div>
  );
}

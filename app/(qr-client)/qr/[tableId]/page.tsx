"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/qr/MenuItemCard";
import { CartButton } from "@/components/qr/CartButton";
import { useCart } from "@/hooks/useCart";
import { MenuItem } from "@/types";
import { MapPin, Clock, Star, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTableInfo, getRestaurantMenu } from "@/lib/actions/qr-client";
import { toast } from "sonner";

// Types for real data
interface RestaurantData {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  cuisine?: string;
  opening_hours?: string;
  currency?: string;
}

interface MenuData {
  [category: string]: MenuItem[];
}

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const { cart, addToCart, updateQuantity, getTotalItems, getTotalPrice } =
    useCart();
  const [activeCategory, setActiveCategory] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [menuData, setMenuData] = useState<MenuData>({});
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; items: MenuItem[] }>
  >([]);

  // Load table and menu data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get table info
        const tableResult = await getTableInfo(resolvedParams.tableId);
        if (!tableResult.success) {
          setError(tableResult.error || "Table not found");
          return;
        }

        const tableData = tableResult.data;
        const restaurantData = tableData.restaurants as RestaurantData;
        setRestaurant(restaurantData);

        // Get menu data
        const menuResult = await getRestaurantMenu(restaurantData.id);
        if (!menuResult.success) {
          setError(menuResult.error || "Failed to load menu");
          return;
        }

        const menu = menuResult.data;
        setMenuData(menu);

        // Create categories
        const categoryList = Object.entries(menu).map(
          ([categoryName, items]) => ({
            id: categoryName.toLowerCase(),
            name: categoryName,
            items: items as MenuItem[],
          })
        );

        setCategories(categoryList);

        // Set first category as active
        if (categoryList.length > 0) {
          setActiveCategory(categoryList[0].id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.tableId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Menu
          </h2>
          <p className="text-gray-600">
            Please wait while we load your table's menu...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Menu
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show empty menu state
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Menu Not Available
          </h2>
          <p className="text-gray-600 mb-4">
            This restaurant hasn't set up their menu yet. Please check back
            later or contact the restaurant directly.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Table {resolvedParams.tableId}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-32">
      {/* Enhanced Restaurant Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-5"
          >
            {/* Restaurant Logo */}
            <div className="relative flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5"
              >
                <img
                  src={restaurant?.logo_url || "/placeholder.svg"}
                  alt={restaurant?.name || "Restaurant"}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            </div>

            {/* Restaurant Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-gray-900 leading-tight"
                >
                  {restaurant?.name || "Restaurant"}
                </motion.h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
                    showInfo ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info
                    className={`w-5 h-5 transition-transform ${
                      showInfo ? "text-green-600 rotate-180" : "text-gray-600"
                    }`}
                  />
                </Button>
              </div>

              {restaurant?.cuisine && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {restaurant.cuisine}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {restaurant?.address && (
                          <div className="flex items-center gap-3">
                            <div className="bg-white/80 p-2 rounded-xl shadow-sm">
                              <MapPin className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {restaurant.address}
                            </span>
                          </div>
                        )}
                        {restaurant?.opening_hours && (
                          <div className="flex items-center gap-3">
                            <div className="bg-white/80 p-2 rounded-xl shadow-sm">
                              <Clock className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {restaurant.opening_hours}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className="text-sm border-green-200 text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium"
                >
                  Table {tableData?.number || resolvedParams.tableId}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-sm border-blue-200 text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-medium"
                >
                  Order in Progress
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Category Tabs */}
          <div className="mt-8 -mb-2 flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {categories.map((category, index) => {
              const availableItems = category.items.filter(
                (item) => item.available
              ).length;
              const totalItems = category.items.length;
              const isActive = activeCategory === category.id;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "relative group h-14 px-6 transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-transparent text-white shadow-md hover:shadow-lg"
                        : "hover:bg-green-50 hover:border-green-200 hover:shadow-sm border-2 text-gray-700 hover:text-gray-900"
                    )}
                  >
                    <div className="flex flex-col items-center relative z-10">
                      <span className="font-medium">{category.name}</span>
                      <Badge
                        variant="secondary"
                        className={`mt-1 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {availableItems}/{totalItems}
                      </Badge>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {(() => {
              const activeCategoryData = categories.find(
                (cat) => cat.id === activeCategory
              );
              if (
                !activeCategoryData ||
                activeCategoryData.items.length === 0
              ) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No items in {activeCategoryData?.name || "this category"}
                    </h3>
                    <p className="text-gray-600">
                      Check back later for new menu items.
                    </p>
                  </div>
                );
              }

              return activeCategoryData.items.map((item, index) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  cartQuantity={
                    cart.find((cartItem) => cartItem.id === item.id)
                      ?.quantity || 0
                  }
                  onUpdateQuantity={updateQuantity}
                  index={index}
                />
              ));
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cart Button */}
      <CartButton
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        tableId={resolvedParams.tableId}
      />
    </div>
  );
}

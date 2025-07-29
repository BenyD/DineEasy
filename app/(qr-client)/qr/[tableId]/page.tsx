"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Menu,
  Clock,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/qr/MenuItemCard";
import { CartButton } from "@/components/qr/CartButton";
import { useCart } from "@/hooks/useCart";
import { getTableInfo, getRestaurantMenu } from "@/lib/actions/qr-client";
import type { MenuItem } from "@/types";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function QRClientPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const [tableData, setTableData] = useState<any>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { cart, addToCart, updateQuantity, getTotalItems, getTotalPrice } =
    useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { tableId } = await params;

        // Get table info
        const tableResult = await getTableInfo(tableId);
        if (!tableResult.success) {
          setError(tableResult.error || "Invalid table");
          return;
        }

        const table = tableResult.data;
        setTableData(table);

        console.log("QR Client - Table data loaded:", {
          tableId: table.id,
          restaurantId: table.restaurant_id,
          hasRestaurantData: !!table.restaurants,
        });

        // Get restaurant info from table data
        const restaurantData = table.restaurants;
        if (!restaurantData) {
          setError("Restaurant information not found");
          return;
        }
        setRestaurantData(restaurantData);

        console.log("QR Client - Restaurant data loaded:", {
          restaurantId: restaurantData.id,
          restaurantName: restaurantData.name,
          stripeAccountEnabled: restaurantData.stripe_account_enabled,
          stripeAccountId: restaurantData.stripe_account_id,
          paymentMethods: restaurantData.payment_methods,
        });

        // Validate restaurant ID before fetching menu
        if (
          !restaurantData.id ||
          restaurantData.id === "undefined" ||
          restaurantData.id === "null"
        ) {
          setError("Invalid restaurant ID");
          return;
        }

        // Get menu data using the restaurant ID from table
        const menuResult = await getRestaurantMenu(restaurantData.id);
        if (!menuResult.success) {
          setError(menuResult.error || "Failed to load menu");
          return;
        }

        const menuByCategory = menuResult.data;
        setMenuData(menuByCategory);

        console.log("QR Client - Menu data structure:", {
          type: typeof menuByCategory,
          isArray: Array.isArray(menuByCategory),
          keys: Object.keys(menuByCategory),
          totalCategories: Object.keys(menuByCategory).length,
          sampleCategory: Object.keys(menuByCategory)[0],
          sampleItems:
            menuByCategory[Object.keys(menuByCategory)[0]]?.length || 0,
        });

        // Process menu data into categories
        const processedCategories = Object.entries(menuByCategory).map(
          ([categoryName, items]) => ({
            id: categoryName.toLowerCase().replace(/\s+/g, "-"),
            name: categoryName,
            items: items as MenuItem[],
          })
        );

        setCategories(processedCategories);
        if (processedCategories.length > 0) {
          setActiveCategory(processedCategories[0].id);
        }

        console.log(
          "QR Client - Processed categories:",
          processedCategories.map((cat) => ({
            name: cat.name,
            itemCount: cat.items.length,
          }))
        );
      } catch (error: any) {
        console.error("Error fetching menu items:", error);
        setError("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  // Filter categories based on search query
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  // Get active category data
  const activeCategoryData = categories.find(
    (cat) => cat.id === activeCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load menu
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!menuData || Object.keys(menuData).length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Menu not available
          </h2>
          <p className="text-gray-600 mb-6">
            This restaurant is preparing their menu. Check back later or contact
            them directly.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4" />
            <span>Menu coming soon</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Enhanced Header Section */}
      <div className="bg-white border-b border-gray-200">
        {/* Restaurant Header */}
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          {/* Restaurant Logo and Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center border border-green-200">
              {restaurantData?.logo_url ? (
                <img
                  src={restaurantData.logo_url}
                  alt={restaurantData.name}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover"
                />
              ) : (
                <span className="text-green-600 font-bold text-xl lg:text-2xl">
                  {restaurantData?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {restaurantData?.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  Table {tableData?.number}
                </span>
                {restaurantData?.cuisine && (
                  <span className="text-gray-500">
                    {restaurantData.cuisine.charAt(0).toUpperCase() +
                      restaurantData.cuisine.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 h-10 w-10 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </Button>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-gray-50 border-gray-200 h-12 text-base rounded-xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Restaurant Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Address Section */}
            {restaurantData?.address && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 mb-1">Address</p>
                  <p className="text-gray-600 leading-relaxed">
                    {restaurantData.address}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Section */}
            {(restaurantData?.phone || restaurantData?.email) && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 mb-2">Contact</p>
                  <div className="space-y-1">
                    {restaurantData?.phone && (
                      <p className="text-gray-600 text-sm">
                        {restaurantData.phone}
                      </p>
                    )}
                    {restaurantData?.email && (
                      <p className="text-gray-600 text-sm break-all">
                        {restaurantData.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {restaurantData?.opening_hours && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 mb-1">
                    Opening Hours
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {restaurantData.opening_hours}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {restaurantData?.description && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 mb-1">About</p>
                  <p className="text-gray-600 leading-relaxed">
                    {restaurantData.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Redesigned Category Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 py-4 lg:px-6">
          {/* Category Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Menu Categories
            </h2>
            <span className="text-sm text-gray-500">
              {filteredCategories.length} categories
            </span>
          </div>

          {/* Enhanced Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCategories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? "border-green-500 bg-green-50 ring-2 ring-green-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}

                  {/* Category Content */}
                  <div className="text-center">
                    <h3
                      className={`font-semibold text-sm mb-1 ${
                        isActive ? "text-green-700" : "text-gray-900"
                      }`}
                    >
                      {category.name}
                    </h3>
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      }`}
                    >
                      {category.items.length}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Items Section */}
      <div className="px-4 py-6 lg:px-6 lg:py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? "No items found"
                : `No items in ${activeCategoryData?.name || "this category"}`}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm">
              {searchQuery
                ? "Try adjusting your search terms or browse other categories."
                : "Check back later for new menu items."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 lg:space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                {filteredCategories.length > 1 && (
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                      {category.name}
                    </h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      {category.items.length} items
                    </span>
                  </div>
                )}
                <div className="space-y-4 lg:space-y-6">
                  {category.items.map((item, index) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAddToCart={addToCart}
                      cartQuantity={
                        cart.find((c) => c.id === item.id)?.quantity || 0
                      }
                      onUpdateQuantity={updateQuantity}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <CartButton
          totalItems={getTotalItems()}
          totalPrice={getTotalPrice()}
          tableId={tableData?.id}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Settings,
  Ruler,
  Layers,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/qr/MenuItemCard";
import { CartButton } from "@/components/qr/CartButton";
import { useCart } from "@/hooks/useCart";
import { getTableInfo, getRestaurantMenu } from "@/lib/actions/qr-client";
import { checkRestaurantOpenStatus } from "@/lib/actions/restaurant";
import { useRestaurantWebSocket } from "@/hooks/useRestaurantWebSocket";
import type { MenuItem } from "@/types";

// Extend MenuItem interface for QR client specific needs
interface QRMenuItem extends MenuItem {
  isComboMeal?: boolean;
  comboData?: any;
}
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  items: QRMenuItem[];
}

export default function QRClientPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const [tableData, setTableData] = useState<any>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [comboMeals, setComboMeals] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [restaurantOpenStatus, setRestaurantOpenStatus] = useState<{
    isOpen: boolean;
    autoManaged: boolean;
    currentTime?: string;
    nextOpen?: string;
    nextClose?: string;
  } | null>(null);
  const [urlTableId, setUrlTableId] = useState<string>("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QRMenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const maxRetries = 3;

  const {
    cart,
    addToCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
    showTableChangeWarning,
    confirmTableChange,
    cancelTableChange,
  } = useCart(urlTableId);

  // Debug cart state
  useEffect(() => {
    console.log("Main page cart state:", {
      cartLength: cart.length,
      totalItems: getTotalItems(),
      tableDataId: tableData?.id,
      urlTableId,
      cartTableId: urlTableId,
    });
  }, [cart, getTotalItems, tableData?.id, urlTableId]);

  // Restaurant WebSocket for real-time status updates
  const { isConnected: isRestaurantWebSocketConnected } =
    useRestaurantWebSocket({
      restaurantId: restaurantData?.id,
      onRestaurantStatusChanged: (isOpen, wasOpen) => {
        console.log("Restaurant status changed:", { isOpen, wasOpen });
        setRestaurantOpenStatus((prev) => (prev ? { ...prev, isOpen } : null));

        // Show immediate feedback to user
        if (isOpen) {
          toast.success("Restaurant is now open for orders!");
        } else {
          toast.info(
            "Restaurant is now closed. Orders are no longer accepted."
          );
        }
      },
      enabled: !!restaurantData?.id,
    });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { tableId } = await params;
        setUrlTableId(tableId);

        // Validate table ID format
        if (!tableId || tableId.length < 10) {
          setError("Invalid table QR code. Please scan again.");
          return;
        }

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

        // Check restaurant open status
        const openStatusResult = await checkRestaurantOpenStatus(
          restaurantData.id
        );
        setRestaurantOpenStatus(openStatusResult);

        console.log("QR Client - Restaurant open status:", openStatusResult);

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

        const { menuByCategory, comboMeals: comboMealsData } = menuResult.data;
        setMenuData(menuByCategory);
        setComboMeals(comboMealsData || []);

        console.log("QR Client - Menu data structure:", {
          type: typeof menuByCategory,
          isArray: Array.isArray(menuByCategory),
          keys: Object.keys(menuByCategory),
          totalCategories: Object.keys(menuByCategory).length,
          sampleCategory: Object.keys(menuByCategory)[0],
          sampleItems:
            menuByCategory[Object.keys(menuByCategory)[0]]?.length || 0,
          comboMealsCount: comboMealsData?.length || 0,
        });

        // Process menu data into categories
        const processedCategories = Object.entries(menuByCategory).map(
          ([categoryName, items]) => ({
            id: categoryName.toLowerCase().replace(/\s+/g, "-"),
            name: categoryName,
            items: items as MenuItem[],
          })
        );

        // Add combo meals as a special category if available
        if (comboMealsData && comboMealsData.length > 0) {
          processedCategories.unshift({
            id: "combo-meals",
            name: "Combo Meals",
            items: comboMealsData.map((combo: any) => ({
              id: combo.id,
              name: combo.name,
              description: combo.description,
              price: combo.basePrice * (1 - combo.discountPercentage / 100),
              image: combo.imageUrl || "/placeholder.svg",
              category: "combo-meals",
              available: combo.isAvailable,
              tags: ["combo"],
              allergens: [],
              preparationTime: 20, // Default combo preparation time
              isComboMeal: true,
              comboData: combo,
              // Add missing MenuItem properties
              popular: false,
              categoryId: "combo-meals",
              restaurantId: restaurantData.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })),
          });
        }

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
        setError("Failed to load menu items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  // Debounced search to improve performance
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use debounced search query for filtering
  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()) ||
            item.description
              ?.toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase())
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, debouncedSearchQuery]);

  // Performance optimization: Only render visible items with proper cleanup
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleItems((prev) => {
          const newSet = new Set(prev);
          entries.forEach((entry) => {
            const itemId = entry.target.getAttribute("data-item-id");
            if (itemId) {
              if (entry.isIntersecting) {
                newSet.add(itemId);
              } else {
                newSet.delete(itemId);
              }
            }
          });
          return newSet;
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // Start loading items 50px before they come into view
      }
    );

    // Observe all menu item cards
    const itemElements = document.querySelectorAll("[data-item-id]");
    itemElements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [filteredCategories]);

  // Get active category data
  const activeCategoryData = categories.find(
    (cat) => cat.id === activeCategory
  );

  // Handle adding items to cart with restaurant status check
  const handleAddToCart = (item: QRMenuItem) => {
    // Check if restaurant is closed
    if (restaurantOpenStatus && !restaurantOpenStatus.isOpen) {
      toast.error(
        "Restaurant is currently closed. Orders are not accepted at this time."
      );
      return;
    }

    // Check if item is available
    if (!item.available) {
      toast.error("This item is currently unavailable.");
      return;
    }

    // Check if item has advanced options
    if (item.hasAdvancedOptions || item.isComboMeal) {
      setSelectedItem(item);
      setSelectedSize("");
      setSelectedModifiers([]);
      setShowAdvancedOptions(true);
      return;
    }

    console.log(
      "Adding item to cart from main page:",
      item,
      "current cart length:",
      cart.length
    );
    addToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  // Handle advanced options confirmation
  const handleAdvancedOptionsConfirm = () => {
    if (!selectedItem) return;

    // For combo meals, validate that required items are selected
    if (selectedItem.isComboMeal && selectedItem.comboData) {
      const requiredItems = selectedItem.comboData.items?.filter(
        (item: any) => item.isRequired
      );
      if (requiredItems && requiredItems.length > 0) {
        // Check if all required items have selections
        const hasAllRequired = requiredItems.every((item: any) => {
          if (item.isCustomizable && item.options) {
            // For customizable items, check if an option is selected
            return true; // For now, assume at least one option is available
          }
          return true; // Non-customizable required items are always included
        });

        if (!hasAllRequired) {
          toast.error("Please select options for all required combo items");
          return;
        }
      }
    }

    // Calculate total price including all modifications
    let totalPrice = selectedItem.price;
    let sizePriceModifier = 0;
    let modifiersTotalPrice = 0;
    let selectedModifiersData: any[] = [];

    // Add size price modifier
    if (selectedSize && selectedItem.sizes) {
      const selectedSizeData = selectedItem.sizes.find(
        (s) => s.name === selectedSize
      );
      if (selectedSizeData) {
        sizePriceModifier = selectedSizeData.priceModifier;
        totalPrice += sizePriceModifier;
      }
    }

    // Add modifiers price
    if (selectedModifiers.length > 0 && selectedItem.modifiers) {
      selectedModifiersData = selectedItem.modifiers.filter((m) =>
        selectedModifiers.includes(m.id)
      );
      modifiersTotalPrice = selectedModifiersData.reduce(
        (total, modifier) => total + modifier.priceModifier,
        0
      );
      totalPrice += modifiersTotalPrice;
    }

    // Create item with advanced options
    const itemWithOptions = {
      ...selectedItem,
      selectedSize,
      sizePriceModifier,
      selectedModifiers: selectedModifiersData,
      modifiersTotalPrice,
      price: totalPrice, // Update price to include all modifications
    };

    addToCart(itemWithOptions);
    toast.success(`${selectedItem.name} added to cart`);
    setShowAdvancedOptions(false);
    setSelectedItem(null);
    setSelectedSize("");
    setSelectedModifiers([]);
  };

  // Handle quantity updates with restaurant status check
  const handleQuantityChange = (id: string, newQuantity: number) => {
    // Find the item to check its availability
    const item = categories
      .flatMap((cat) => cat.items)
      .find((item) => item.id === id);

    if (!item) return;

    // Check if restaurant is closed
    if (restaurantOpenStatus && !restaurantOpenStatus.isOpen) {
      toast.error(
        "Restaurant is currently closed. Orders are not accepted at this time."
      );
      return;
    }

    // Check if item is available
    if (!item.available) {
      toast.error("This item is currently unavailable.");
      return;
    }

    updateQuantity(id, newQuantity);
  };

  // Enhanced error handling with retry
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      setError(null);
      // Reload data by calling the effect again
      window.location.reload();
    } else {
      toast.error("Maximum retry attempts reached. Please refresh the page.");
    }
  };

  // Enhanced error display with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRetry} disabled={retryCount >= maxRetries}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again ({retryCount}/{maxRetries})
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4 lg:px-6 lg:py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Categories Skeleton */}
        <div className="px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Menu Items Skeleton */}
        <div className="px-4 py-6 lg:px-6 lg:py-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (restaurantOpenStatus && !restaurantOpenStatus.isOpen) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Restaurant is currently closed
          </h2>
          <p className="text-gray-600 mb-6">
            {restaurantData?.name} is not accepting orders at this time.
            {restaurantOpenStatus.autoManaged &&
              restaurantOpenStatus.nextOpen && (
                <span className="block mt-2 text-sm">
                  We&apos;ll be open again at{" "}
                  {new Date(restaurantOpenStatus.nextOpen).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </span>
              )}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4" />
            <span>Check back during opening hours</span>
          </div>
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
          {/* Network Status Indicator */}
          {!isOnline && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">You&apos;re offline</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Some features may be limited. Please check your connection.
              </p>
            </div>
          )}

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 h-10 w-10 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </Button>
              <Link href={`/qr/${urlTableId}/feedback`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 py-2 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  title="Rate your experience"
                >
                  <span className="text-lg">⭐</span>
                  <span className="hidden sm:inline">Feedback</span>
                </Button>
              </Link>
            </div>
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
            {/* Description - About Card (First) */}
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

            {/* Address Section (Second) */}
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

            {/* Contact Section (Third) */}
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
                      onAddToCart={handleAddToCart}
                      cartQuantity={
                        cart.find((c) => c.id === item.id)?.quantity || 0
                      }
                      onUpdateQuantity={handleQuantityChange}
                      index={index}
                      isVisible={visibleItems.has(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Options Dialog */}
      <Dialog open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Select your preferred options for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Size Selection */}
            {selectedItem?.sizes && selectedItem.sizes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Size</h4>
                <div className="space-y-2">
                  {selectedItem.sizes.map((size) => (
                    <label
                      key={size.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="size"
                        value={size.name}
                        checked={selectedSize === size.name}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{size.name}</div>
                        {size.priceModifier > 0 && (
                          <div className="text-sm text-gray-600">
                            +{size.priceModifier.toFixed(2)} CHF
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers Selection */}
            {selectedItem?.modifiers && selectedItem.modifiers.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Add-ons & Modifiers
                </h4>
                <div className="space-y-2">
                  {selectedItem.modifiers.map((modifier) => (
                    <label
                      key={modifier.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModifiers.includes(modifier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModifiers([
                              ...selectedModifiers,
                              modifier.id,
                            ]);
                          } else {
                            setSelectedModifiers(
                              selectedModifiers.filter(
                                (id) => id !== modifier.id
                              )
                            );
                          }
                        }}
                        className="text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{modifier.name}</div>
                        {modifier.description && (
                          <div className="text-sm text-gray-600">
                            {modifier.description}
                          </div>
                        )}
                        {modifier.priceModifier > 0 && (
                          <div className="text-sm text-gray-600">
                            +{modifier.priceModifier.toFixed(2)} CHF
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Combo Meal Options */}
            {selectedItem?.isComboMeal && selectedItem.comboData && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Combo Options
                </h4>
                <div className="space-y-3">
                  {selectedItem.comboData.items?.map((comboItem: any) => (
                    <div key={comboItem.id} className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">
                        {comboItem.menuItem?.name}
                      </div>
                      {comboItem.isCustomizable && comboItem.options && (
                        <div className="space-y-2">
                          {comboItem.options.map((option: any) => (
                            <label
                              key={option.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="radio"
                                name={`combo-${comboItem.id}`}
                                value={option.id}
                                className="text-green-600"
                              />
                              <span>{option.menuItem?.name}</span>
                              {option.priceModifier > 0 && (
                                <span className="text-gray-600">
                                  (+{option.priceModifier.toFixed(2)} CHF)
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedOptions(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAdvancedOptionsConfirm}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Options Dialog */}
      <Dialog open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-600" />
              Customize {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Select your preferred options for this item.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base Price:</span>
                <span className="font-medium">
                  {selectedItem?.price.toFixed(2)} CHF
                </span>
              </div>
              {selectedSize && selectedItem?.sizes && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">
                    Size ({selectedSize}):
                  </span>
                  <span className="font-medium text-green-700">
                    +
                    {selectedItem.sizes
                      .find((s) => s.name === selectedSize)
                      ?.priceModifier.toFixed(2) || "0.00"}{" "}
                    CHF
                  </span>
                </div>
              )}
              {selectedModifiers.length > 0 && selectedItem?.modifiers && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">Modifiers:</span>
                  <span className="font-medium text-green-700">
                    +
                    {selectedModifiers
                      .reduce((total, id) => {
                        const modifier = selectedItem.modifiers?.find(
                          (m) => m.id === id
                        );
                        return total + (modifier?.priceModifier || 0);
                      }, 0)
                      .toFixed(2)}{" "}
                    CHF
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-green-700">
                    {(() => {
                      let total = selectedItem?.price || 0;
                      if (selectedSize && selectedItem?.sizes) {
                        total +=
                          selectedItem.sizes.find(
                            (s) => s.name === selectedSize
                          )?.priceModifier || 0;
                      }
                      if (
                        selectedModifiers.length > 0 &&
                        selectedItem?.modifiers
                      ) {
                        total += selectedModifiers.reduce((sum, id) => {
                          const modifier = selectedItem.modifiers?.find(
                            (m) => m.id === id
                          );
                          return sum + (modifier?.priceModifier || 0);
                        }, 0);
                      }
                      return total.toFixed(2);
                    })()}{" "}
                    CHF
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            {selectedItem?.sizes && selectedItem.sizes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-600" />
                  Choose Size
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedItem.sizes.map((size) => (
                    <label
                      key={size.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSize === size.name
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={size.name}
                        checked={selectedSize === size.name}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {size.name.charAt(0).toUpperCase() +
                            size.name.slice(1).toLowerCase()}
                        </div>
                        {size.priceModifier > 0 && (
                          <div className="text-sm text-green-700 font-medium">
                            +{size.priceModifier.toFixed(2)} CHF
                          </div>
                        )}
                        {size.priceModifier === 0 && (
                          <div className="text-sm text-gray-500">
                            No extra cost
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers Selection */}
            {selectedItem?.modifiers && selectedItem.modifiers.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Add-ons & Modifiers
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedItem.modifiers.map((modifier) => (
                    <label
                      key={modifier.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedModifiers.includes(modifier.id)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedModifiers.includes(modifier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModifiers([
                              ...selectedModifiers,
                              modifier.id,
                            ]);
                          } else {
                            setSelectedModifiers(
                              selectedModifiers.filter(
                                (id) => id !== modifier.id
                              )
                            );
                          }
                        }}
                        className="text-green-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {modifier.name.charAt(0).toUpperCase() +
                            modifier.name.slice(1).toLowerCase()}
                        </div>
                        {modifier.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {modifier.description}
                          </div>
                        )}
                        {modifier.priceModifier > 0 && (
                          <div className="text-sm text-green-700 font-medium mt-1">
                            +{modifier.priceModifier.toFixed(2)} CHF
                          </div>
                        )}
                        {modifier.priceModifier === 0 && (
                          <div className="text-sm text-green-600 font-medium mt-1">
                            Free
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Combo Meal Options */}
            {selectedItem?.isComboMeal && selectedItem.comboData && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  Combo Options
                </h4>
                <div className="space-y-3">
                  {selectedItem.comboData.items?.map((comboItem: any) => (
                    <div
                      key={comboItem.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="font-medium mb-2 text-gray-900">
                        {comboItem.menuItem?.name}
                        {comboItem.isRequired && (
                          <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {comboItem.isCustomizable && comboItem.options && (
                        <div className="space-y-2">
                          {comboItem.options.map((option: any) => (
                            <label
                              key={option.id}
                              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-white cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`combo-${comboItem.id}`}
                                value={option.id}
                                className="text-green-600"
                              />
                              <span className="flex-1">
                                {option.menuItem?.name}
                              </span>
                              {option.priceModifier > 0 && (
                                <span className="text-green-700 font-medium">
                                  +{option.priceModifier.toFixed(2)} CHF
                                </span>
                              )}
                              {option.priceModifier === 0 && (
                                <span className="text-green-600 font-medium">
                                  Free
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                      {!comboItem.isCustomizable && (
                        <div className="text-sm text-gray-600">
                          {comboItem.menuItem?.name} (included)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedOptions(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdvancedOptionsConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Change Warning Dialog */}
      <Dialog open={showTableChangeWarning} onOpenChange={cancelTableChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Different Table?</DialogTitle>
            <DialogDescription>
              You have items in your cart from a different table. Switching
              tables will clear your current cart.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Cart will be cleared</span>
              </div>
              <p className="text-sm text-amber-600">
                You have {getTotalItems()} item
                {getTotalItems() !== 1 ? "s" : ""} in your cart worth{" "}
                {getTotalPrice().toFixed(2)} CHF.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelTableChange}>
              Cancel
            </Button>
            <Button
              onClick={confirmTableChange}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Cart & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <CartButton
          totalItems={getTotalItems()}
          totalPrice={getTotalPrice()}
          tableId={urlTableId}
          currency={restaurantData?.currency || "CHF"}
          disabled={restaurantOpenStatus ? !restaurantOpenStatus.isOpen : false}
        />
      )}
    </div>
  );
}

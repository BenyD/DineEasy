"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Loader2,
  MoreHorizontal,
  CheckSquare,
  Square,
  Grid3X3,
  List,
  Utensils,
  Star,
  Wifi,
  WifiOff,
  DollarSign,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMenuSettings } from "@/lib/store/menu-settings";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { MenuImportExport } from "@/components/dashboard/menu/MenuImportExport";
import { MenuItemModal } from "@/components/dashboard/menu/MenuItemModal";
import { MenuItemCard } from "@/components/dashboard/menu/MenuItemCard";
import { BulkActions } from "@/components/dashboard/common/BulkActions";
import { Pagination } from "@/components/dashboard/common/Pagination";
import { MenuFiltersEnhanced } from "@/components/dashboard/menu/MenuFiltersEnhanced";
import { useMenuPagination } from "@/hooks/useMenuPagination";
import { deleteImage } from "@/lib/actions/upload";
import {
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
  createCategory,
  createAllergen,
  bulkDeleteMenuItems,
  bulkToggleAvailability,
  getAllMenuItemIds,
} from "@/lib/actions/menu";
import type { MenuItem } from "@/types";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";
import { getMenuWebSocket } from "@/lib/websocket/menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

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
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const cardHoverVariants = {
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
    },
  },
};

const buttonHoverVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export default function MenuPage() {
  // Menu data and state
  const {
    categories,
    allergens,
    addCategory,
    addAllergen,
    isCategoriesLoading,
    isAllergensLoading,
    error: menuError,
    fetchCategories,
    fetchAllergens,
  } = useMenuSettings();

  // Restaurant settings for currency
  const { currencySymbol } = useRestaurantSettings();

  // Pagination and filtering
  const {
    items: menuItems,
    pagination,
    filters,
    loading: paginationLoading,
    error: paginationError,
    setPage,
    setPageSize,
    setSearchTerm,
    setCategoryFilter,
    setAvailabilityFilter,
    setPopularFilter,
    setPriceRange,
    setSorting,
    clearFilters,
    refresh,
    isEmpty,
  } = useMenuPagination({
    initialPageSize: 20,
    debounceMs: 300,
  });

  // UI state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmType, setBulkConfirmType] = useState<
    "delete" | "toggle" | "selectAll"
  >("delete");
  const [bulkConfirmCount, setBulkConfirmCount] = useState(0);
  const bulkConfirmAction = useRef<() => Promise<void>>();

  // Enhanced editing state
  const [editError, setEditError] = useState<string | null>(null);

  // WebSocket integration
  const { isConnected, reconnectAttempts } = useMenuWebSocket({
    onItemAdded: (item) => {
      // Handle new menu item added
      refresh();
    },
    onItemUpdated: (item, oldItem) => {
      // Handle menu item updated
      refresh();
    },
    onItemDeleted: (item) => {
      // Handle menu item deleted
      refresh();
    },
  });

  // WebSocket handlers for categories and allergens
  useEffect(() => {
    if (!isConnected) return;

    const webSocket = getMenuWebSocket();

    // Subscribe to category updates
    const unsubscribeCategories = webSocket.subscribeToCategories(
      (payload: any) => {
        const { eventType, new: newRecord } = payload;

        if (eventType === "INSERT" && newRecord) {
          // New category added - refresh categories list
          fetchCategories();
        } else if (eventType === "UPDATE" && newRecord) {
          // Category updated - refresh categories list
          fetchCategories();
        } else if (eventType === "DELETE") {
          // Category deleted - refresh categories list
          fetchCategories();
        }
      }
    );

    // Subscribe to allergen updates
    const unsubscribeAllergens = webSocket.subscribeToAllergens(
      (payload: any) => {
        const { eventType, new: newRecord } = payload;

        if (eventType === "INSERT" && newRecord) {
          // New allergen added - refresh allergens list
          fetchAllergens();
        } else if (eventType === "UPDATE" && newRecord) {
          // Allergen updated - refresh allergens list
          fetchAllergens();
        } else if (eventType === "DELETE") {
          // Allergen deleted - refresh allergens list
          fetchAllergens();
        }
      }
    );

    return () => {
      unsubscribeCategories();
      unsubscribeAllergens();
    };
  }, [isConnected, fetchCategories, fetchAllergens]);

  // Keyboard shortcuts for bulk operations
  useEffect(() => {
    if (!showBulkOperations) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowBulkOperations(false);
        setSelectedItems(new Set());
      } else if (event.ctrlKey && event.key === "a") {
        event.preventDefault();
        setSelectedItems(new Set(menuItems.map((item) => item.id)));
      } else if (event.key === "Delete" && selectedItems.size > 0) {
        event.preventDefault();
        // Handle bulk delete
        const confirmed = window.confirm(
          `Are you sure you want to delete ${selectedItems.size} item(s)?`
        );
        if (confirmed) {
          selectedItems.forEach((id) => {
            const item = menuItems.find((i) => i.id === id);
            if (item) handleDelete(item);
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showBulkOperations, selectedItems, menuItems]);

  // Loading and error states
  const loading =
    paginationLoading || isCategoriesLoading || isAllergensLoading;
  const error = paginationError || menuError;

  // Stats calculation
  const stats = useMemo(() => {
    const total = pagination.total;
    const available = menuItems.filter((item) => item.available).length;
    const popular = menuItems.filter((item) => item.popular).length;
    const totalValue = menuItems.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()),
      0
    );

    return {
      total,
      available,
      popular,
      totalValue: totalValue.toFixed(2),
    };
  }, [pagination.total, menuItems]);

  // Fetch categories and allergens on mount
  useEffect(() => {
    fetchCategories();
    fetchAllergens();
  }, [fetchCategories, fetchAllergens]);

  // Enhanced edit handler
  const handleEditSubmit = async (formData: FormData) => {
    if (!editingItem) return;

    setEditError(null);

    try {
      // Show loading toast
      const loadingToast = toast.loading("Updating menu item...");

      // Handle the update
      const result = await updateMenuItem(editingItem.id, formData);

      if (result.error) {
        setEditError(result.error);
        toast.error(`Failed to update: ${result.error}`, { id: loadingToast });
      } else {
        // Success - close modal and show success message
        setEditingItem(null);
        toast.success("Menu item updated successfully!", { id: loadingToast });

        // Refresh data to ensure we have the latest
        await refresh();
      }
    } catch (error: any) {
      console.error("Edit error:", error);
      setEditError(error.message || "An unexpected error occurred");
      toast.error("Failed to update menu item");
    }
  };

  // Function to copy image to new location in storage
  const copyImageToNewLocation = async (
    originalImageUrl: string
  ): Promise<string> => {
    const supabase = createClient();

    try {
      // Extract the file path from the original URL
      const urlParts = originalImageUrl.split("/");
      const bucketIndex = urlParts.findIndex(
        (part: string) => part === "menu-images"
      );

      if (bucketIndex === -1 || bucketIndex + 1 >= urlParts.length) {
        throw new Error("Invalid image URL format");
      }

      // Get the original file path
      const originalFilePath = urlParts.slice(bucketIndex + 1).join("/");

      // Create a new file path with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const fileExtension = originalFilePath.split(".").pop();
      const fileName =
        originalFilePath.split("/").pop()?.split(".")[0] || "image";
      const newFilePath = `${fileName}_${timestamp}.${fileExtension}`;

      // Download the original image
      const { data: originalImageData, error: downloadError } =
        await supabase.storage.from("menu-images").download(originalFilePath);

      if (downloadError || !originalImageData) {
        throw new Error("Failed to download original image");
      }

      // Upload the image to the new location
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(newFilePath, originalImageData, {
          contentType: originalImageData.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error("Failed to upload copied image");
      }

      // Get the public URL for the new image
      const {
        data: { publicUrl },
      } = supabase.storage.from("menu-images").getPublicUrl(newFilePath);

      return publicUrl;
    } catch (error) {
      console.error("Error copying image:", error);
      throw error;
    }
  };

  // Enhanced duplicate handler
  const handleDuplicate = async (item: MenuItem) => {
    try {
      const loadingToast = toast.loading("Duplicating menu item...");

      // Create a new FormData with the item data
      const formData = new FormData();
      formData.append("name", `${item.name} (Copy)`);
      formData.append("description", item.description || "");
      formData.append("price", item.price.toString());
      formData.append("category", item.categoryId);
      formData.append("preparationTime", item.preparationTime.toString());
      formData.append("available", item.available.toString());
      formData.append("popular", item.popular.toString());

      // Handle image duplication
      if (
        item.image &&
        item.image !== "/placeholder.svg" &&
        item.image !== "/placeholder.svg?height=100&width=100"
      ) {
        try {
          // Copy the image to a new location
          const newImageUrl = await copyImageToNewLocation(item.image);
          formData.append("imageUrl", newImageUrl);
        } catch (imageError) {
          console.warn("Failed to copy image, using placeholder:", imageError);
          formData.append("imageUrl", "/placeholder.svg");
        }
      } else {
        formData.append("imageUrl", "/placeholder.svg");
      }

      // Add allergens
      if (item.allergens && item.allergens.length > 0) {
        item.allergens.forEach((allergen) => {
          formData.append("allergens", allergen.id);
        });
      }

      const result = await createMenuItem(formData);

      if (result.error) {
        toast.error(`Failed to duplicate: ${result.error}`, {
          id: loadingToast,
        });
      } else {
        toast.success("Menu item duplicated successfully!", {
          id: loadingToast,
        });
        await refresh();
      }
    } catch (error: any) {
      console.error("Duplicate error:", error);
      toast.error("Failed to duplicate menu item");
    }
  };

  // Enhanced availability toggle
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const loadingToast = toast.loading(
        `Marking item as ${item.available ? "unavailable" : "available"}...`
      );

      const formData = new FormData();
      formData.append("available", (!item.available).toString());

      const result = await updateMenuItem(item.id, formData);

      if (result.error) {
        toast.error(`Failed to update availability: ${result.error}`, {
          id: loadingToast,
        });
      } else {
        toast.success(
          `Item marked as ${!item.available ? "available" : "unavailable"}!`,
          { id: loadingToast }
        );
        await refresh();
      }
    } catch (error: any) {
      console.error("Availability toggle error:", error);
      toast.error("Failed to update availability");
    }
  };

  // Enhanced popular toggle
  const handleTogglePopular = async (item: MenuItem) => {
    try {
      const loadingToast = toast.loading(
        `${item.popular ? "Removing" : "Adding"} popular tag...`
      );

      const formData = new FormData();
      formData.append("popular", (!item.popular).toString());

      const result = await updateMenuItem(item.id, formData);

      if (result.error) {
        toast.error(`Failed to update popularity: ${result.error}`, {
          id: loadingToast,
        });
      } else {
        toast.success(`Popular tag ${!item.popular ? "added" : "removed"}!`, {
          id: loadingToast,
        });
        await refresh();
      }
    } catch (error: any) {
      console.error("Popular toggle error:", error);
      toast.error("Failed to update popularity");
    }
  };

  // Enhanced delete handler with image cleanup
  const handleDelete = async (item: MenuItem) => {
    try {
      const loadingToast = toast.loading("Deleting menu item...");

      // Delete the item using the action function
      const result = await deleteMenuItem(item.id);

      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`, { id: loadingToast });
      } else {
        // If the item had an image, try to delete it from storage
        if (item.image && item.image !== "/placeholder.svg") {
          try {
            await deleteImage(item.image, "menu-item");
            console.log("Successfully deleted image from storage");
          } catch (imageError) {
            console.warn("Failed to delete image from storage:", imageError);
            // Don't fail the operation if image deletion fails
          }
        }

        toast.success("Menu item deleted successfully!", { id: loadingToast });
        await refresh();
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete menu item");
    }
  };

  // Bulk operations handlers
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedItems.size} menu item(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      setBulkLoading(true);
      const result = await bulkDeleteMenuItems(Array.from(selectedItems));

      if (result.success) {
        toast.success(
          `Successfully deleted ${selectedItems.size} menu item(s)`
        );
        setSelectedItems(new Set());
        await refresh();
      } else {
        toast.error(`Failed to delete menu items: ${result.error}`);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete menu items. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkToggleAvailability = async () => {
    if (selectedItems.size === 0) return;

    try {
      const confirmed = window.confirm(
        `Are you sure you want to toggle availability for ${selectedItems.size} menu item(s)?`
      );

      if (!confirmed) return;

      setBulkLoading(true);
      // For bulk toggle, we'll toggle to the opposite of the first selected item's availability
      const firstItem = menuItems.find((item) => selectedItems.has(item.id));
      const targetAvailability = firstItem ? !firstItem.available : true;

      const result = await bulkToggleAvailability(
        Array.from(selectedItems),
        targetAvailability
      );

      if (result.success) {
        toast.success(
          `Successfully toggled availability for ${selectedItems.size} menu item(s)`
        );
        setSelectedItems(new Set());
        await refresh();
      } else {
        toast.error(`Failed to toggle availability: ${result.error}`);
      }
    } catch (error) {
      console.error("Bulk toggle availability error:", error);
      toast.error("Failed to toggle availability. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle card selection in bulk mode
  const handleCardSelect = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all across all pages
  const handleSelectAllAcrossPages = async () => {
    try {
      setBulkLoading(true);
      const allItemIds = await getAllMenuItemIds({
        searchTerm: filters.searchTerm,
        categoryId: filters.categoryId !== "all" ? filters.categoryId : "",
        available: filters.available,
        popular: filters.popular,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });

      if (allItemIds.success) {
        setSelectedItems(new Set(allItemIds.ids));
        toast.success(
          `Selected all ${allItemIds.ids.length} menu items across all pages`
        );
      } else {
        toast.error("Failed to select all items");
      }
    } catch (error) {
      console.error("Select all error:", error);
      toast.error("Failed to select all items");
    } finally {
      setBulkLoading(false);
    }
  };

  // Helper to open confirmation modal
  function openBulkConfirm(
    type: "delete" | "toggle" | "selectAll",
    count: number,
    action: () => Promise<void>
  ) {
    setBulkConfirmType(type);
    setBulkConfirmCount(count);
    bulkConfirmAction.current = action;
    setBulkConfirmOpen(true);
  }

  const handleBulkConfirm = async () => {
    if (bulkConfirmAction.current) {
      await bulkConfirmAction.current();
      setBulkConfirmOpen(false);
    }
  };

  // Show loading state
  if (loading && menuItems.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search Skeleton */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative col-span-full lg:col-span-2">
                <Skeleton className="absolute left-2.5 top-2.5 h-4 w-4" />
                <Skeleton className="h-10 w-full pl-8" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="w-full h-32 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Menu
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={refresh} className="mt-4" variant="outline">
            Retry
          </Button>
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
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            asChild
          >
            <motion.div
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {loading ? "Refreshing..." : "Refresh"}
            </motion.div>
          </Button>

          {/* Bulk Mode Button - moved before Add Item */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkOperations(!showBulkOperations)}
                  className={cn(
                    "transition-all",
                    showBulkOperations &&
                      "bg-green-50 border-green-200 text-green-700",
                    showBulkOperations &&
                      selectedItems.size === 0 &&
                      "bg-yellow-50 border-yellow-200 text-yellow-700"
                  )}
                >
                  {showBulkOperations ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedItems.size > 0
                        ? `Bulk Mode (${selectedItems.size})`
                        : "Bulk Mode - Select Items"}
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Bulk Mode
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Bulk Operations</p>
                  <p className="text-xs text-muted-foreground">
                    Select multiple items for bulk actions
                  </p>
                  {showBulkOperations && selectedItems.size > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Delete
                        </kbd>{" "}
                        - Delete selected
                      </p>
                      <p>
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Ctrl+A
                        </kbd>{" "}
                        - Select all
                      </p>
                      <p>
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Esc
                        </kbd>{" "}
                        - Exit bulk mode
                      </p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add Item Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Add New Item</p>
                  <p className="text-xs text-muted-foreground">
                    Add a new menu item to your restaurant
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Import/Export */}
          <MenuImportExport
            menuItems={menuItems}
            categories={categories}
            onRefresh={refresh}
          />

          <MenuItemModal
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            item={null}
            menuCategories={categories}
            menuAllergens={allergens}
            isAddingCategoryOrAllergen={
              isCategoriesLoading || isAllergensLoading
            }
            onSubmit={async (formData) => {
              try {
                // Show loading toast
                const loadingToast = toast.loading("Adding menu item...");

                // Create the menu item
                const result = await createMenuItem(formData);

                if (result.error) {
                  toast.error(`Failed to add menu item: ${result.error}`, {
                    id: loadingToast,
                  });
                } else {
                  // Success - close modal and show success message
                  setIsAddDialogOpen(false);
                  toast.success("Menu item added successfully!", {
                    id: loadingToast,
                  });

                  // Refresh data to show the new item
                  await refresh();
                }
              } catch (error: any) {
                console.error("Add menu item error:", error);
                toast.error("Failed to add menu item. Please try again.");
              }
            }}
            onAddCategory={async (name: string, description: string) => {
              const formData = new FormData();
              formData.append("name", name);
              formData.append("description", description);
              const result = await createCategory(formData);

              if (result.success && result.data) {
                // Return the new category data - WebSocket will handle the refresh
                return result.data;
              }
              throw new Error(result.error || "Failed to create category");
            }}
            onAddAllergen={async (name: string, icon: string) => {
              const formData = new FormData();
              formData.append("name", name);
              formData.append("icon", icon);
              const result = await createAllergen(formData);

              if (result.success && result.data) {
                // Return the new allergen data - WebSocket will handle the refresh
                return result.data;
              }
              throw new Error(result.error || "Failed to create allergen");
            }}
            currencySymbol={currencySymbol}
          />
        </div>
      </motion.div>

      {/* Connection Status */}
      {!isConnected && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Lost</AlertTitle>
            <AlertDescription>
              Real-time updates are temporarily unavailable.
              {reconnectAttempts > 0 &&
                ` Attempting to reconnect... (${reconnectAttempts}/5)`}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Connection Status - Connected */}
      {isConnected && reconnectAttempts > 0 && (
        <motion.div variants={itemVariants}>
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertTitle>Connection Restored</AlertTitle>
            <AlertDescription>
              Real-time updates are now active.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div className="grid gap-4 md:grid-cols-4" variants={itemVariants}>
        <AnimatePresence mode="wait">
          {[
            {
              title: "Total Items",
              value: stats.total,
              description: "All menu items",
              icon: Utensils,
            },
            {
              title: "Available Items",
              value: stats.available,
              description: "Ready to serve",
              icon: CheckSquare,
            },
            {
              title: "Popular Items",
              value: stats.popular,
              description: "Customer favorites",
              icon: Star,
            },
            {
              title: "Total Value",
              value: `${currencySymbol}${stats.totalValue}`,
              description: "Menu value",
              icon: DollarSign,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={cardHoverVariants}
              whileHover="hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced Filters */}
      <MenuFiltersEnhanced
        searchTerm={filters.searchTerm}
        categoryId={filters.categoryId}
        available={filters.available}
        popular={filters.popular}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        viewMode={viewMode}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
        onAvailabilityChange={setAvailabilityFilter}
        onPopularChange={setPopularFilter}
        onPriceRangeChange={setPriceRange}
        onSortingChange={setSorting}
        onViewModeChange={setViewMode}
        onClearFilters={clearFilters}
        categories={categories.map((c: any) => ({
          ...c,
          restaurantId: c.restaurantId ?? "",
          isActive: c.isActive ?? true,
        }))}
        totalItems={pagination.total}
        filteredCount={menuItems.length}
        loading={loading}
        currencySymbol={currencySymbol}
      />

      {/* Bulk Actions and Menu Items Grid */}
      <BulkActions
        items={menuItems}
        itemKey={(item) => item.id}
        selectedIds={Array.from(selectedItems)}
        onSelectAll={(all) => {
          if (all) {
            setSelectedItems(new Set(menuItems.map((item) => item.id)));
          } else {
            setSelectedItems(new Set());
          }
        }}
        onSelectItem={(id, selected) => {
          const newSelected = new Set(selectedItems);
          if (selected) {
            newSelected.add(id);
          } else {
            newSelected.delete(id);
          }
          setSelectedItems(newSelected);
        }}
        isBulkMode={showBulkOperations}
        onBulkModeChange={setShowBulkOperations}
        color="green"
        onBulkDelete={handleBulkDelete}
        onBulkToggleAvailability={handleBulkToggleAvailability}
        onSelectAllAcrossPages={handleSelectAllAcrossPages}
        bulkActionsLoading={bulkLoading}
      >
        {({ selectedIds, isBulkMode, handleSelectItem }) => (
          <>
            {/* Menu Items Grid */}
            <motion.div
              className={cn(
                "gap-6",
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col space-y-4"
              )}
              variants={itemVariants}
            >
              <AnimatePresence mode="wait">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    variants={cardHoverVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={viewMode === "list" ? "w-full" : ""}
                  >
                    <MenuItemCard
                      item={item}
                      category={categories.find(
                        (c) => c.id === item.categoryId
                      )}
                      viewMode={viewMode}
                      isSelected={selectedIds.includes(item.id)}
                      showCheckbox={isBulkMode}
                      currencySymbol={currencySymbol}
                      onSelect={handleCardSelect}
                      onEdit={() => setEditingItem(item)}
                      onDuplicate={() => handleDuplicate(item)}
                      onToggleAvailability={handleToggleAvailability}
                      onTogglePopular={handleTogglePopular}
                      onDelete={() => handleDelete(item)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </BulkActions>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div variants={itemVariants}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            showPageSizeSelector={true}
            showTotalItems={true}
          />
        </motion.div>
      )}

      {/* Empty State */}
      {isEmpty && !loading && (
        <motion.div className="text-center py-12" variants={itemVariants}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No menu items found
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.searchTerm ||
            filters.categoryId !== "all" ||
            filters.available !== undefined ||
            filters.popular !== undefined
              ? "Try adjusting your filters to see more results."
              : "Get started by adding your first menu item."}
          </p>
          {!filters.searchTerm &&
            filters.categoryId === "all" &&
            filters.available === undefined &&
            filters.popular === undefined && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            )}
        </motion.div>
      )}

      {/* Edit Dialog */}
      <MenuItemModal
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        menuCategories={categories}
        menuAllergens={allergens}
        isAddingCategoryOrAllergen={isCategoriesLoading || isAllergensLoading}
        onSubmit={handleEditSubmit}
        onAddCategory={async (name: string, description: string) => {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("description", description);
          const result = await createCategory(formData);

          if (result.success && result.data) {
            // Return the new category data - WebSocket will handle the refresh
            return result.data;
          }
          throw new Error(result.error || "Failed to create category");
        }}
        onAddAllergen={async (name: string, icon: string) => {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("icon", icon);
          const result = await createAllergen(formData);

          if (result.success && result.data) {
            // Return the new allergen data - WebSocket will handle the refresh
            return result.data;
          }
          throw new Error(result.error || "Failed to create allergen");
        }}
        currencySymbol={currencySymbol}
      />

      {/* Bulk Confirmation Dialog */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="max-w-md">
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">
              {bulkConfirmType === "delete"
                ? `Delete ${bulkConfirmCount} item${bulkConfirmCount > 1 ? "s" : ""}?`
                : bulkConfirmType === "toggle"
                  ? `Toggle availability for ${bulkConfirmCount} item${bulkConfirmCount > 1 ? "s" : ""}?`
                  : `Select all ${bulkConfirmCount} items?`}
            </h3>
            <p className="text-gray-600 mb-4">
              {bulkConfirmType === "delete"
                ? "This action cannot be undone. Are you sure you want to delete the selected items?"
                : bulkConfirmType === "toggle"
                  ? "Are you sure you want to toggle availability for the selected items?"
                  : "Are you sure you want to select all items across all pages?"}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkConfirmOpen(false)}
                disabled={bulkLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBulkConfirm}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

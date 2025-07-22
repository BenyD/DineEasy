"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  MoreHorizontal,
  ImagePlus,
  Tag,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileText,
  Settings2,
  Image,
  Upload,
  X,
  Download,
  Copy,
  Share2,
  BarChart3,
  Grid3X3,
  List,
  Settings,
  HelpCircle,
  CheckSquare,
  Square,
  BarChart,
  TrendingUp,
  Package,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import {
  useMenuSettings,
  type MenuCategory,
  type Allergen,
  type MenuItem,
} from "@/lib/store/menu-settings";
import { uploadImage, type UploadType } from "@/lib/actions/upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDropzone } from "react-dropzone";
import { bytesToSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MenuErrorBoundary } from "@/components/dashboard/menu/MenuErrorBoundary";
import { useMenuOptimized } from "@/hooks/useMenuOptimized";
import { retryWithConditions } from "@/lib/utils/retry";

import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";
import {
  saveMenuItemFormProgress,
  loadMenuItemFormProgress,
  clearMenuItemFormProgress,
  hasMenuItemFormProgress,
} from "@/lib/utils";

// Custom hook for debouncing (keeping for backward compatibility)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Default categories for new restaurants (now handled by database trigger)
const defaultCategories = [
  { id: "starters", name: "Starters" },
  { id: "mains", name: "Mains" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" },
];

// Default allergens for new restaurants (now handled by database trigger)
// Comprehensive list of standard restaurant allergens including:
// - Major allergens (Gluten, Dairy, Eggs, Nuts, Soy, Shellfish, Fish, Sulfites)
// - EU/UK regulated allergens (Peanuts, Tree Nuts, Wheat, Lactose, Molluscs, Celery, Mustard, Sesame, Lupin, Crustaceans)
const defaultAllergens = [
  { name: "Gluten" },
  { name: "Dairy" },
  { name: "Eggs" },
  { name: "Nuts" },
  { name: "Soy" },
  { name: "Shellfish" },
  { name: "Fish" },
  { name: "Sulfites" },
  { name: "Peanuts" },
  { name: "Tree Nuts" },
  { name: "Wheat" },
  { name: "Lactose" },
  { name: "Molluscs" },
  { name: "Celery" },
  { name: "Mustard" },
  { name: "Sesame" },
  { name: "Lupin" },
  { name: "Crustaceans" },
];

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleVisibility: (item: MenuItem) => void;
  viewMode?: "grid" | "list";
  isSelected?: boolean;
  onSelect?: (itemId: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

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
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
    },
  },
};

const buttonHoverVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const imageHoverVariants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
    },
  },
};

function MenuPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showUnavailable, setShowUnavailable] = useState(true);

  // Phase 1: Enhanced filtering and bulk operations
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [preparationTimeRange, setPreparationTimeRange] = useState<
    [number, number]
  >([0, 120]);
  const [popularOnly, setPopularOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "popularity" | "preparationTime"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Bulk operations
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Phase 2: Advanced Features
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [itemToDuplicate, setItemToDuplicate] = useState<MenuItem | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    categoryId: "",
    available: null as boolean | null,
    popular: null as boolean | null,
  });

  // Performance optimizations
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { currency, currencySymbol } = useRestaurantSettings();
  const {
    menuItems,
    categories: menuCategories,
    allergens: menuAllergens,
    isLoading,
    isMenuItemsLoading,
    isCategoriesLoading,
    isAllergensLoading,
    error,
    fetchMenuItems,
    fetchCategories,
    fetchAllergens,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    removeMultipleMenuItems,
    addCategory,
    addAllergen,
  } = useMenuSettings();

  // Search function without debounce to prevent random refreshes
  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  // Refresh function optimized to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    if (!isMenuItemsLoading && !refreshing) {
      setRefreshing(true);
      try {
        await Promise.all([
          fetchMenuItems(),
          fetchCategories(),
          fetchAllergens(),
        ]);
        toast.success("Menu refreshed");
      } catch (error) {
        toast.error("Failed to refresh menu");
      } finally {
        setRefreshing(false);
      }
    }
  }, [
    fetchMenuItems,
    fetchCategories,
    fetchAllergens,
    isMenuItemsLoading,
    refreshing,
  ]);

  // Debounced search term for filtering (keeping existing logic)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Menu statistics
  const menuStats = useMemo(() => {
    const totalItems = menuItems.length;
    const availableItems = menuItems.filter((item) => item.available).length;
    const popularItems = menuItems.filter((item) => item.popular).length;
    const averagePrice =
      totalItems > 0
        ? menuItems.reduce((sum, item) => sum + item.price, 0) / totalItems
        : 0;

    const categoryDistribution = menuItems.reduce(
      (acc, item) => {
        const categoryName =
          menuCategories.find((c) => c.id === item.categoryId)?.name ||
          "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalItems,
      availableItems,
      popularItems,
      averagePrice,
      categoryDistribution,
      unavailableItems: totalItems - availableItems,
    };
  }, [menuItems, menuCategories]);

  // Enhanced filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let filtered = menuItems.filter((item) => {
      // Search filter
      const matchesSearch =
        debouncedSearchTerm === "" ||
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (item.description &&
          item.description
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()));

      // Category filter
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory;

      // Availability filter
      const matchesAvailability = showUnavailable ? true : item.available;

      // Price range filter
      const matchesPrice =
        item.price >= priceRange[0] && item.price <= priceRange[1];

      // Preparation time filter
      const matchesPrepTime =
        item.preparationTime >= preparationTimeRange[0] &&
        item.preparationTime <= preparationTimeRange[1];

      // Popular filter
      const matchesPopular = popularOnly ? item.popular : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesPrice &&
        matchesPrepTime &&
        matchesPopular
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "popularity":
          comparison = (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          break;
        case "preparationTime":
          comparison = a.preparationTime - b.preparationTime;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    menuItems,
    debouncedSearchTerm,
    activeCategory,
    showUnavailable,
    priceRange,
    preparationTimeRange,
    popularOnly,
    sortBy,
    sortOrder,
  ]);

  // Paginated items for performance
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, page, itemsPerPage]);

  // Total pages for pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  }, [filteredAndSortedItems.length, itemsPerPage]);

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("all");
    setShowUnavailable(true);
    setPriceRange([0, 1000]);
    setPreparationTimeRange([0, 120]);
    setPopularOnly(false);
    setPage(1);
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedItems.length === paginatedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedItems.map((item) => item.id));
    }
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      // Use the new bulk delete function for better performance and image cleanup
      await removeMultipleMenuItems(selectedItems);

      setSelectedItems([]);
      setIsBulkMode(false);

      // Refresh menu items to show the updated list instantly
      await fetchMenuItems();
    } catch (error) {
      toast.error("Failed to delete some items");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkToggleAvailability = async () => {
    if (selectedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      // Get current availability of first selected item
      const firstItem = menuItems.find((item) => item.id === selectedItems[0]);
      const newAvailability = !firstItem?.available;

      // Update all selected items
      for (const itemId of selectedItems) {
        const item = menuItems.find((item) => item.id === itemId);
        if (item) {
          const formData = new FormData();
          formData.append("available", (!item.available).toString());
          await updateMenuItem(itemId, formData);
        }
      }

      setSelectedItems([]);
      setIsBulkMode(false);
      toast.success(
        `Successfully ${newAvailability ? "enabled" : "disabled"} ${selectedItems.length} item(s)`
      );

      // Refresh menu items to show the updated items instantly
      await fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update some items");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for menu actions
  const generateMenuCSV = () => {
    const headers = [
      "Name",
      "Description",
      "Price",
      "Category",
      "Preparation Time (minutes)",
      "Available",
      "Popular",
      "Allergens",
    ];
    const rows = menuItems.map((item) => [
      item.name,
      item.description || "",
      item.price.toFixed(2),
      menuCategories.find((c) => c.id === item.categoryId)?.name || "",
      item.preparationTime,
      item.available ? "Yes" : "No",
      item.popular ? "Yes" : "No",
      item.allergens.join(", "),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const generateSampleCSV = () => {
    const headers = [
      "Name",
      "Description",
      "Price",
      "Category",
      "Preparation Time (minutes)",
      "Available",
      "Popular",
      "Allergens",
    ];
    const sampleRows = [
      [
        "Margherita Pizza",
        "Classic tomato sauce with mozzarella cheese",
        "12.99",
        "Pizza",
        "15",
        "Yes",
        "Yes",
        "Dairy, Gluten",
      ],
      [
        "Caesar Salad",
        "Fresh romaine lettuce with Caesar dressing",
        "8.99",
        "Salads",
        "10",
        "Yes",
        "No",
        "Dairy, Eggs",
      ],
      [
        "Chicken Pasta",
        "Grilled chicken with creamy alfredo sauce",
        "14.99",
        "Pasta",
        "20",
        "Yes",
        "Yes",
        "Dairy, Gluten",
      ],
    ];

    return [headers, ...sampleRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  const downloadSampleCSV = () => {
    const sampleContent = generateSampleCSV();
    downloadCSV(sampleContent, "menu-import-sample.csv");
    toast.success("Sample CSV downloaded successfully");
  };

  // Phase 2: Advanced Features Functions

  // Export functionality
  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);

      if (format === "csv") {
        const csvContent = generateMenuCSV();
        const filename = `menu-export-${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(csvContent, filename);
      } else {
        const jsonContent = JSON.stringify(menuItems, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `menu-export-${new Date().toISOString().split("T")[0]}.json`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Menu exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export menu");
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  // Import functionality
  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      const text = await importFile.text();
      let importedItems: any[] = [];
      let errors: string[] = [];

      if (importFile.name.endsWith(".csv")) {
        // Parse CSV with better error handling
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          throw new Error(
            "CSV file must have at least a header row and one data row"
          );
        }

        const headers = lines[0]
          .split(",")
          .map((h) => h.replace(/"/g, "").trim());

        // Validate required headers
        const requiredHeaders = ["Name", "Price"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );
        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required headers: ${missingHeaders.join(", ")}`
          );
        }

        importedItems = lines.slice(1).map((line, index) => {
          const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
          const item: any = {};
          headers.forEach((header, headerIndex) => {
            item[header.toLowerCase().replace(/\s+/g, "_")] =
              values[headerIndex] || "";
          });
          return { ...item, _rowNumber: index + 2 }; // Add row number for error reporting
        });
      } else if (importFile.name.endsWith(".json")) {
        // Parse JSON
        try {
          importedItems = JSON.parse(text);
        } catch (parseError) {
          throw new Error("Invalid JSON format");
        }
      } else {
        throw new Error(
          "Unsupported file format. Please use CSV or JSON files."
        );
      }

      // Validate and process imported items
      let successCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const item of importedItems) {
        try {
          // Validate required fields
          if (!item.name || !item.name.trim()) {
            errors.push(
              `Row ${item._rowNumber || "unknown"}: Name is required`
            );
            errorCount++;
            continue;
          }

          if (!item.price || isNaN(parseFloat(item.price))) {
            errors.push(
              `Row ${item._rowNumber || "unknown"}: Valid price is required`
            );
            errorCount++;
            continue;
          }

          // Check if item already exists (case-insensitive)
          const existingItem = menuItems.find(
            (existing) =>
              existing.name.toLowerCase() === item.name.toLowerCase()
          );

          if (existingItem) {
            skippedCount++;
            continue; // Skip existing items
          }

          // Find category by name (case-insensitive)
          let categoryId = item.category_id;
          if (item.category && !categoryId) {
            const category = menuCategories.find(
              (c) => c.name.toLowerCase() === item.category.toLowerCase()
            );
            categoryId = category?.id || menuCategories[0]?.id;
          }

          const formData = new FormData();
          formData.append("name", item.name.trim());
          formData.append("description", item.description || "");
          formData.append("price", parseFloat(item.price).toString());
          formData.append("category", categoryId || "");
          formData.append("preparationTime", item.preparation_time || "15");
          formData.append(
            "available",
            item.available === "Yes" ? "true" : "false"
          );
          formData.append("popular", item.popular === "Yes" ? "true" : "false");

          await addMenuItem(formData);
          successCount++;
        } catch (itemError: any) {
          errors.push(
            `Row ${item._rowNumber || "unknown"}: ${itemError.message}`
          );
          errorCount++;
        }
      }

      // Show detailed results
      let resultMessage = `Imported ${successCount} items successfully`;
      if (skippedCount > 0) {
        resultMessage += `, skipped ${skippedCount} existing items`;
      }
      if (errorCount > 0) {
        resultMessage += `, ${errorCount} errors`;
      }

      if (errorCount > 0) {
        toast.error(resultMessage, {
          duration: 5000,
          description: `Check the console for detailed error information.`,
        });
        console.error("Import errors:", errors);
      } else {
        toast.success(resultMessage);
      }

      setImportFile(null);
      setShowImportDialog(false);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Duplicate functionality
  const handleDuplicate = (item: MenuItem) => {
    setItemToDuplicate(item);
    setShowDuplicateDialog(true);
  };

  const handleToggleVisibility = async (item: MenuItem) => {
    try {
      const formData = new FormData();
      formData.append("available", (!item.available).toString());

      await updateMenuItem(item.id, formData);
      toast.success(
        `${item.name} is now ${!item.available ? "available" : "unavailable"}`
      );

      // Refresh menu items to show the updated status instantly
      await fetchMenuItems();
    } catch (error) {
      toast.error(`Failed to update ${item.name} availability`);
    }
  };

  const confirmDuplicate = async () => {
    if (!itemToDuplicate) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", `${itemToDuplicate.name} (Copy)`);
      formData.append("description", itemToDuplicate.description || "");
      formData.append("price", itemToDuplicate.price.toString());
      if (itemToDuplicate.categoryId) {
        formData.append("categoryId", itemToDuplicate.categoryId);
      }
      formData.append(
        "preparationTime",
        itemToDuplicate.preparationTime.toString()
      );
      formData.append("available", itemToDuplicate.available.toString());
      formData.append("popular", itemToDuplicate.popular.toString());

      // Copy allergens
      itemToDuplicate.allergens.forEach((allergen) => {
        formData.append("allergens", allergen);
      });

      await addMenuItem(formData);
      toast.success("Item duplicated successfully");
      setShowDuplicateDialog(false);
      setItemToDuplicate(null);
    } catch (error) {
      toast.error("Failed to duplicate item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk edit functionality
  const handleBulkEdit = async () => {
    if (selectedItems.length === 0) return;

    try {
      setIsSubmitting(true);

      for (const itemId of selectedItems) {
        const formData = new FormData();

        if (bulkEditData.categoryId) {
          formData.append("category", bulkEditData.categoryId);
        }
        if (bulkEditData.available !== null) {
          formData.append("available", bulkEditData.available.toString());
        }
        if (bulkEditData.popular !== null) {
          formData.append("popular", bulkEditData.popular.toString());
        }

        await updateMenuItem(itemId, formData);
      }

      setSelectedItems([]);
      setIsBulkMode(false);
      setShowBulkEditDialog(false);
      setBulkEditData({ categoryId: "", available: null, popular: null });
      toast.success(`Successfully updated ${selectedItems.length} item(s)`);

      // Refresh menu items to show the updated items instantly
      await fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update some items");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchAllergens();
  }, [fetchMenuItems, fetchCategories, fetchAllergens]);

  // State to track if we're adding categories/allergens for WebSocket coordination
  const [isAddingCategoryOrAllergen, setIsAddingCategoryOrAllergen] =
    useState(false);

  // WebSocket integration for real-time menu updates
  // This enables real-time collaboration when multiple users are managing the menu
  // Changes made by one user will appear instantly for all other users
  // NOTE: WebSocket updates are disabled when dialogs are open to prevent form resets
  const { disconnect: disconnectWebSocket, isConnected, reconnectAttempts } = useMenuWebSocket({
    enabled: !isAddDialogOpen && !editingItem && !isSubmitting,
  });

  // Auto-refresh disabled - only manual refresh allowed
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Only auto-refresh if not loading, not refreshing, and no dialogs are open
  //     if (
  //       !isLoading &&
  //       !refreshing &&
  //       !isAddDialogOpen &&
  //       !editingItem &&
  //       !deleteConfirmItem &&
  //       !showBulkEditDialog &&
  //       !showDuplicateDialog &&
  //       !showExportDialog &&
  //       !showImportDialog
  //     ) {
  //       handleRefresh();
  //     }
  //   }, 60000); // 60 seconds (increased from 30 to reduce frequency)

  //   return () => clearInterval(interval);
  // }, [
  //   isLoading,
  //   refreshing,
  //   handleRefresh,
  //   isAddDialogOpen,
  //   editingItem,
  //   deleteConfirmItem,
  //   showBulkEditDialog,
  //   showDuplicateDialog,
  //   showExportDialog,
  //   showImportDialog,
  // ]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    activeCategory,
    showUnavailable,
    priceRange,
    preparationTimeRange,
    popularOnly,
  ]);

  // Update bulk mode based on selections
  useEffect(() => {
    setIsBulkMode(selectedItems.length > 0);
    setShowBulkActions(selectedItems.length > 0);
  }, [selectedItems]);

  // Keyboard shortcuts for bulk operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when bulk mode is active and items are selected
      if (!isBulkMode || selectedItems.length === 0) return;

      // Prevent shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "Delete":
        case "Backspace":
          event.preventDefault();
          handleBulkDelete();
          break;
        case "a":
        case "A":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleSelectAll();
          }
          break;
        case "Escape":
          event.preventDefault();
          setSelectedItems([]);
          setIsBulkMode(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBulkMode, selectedItems.length, handleBulkDelete, handleSelectAll]);

  // Show loading state only when menu items are loading
  if (isMenuItemsLoading) {
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
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        {/* Category Tabs Skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>

        {/* Menu Items Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-5 w-16 ml-2" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-6 w-6 rounded-full" />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
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
          <Button onClick={fetchMenuItems} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Create categories with counts for filtering
  const categoriesWithCounts = [
    { id: "all", name: "All Items", count: menuItems.length },
    ...menuCategories.map((category) => ({
      id: category.id,
      name: category.name,
      count: menuItems.filter((item) => item.categoryId === category.id).length,
    })),
  ];

  const MenuItemForm = ({
    item,
    onClose,
  }: {
    item?: any;
    onClose: () => void;
  }) => {
    // Use parent's state for WebSocket coordination
    const parentSetIsAddingCategoryOrAllergen = setIsAddingCategoryOrAllergen;
    // Access parent component's dialog state to prevent form resets
    const isDialogOpen = isAddDialogOpen || !!editingItem;

    // Form state management
    const { currency, currencySymbol } = useRestaurantSettings();
    const {
      addCategory,
      addAllergen,
      isCategoriesLoading,
      isAllergensLoading,
    } = useMenuSettings();

    // Initialize form state with localStorage persistence
    const [formState, setFormState] = useState(() => {
      // If editing an existing item, don't load from localStorage
      if (item) {
        return {
          // Form data
          formData: {
            name: "",
            description: "",
            price: "",
            category: "",
            preparationTime: "",
            available: true,
            allergens: [] as string[],
            popular: false,
            image: "",
          },
          // UI state
          activeTab: "basic",
          isSubmitting: false,
          isUploading: false,
          isImageUploading: false,
          uploadProgress: 0,
          imagePreview: null as string | null,
          formErrors: {} as Record<string, string>,
          hasUnsavedChanges: false,
          // Category/Allergen creation state
          isAddingCategory: false,
          isAddingAllergen: false,
          newCategory: { name: "", description: "" },
          newAllergen: { name: "", icon: "" },
          // Form lifecycle
          isFormInitialized: false,
          visitedSteps: new Set(["basic"]) as Set<string>,
        };
      }

      // Load from localStorage for new items
      const savedProgress = loadMenuItemFormProgress();
      if (savedProgress.hasResumed) {
        return {
          // Form data
          formData: {
            name: savedProgress.formData?.name || "",
            description: savedProgress.formData?.description || "",
            price: savedProgress.formData?.price || "",
            category: savedProgress.formData?.category || "",
            preparationTime: savedProgress.formData?.preparationTime || "",
            available: savedProgress.formData?.available ?? true,
            allergens: savedProgress.formData?.allergens || [],
            popular: savedProgress.formData?.popular || false,
            image: "",
          },
          // UI state
          activeTab: savedProgress.activeTab || "basic",
          isSubmitting: false,
          isUploading: false,
          isImageUploading: false,
          uploadProgress: 0,
          imagePreview: null as string | null,
          formErrors: {} as Record<string, string>,
          hasUnsavedChanges: true, // Mark as having unsaved changes
          // Category/Allergen creation state
          isAddingCategory: false,
          isAddingAllergen: false,
          newCategory: { name: "", description: "" },
          newAllergen: { name: "", icon: "" },
          // Form lifecycle
          isFormInitialized: true,
          visitedSteps: new Set([
            savedProgress.activeTab || "basic",
          ]) as Set<string>,
        };
      }

      // Default state for new items
      return {
        // Form data
        formData: {
          name: "",
          description: "",
          price: "",
          category: "",
          preparationTime: "",
          available: true,
          allergens: [] as string[],
          popular: false,
          image: "",
        },
        // UI state
        activeTab: "basic",
        isSubmitting: false,
        isUploading: false,
        isImageUploading: false,
        uploadProgress: 0,
        imagePreview: null as string | null,
        formErrors: {} as Record<string, string>,
        hasUnsavedChanges: false,
        // Category/Allergen creation state
        isAddingCategory: false,
        isAddingAllergen: false,
        newCategory: { name: "", description: "" },
        newAllergen: { name: "", icon: "" },
        // Form lifecycle
        isFormInitialized: false,
        visitedSteps: new Set(["basic"]) as Set<string>,
      };
    });

    // State to track if we've resumed from localStorage
    const [hasResumed, setHasResumed] = useState(() => {
      if (item) return false; // Don't show resume message for editing
      const savedProgress = loadMenuItemFormProgress();
      return savedProgress.hasResumed;
    });

    // Refs for stable references
    const activeTabRef = useRef(formState.activeTab);
    const formDataRef = useRef(formState.formData);
    const isAutoSelectingRef = useRef(false);

    // Update refs when state changes
    useEffect(() => {
      activeTabRef.current = formState.activeTab;
      formDataRef.current = formState.formData;
    }, [formState.activeTab, formState.formData]);

    // Save form progress to localStorage whenever form data or active tab changes
    useEffect(() => {
      // Don't save during auto-selection to prevent triggering resume toast
      if (isAutoSelectingRef.current) {
        console.log("Skipping localStorage save during auto-selection");
        return;
      }

      // Add a small delay to prevent immediate saves after auto-selection
      const timeoutId = setTimeout(() => {
        // Only save for new items, not when editing
        if (!item && formState.isFormInitialized) {
          saveMenuItemFormProgress(
            formState.formData,
            formState.activeTab,
            false
          );
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [
      formState.formData,
      formState.activeTab,
      formState.isFormInitialized,
      item,
    ]);

    // Show resume notification if we have resumed data (only once per session)
    useEffect(() => {
      // Don't show resume toast during auto-selection
      if (isAutoSelectingRef.current) {
        console.log("Skipping resume toast during auto-selection");
        return;
      }

      if (hasResumed && !item) {
        // Check if we've already shown the toast in this session
        const hasShownToast = sessionStorage.getItem(
          "menu-form-resume-toast-shown"
        );
        if (!hasShownToast) {
          sessionStorage.setItem("menu-form-resume-toast-shown", "true");
          setTimeout(() => {
            toast.info(
              "Welcome back! Your previous progress has been restored.",
              {
                duration: 4000,
              }
            );
          }, 1000);
        }
      }
    }, [hasResumed, item]);

    // Simplified form initialization - only run once when component mounts or item changes
    useEffect(() => {
      // Skip initialization if we're adding categories/allergens
      if (isAddingCategoryOrAllergen) {
        // This is the parent's state
        console.log(
          "Skipping form initialization during category/allergen addition"
        );
        return;
      }

      // Skip if we're in the middle of auto-selection
      if (isAutoSelectingRef.current) {
        console.log(
          "Skipping form initialization - auto-selection in progress"
        );
        return;
      }

      // Only initialize once when the component mounts or when switching between add/edit modes
      if (item) {
        // For editing, set the form data
        setFormState((prev) => ({
          ...prev,
          formData: {
            name: item.name || "",
            description: item.description || "",
            price: item.price?.toString() || "",
            category: item.categoryId || "",
            preparationTime: item.preparationTime?.toString() || "",
            available: item.available ?? true,
            allergens: item.allergenIds || [],
            popular: item.popular || false,
            image: item.image || "",
          },
          // Only reset tab if we're not on details or image tab (preserve user's current step)
          activeTab:
            activeTabRef.current === "basic" ? "basic" : activeTabRef.current,
          isFormInitialized: true,
        }));
      } else if (!formState.isFormInitialized) {
        // For new items, only initialize once
        setFormState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            category: menuCategories.length > 0 ? menuCategories[0].id : "",
          },
          isFormInitialized: true,
        }));
      }
    }, [item?.id, isAddingCategoryOrAllergen]); // Added parent's state dependency

    // Update category when categories are loaded (only if not already set and form is initialized)
    useEffect(() => {
      // Skip if we're adding categories/allergens to prevent form reset
      if (isAddingCategoryOrAllergen) {
        // This is the parent's state
        console.log(
          "Skipping category update during category/allergen addition"
        );
        return;
      }

      // Skip if we're on details tab and have a category selected (preserve user's choice)
      if (formState.activeTab === "details" && formState.formData.category) {
        console.log("Skipping category update - user has selected a category");
        return;
      }

      // Skip if we're in the middle of auto-selection
      if (isAutoSelectingRef.current) {
        console.log("Skipping category update - auto-selection in progress");
        return;
      }

      if (
        !item &&
        formState.isFormInitialized &&
        menuCategories.length > 0 &&
        !formState.formData.category
      ) {
        setFormState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            category: menuCategories[0].id,
          },
        }));
      }
    }, [
      menuCategories,
      item,
      formState.formData.category,
      formState.isFormInitialized,
      formState.activeTab, // Added activeTab dependency
      isAddingCategoryOrAllergen, // Added parent's state dependency
    ]);

    // Populate form when editing an existing item
    useEffect(() => {
      if (item && !formState.isFormInitialized) {
        setFormState((prev) => ({
          ...prev,
          formData: {
            name: item.name || "",
            description: item.description || "",
            price: item.price?.toString() || "",
            category: item.categoryId || "",
            preparationTime: item.preparationTime?.toString() || "",
            available: item.available ?? true,
            allergens: item.allergenIds || [],
            popular: item.popular || false,
            image: item.image || "",
          },
          isFormInitialized: true,
          visitedSteps: new Set(["basic", "details", "image"]),
        }));
      }
    }, [item, formState.isFormInitialized]);

    // Helper functions to check step completion
    const isStep1Completed = useCallback(() => {
      return (
        formState.formData.name.trim() &&
        formState.formData.price &&
        formState.formData.preparationTime
      );
    }, [
      formState.formData.name,
      formState.formData.price,
      formState.formData.preparationTime,
    ]);

    const isStep2Completed = useCallback(() => {
      return isStep1Completed() && formState.formData.category;
    }, [isStep1Completed, formState.formData.category]);

    // Validate step completion before allowing tab changes
    const handleTabChange = useCallback(
      (newTab: string) => {
        // Prevent moving to step 2 without completing step 1
        if (newTab === "details" && formState.activeTab === "basic") {
          const step1Validation = () => {
            const errors: Record<string, string> = {};

            if (!formState.formData.name.trim()) {
              errors.name = "Name is required";
            }
            if (
              !formState.formData.price ||
              parseFloat(formState.formData.price) <= 0
            ) {
              errors.price = "Valid price is required";
            }
            if (
              !formState.formData.preparationTime ||
              parseInt(formState.formData.preparationTime) <= 0
            ) {
              errors.preparationTime = "Preparation time is required";
            }

            setFormState((prev) => ({ ...prev, formErrors: errors }));
            return Object.keys(errors).length === 0;
          };

          if (!step1Validation()) {
            toast.error(
              "Please complete step 1 (Basic Info) before proceeding to step 2"
            );
            return;
          }
        }

        // Prevent moving to step 3 without completing step 2
        if (newTab === "image" && formState.activeTab === "details") {
          const step2Validation = () => {
            const errors: Record<string, string> = {};

            if (!formState.formData.category) {
              errors.category = "Category is required";
            }

            setFormState((prev) => ({ ...prev, formErrors: errors }));
            return Object.keys(errors).length === 0;
          };

          if (!step2Validation()) {
            toast.error(
              "Please complete step 2 (Details) before proceeding to step 3"
            );
            return;
          }
        }

        // Prevent moving to step 3 from step 1 (skip step 2)
        if (newTab === "image" && formState.activeTab === "basic") {
          toast.error(
            "Please complete step 2 (Details) before proceeding to step 3"
          );
          return;
        }

        setFormState((prev) => ({
          ...prev,
          activeTab: newTab,
          visitedSteps: new Set([...prev.visitedSteps, newTab]),
          formErrors: {}, // Clear errors when switching tabs
        }));
      },
      [formState.activeTab, formState.formData]
    );

    // Enhanced category and allergen management with better race condition handling
    const handleAddCategory = useCallback(async () => {
      if (!formState.newCategory.name.trim()) {
        toast.error("Category name is required");
        return;
      }

      try {
        // Set flag to prevent tab reset during category addition
        parentSetIsAddingCategoryOrAllergen(true);

        // Create FormData for the new category
        const formData = new FormData();
        formData.append("name", formState.newCategory.name.trim());
        formData.append(
          "description",
          formState.newCategory.description.trim()
        );

        // Store the category name for auto-selection
        const categoryName = formState.newCategory.name.trim();

        // Call the createCategory action directly to get the result
        const { createCategory } = await import("@/lib/actions/menu");
        const result = await createCategory(formData);

        if (result.error) {
          throw new Error(result.error);
        }

        // Clear the form immediately
        setFormState((prev) => ({
          ...prev,
          newCategory: { name: "", description: "" },
          isAddingCategory: false,
        }));

        // Manually add the category to the store to avoid WebSocket interference
        const newCategory = {
          id: result.data?.id || `temp-${Date.now()}`,
          name: categoryName,
          description: formState.newCategory.description.trim(),
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update the store manually
        useMenuSettings.setState((state) => ({
          categories: [...state.categories, newCategory],
        }));

        console.log("Manually added category to store:", newCategory);

        // Set auto-selection flag to prevent interference
        isAutoSelectingRef.current = true;

        // Auto-select the newly created category immediately
        setFormState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            category: newCategory.id,
          },
          // Ensure we stay on the details tab
          activeTab: "details",
          visitedSteps: new Set([...prev.visitedSteps, "details"]),
        }));

        console.log("Auto-selected newly created category:", newCategory);

        // Show success toast (only show this one, not the store's toast)
        toast.success("Category added and selected!");

        // Reset the flags after a longer delay to ensure state updates are processed
        // This prevents localStorage saves and resume toasts during auto-selection
        setTimeout(() => {
          parentSetIsAddingCategoryOrAllergen(false);
          isAutoSelectingRef.current = false;
          console.log("Auto-selection flags reset");
        }, 1000);

        // Flag is already reset above, no need to reset again
        console.log("Category addition completed");
      } catch (error: any) {
        console.error("Error adding category:", error);
        toast.error(error.message || "Failed to add category");
        // Reset the flag on error
        parentSetIsAddingCategoryOrAllergen(false);
        isAutoSelectingRef.current = false;
      }
    }, [formState.newCategory, addCategory]);

    const handleAddAllergen = useCallback(async () => {
      if (!formState.newAllergen.name.trim()) {
        toast.error("Allergen name is required");
        return;
      }

      try {
        // Set flag to prevent tab reset during allergen addition
        parentSetIsAddingCategoryOrAllergen(true);

        // Create FormData for the new allergen
        const formData = new FormData();
        formData.append("name", formState.newAllergen.name.trim());
        formData.append("icon", formState.newAllergen.icon || "⚠️");

        // Store the allergen name for auto-selection
        const allergenName = formState.newAllergen.name.trim();

        // Call the createAllergen action directly to get the result
        const { createAllergen } = await import("@/lib/actions/menu");
        const result = await createAllergen(formData);

        if (result.error) {
          throw new Error(result.error);
        }

        // Clear the form immediately
        setFormState((prev) => ({
          ...prev,
          newAllergen: { name: "", icon: "" },
          isAddingAllergen: false,
        }));

        // Manually add the allergen to the store to avoid WebSocket interference
        const newAllergen = {
          id: result.data?.id || `temp-${Date.now()}`,
          name: allergenName,
          icon: formState.newAllergen.icon || "⚠️",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update the store manually
        useMenuSettings.setState((state) => ({
          allergens: [...state.allergens, newAllergen],
        }));

        console.log("Manually added allergen to store:", newAllergen);

        // Set auto-selection flag to prevent interference
        isAutoSelectingRef.current = true;

        // Auto-select the newly created allergen immediately
        setFormState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            allergens: [...prev.formData.allergens, newAllergen.id],
          },
          // Ensure we stay on the details tab
          activeTab: "details",
          visitedSteps: new Set([...prev.visitedSteps, "details"]),
        }));

        console.log("Auto-selected newly created allergen:", newAllergen);

        // Show success toast (only show this one, not the store's toast)
        toast.success("Allergen added and selected!");

        // Reset the flags after a longer delay to ensure state updates are processed
        // This prevents localStorage saves and resume toasts during auto-selection
        setTimeout(() => {
          parentSetIsAddingCategoryOrAllergen(false);
          isAutoSelectingRef.current = false;
          console.log("Auto-selection flags reset");
        }, 1000);

        // Flag is already reset above, no need to reset again
        console.log("Allergen addition completed");
      } catch (error: any) {
        console.error("Error adding allergen:", error);
        toast.error(error.message || "Failed to add allergen");
        // Reset the flag on error
        parentSetIsAddingCategoryOrAllergen(false);
        isAutoSelectingRef.current = false;
      }
    }, [formState.newAllergen, addAllergen]);

    // Reset form data function
    const resetForm = useCallback(() => {
      setFormState((prev) => ({
        ...prev,
        formData: {
          name: "",
          description: "",
          price: "",
          category: menuCategories.length > 0 ? menuCategories[0].id : "",
          preparationTime: "",
          available: true,
          allergens: [],
          popular: false,
          image: "",
        },
        activeTab: "basic",
        formErrors: {},
        isFormInitialized: false,
        visitedSteps: new Set(["basic"]),
      }));
    }, [menuCategories.length]);

    // Simplified form data management
    const updateFormData = useCallback(
      (updates: Partial<typeof formState.formData>) => {
        setFormState((prev) => {
          const newFormData = { ...prev.formData, ...updates };
          const newFormErrors = { ...prev.formErrors };

          // Clear errors when user starts typing
          if (updates.name && newFormErrors.name) delete newFormErrors.name;
          if (updates.price && newFormErrors.price) delete newFormErrors.price;
          if (updates.preparationTime && newFormErrors.preparationTime)
            delete newFormErrors.preparationTime;
          if (updates.category && newFormErrors.category)
            delete newFormErrors.category;

          return {
            ...prev,
            formData: newFormData,
            formErrors: newFormErrors,
            hasUnsavedChanges: true,
          };
        });
      },
      []
    );

    // Separate function for image updates
    const updateImageData = useCallback((imageUrl: string) => {
      setFormState((prev) => ({
        ...prev,
        formData: { ...prev.formData, image: imageUrl },
        hasUnsavedChanges: true,
      }));
    }, []);

    // Form validation
    const validateForm = useCallback(() => {
      const errors: Record<string, string> = {};

      // Only validate fields that are relevant to the current tab
      if (formState.activeTab === "basic") {
        if (!formState.formData.name.trim()) {
          errors.name = "Name is required";
        }

        if (
          !formState.formData.price ||
          parseFloat(formState.formData.price) <= 0
        ) {
          errors.price = "Valid price is required";
        }

        if (
          !formState.formData.preparationTime ||
          parseInt(formState.formData.preparationTime) <= 0
        ) {
          errors.preparationTime = "Preparation time is required";
        }
      }

      // Validate category only when on details tab or when submitting
      if (
        formState.activeTab === "details" ||
        formState.activeTab === "image"
      ) {
        if (!formState.formData.category) {
          errors.category = "Category is required";
        }
      }

      setFormState((prev) => ({ ...prev, formErrors: errors }));

      // Debug: Log validation errors if any
      if (Object.keys(errors).length > 0) {
        console.log("Form validation errors:", errors);
        console.log("Current form data:", formState.formData);
        console.log("Current active tab:", formState.activeTab);
      }

      return Object.keys(errors).length === 0;
    }, [formState.activeTab, formState.formData]);

    // Clear category error when user selects a category
    const handleCategoryChange = useCallback(
      (value: string) => {
        updateFormData({ category: value });
        setFormState((prev) => {
          const newFormErrors = { ...prev.formErrors };
          if (newFormErrors.category) delete newFormErrors.category;
          return { ...prev, formErrors: newFormErrors };
        });
      },
      [updateFormData]
    );

    // Function to clear all form errors
    const clearAllErrors = useCallback(() => {
      setFormState((prev) => ({ ...prev, formErrors: {} }));
    }, []);

    // Enhanced image upload with progress
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Comprehensive file validation (consistent with other uploads)

        // Check if file is empty
        if (file.size === 0) {
          toast.error("File is empty");
          return;
        }

        // Check if file is corrupted
        if (file.size < 10) {
          toast.error("File appears to be corrupted or empty");
          return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File size exceeds 5MB limit");
          return;
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          toast.error("Image must be a JPEG, PNG, or WebP image");
          return;
        }

        // Validate file extension
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (
          !fileExtension ||
          !["jpg", "jpeg", "png", "webp"].includes(fileExtension)
        ) {
          toast.error("Invalid file extension. Allowed: jpg, jpeg, png, webp");
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormState((prev) => ({
            ...prev,
            imagePreview: e.target?.result as string,
          }));
        };
        reader.onerror = () => {
          toast.error("Failed to read file. Please try a different image.");
          return;
        };
        reader.readAsDataURL(file);

        setFormState((prev) => ({
          ...prev,
          isUploading: true,
          isImageUploading: true,
          uploadProgress: 0,
        }));

        try {
          // Simulate upload progress with proper bounds
          const progressInterval = setInterval(() => {
            setFormState((prev) => ({
              ...prev,
              uploadProgress: Math.min(prev.uploadProgress + 10, 90), // Cap at 90% until actual completion
            }));
          }, 200);

          const result = await uploadImage(file, "menu-item");

          // Clear interval and set to 100% on completion
          clearInterval(progressInterval);
          setFormState((prev) => ({ ...prev, uploadProgress: 100 }));

          if (result.error) {
            toast.error(result.error);
            setFormState((prev) => ({ ...prev, imagePreview: null }));
          } else {
            // Update image data using the dedicated function
            updateImageData(result.url || "");
            toast.success("Image uploaded successfully");

            // Keep preview for a moment to show success, then clear
            setTimeout(
              () => setFormState((prev) => ({ ...prev, imagePreview: null })),
              2000
            );

            // Debug: Log successful upload
            console.log("Image upload completed successfully:", {
              imageUrl: result.url,
              formData: formDataRef.current,
              activeTab: activeTabRef.current,
            });
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload image. Please try again.");
          setFormState((prev) => ({ ...prev, imagePreview: null }));
        } finally {
          // Reset upload states
          setFormState((prev) => ({
            ...prev,
            isUploading: false,
            isImageUploading: false,
            uploadProgress: 0,
          }));
        }
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } =
      useDropzone({
        onDrop,
        accept: ACCEPTED_IMAGE_TYPES,
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE,
      });

    const handleNext = () => {
      if (formState.activeTab === "basic") {
        setFormState((prev) => ({ ...prev, activeTab: "details" }));
      } else if (formState.activeTab === "details") {
        setFormState((prev) => ({ ...prev, activeTab: "image" }));
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // If not on the last tab, validate current tab and move to next
      if (formState.activeTab !== "image") {
        // Validate current tab before proceeding
        if (formState.activeTab === "basic") {
          if (!validateForm()) {
            // Show specific error message with details
            const errorCount = Object.keys(formState.formErrors).length;
            if (errorCount > 0) {
              toast.error(
                `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} before continuing`
              );
            } else {
              toast.error("Please fix the errors before continuing");
            }
            return;
          }
        } else if (formState.activeTab === "details") {
          // Validate details tab (including category)
          if (!validateForm()) {
            const errorCount = Object.keys(formState.formErrors).length;
            if (errorCount > 0) {
              toast.error(
                `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} before continuing`
              );
            } else {
              toast.error("Please fix the errors before continuing");
            }
            return;
          }
        }
        handleNext();
        return;
      }

      // Final validation on last tab - validate all required fields
      const finalValidation = () => {
        const errors: Record<string, string> = {};

        // Validate all required fields regardless of tab
        if (!formState.formData.name.trim()) {
          errors.name = "Name is required";
        }

        if (
          !formState.formData.price ||
          parseFloat(formState.formData.price) <= 0
        ) {
          errors.price = "Valid price is required";
        }

        if (
          !formState.formData.preparationTime ||
          parseInt(formState.formData.preparationTime) <= 0
        ) {
          errors.preparationTime = "Preparation time is required";
        }

        if (!formState.formData.category) {
          errors.category = "Category is required";
        }

        setFormState((prev) => ({ ...prev, formErrors: errors }));
        return Object.keys(errors).length === 0;
      };

      if (!finalValidation()) {
        toast.error("Please fix the errors before submitting");
        return;
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        // Create FormData for server action
        const formDataToSubmit = new FormData();
        formDataToSubmit.append("name", formState.formData.name);
        formDataToSubmit.append("description", formState.formData.description);
        formDataToSubmit.append("price", formState.formData.price);
        formDataToSubmit.append("category", formState.formData.category);
        formDataToSubmit.append(
          "preparationTime",
          formState.formData.preparationTime
        );
        formDataToSubmit.append(
          "available",
          formState.formData.available.toString()
        );
        formDataToSubmit.append(
          "popular",
          formState.formData.popular.toString()
        );
        formDataToSubmit.append("imageUrl", formState.formData.image);

        // Add allergens
        formState.formData.allergens.forEach((allergenId: string) => {
          formDataToSubmit.append("allergens", allergenId);
        });

        if (item) {
          await updateMenuItem(item.id, formDataToSubmit);
          toast.success("Menu item updated successfully!");

          // Refresh menu items to show the updated item instantly
          await fetchMenuItems();
        } else {
          await addMenuItem(formDataToSubmit);
          toast.success("Menu item added successfully!");

          // Refresh menu items to show the new item instantly
          await fetchMenuItems();

          // Clear localStorage when form is successfully submitted
          clearMenuItemFormProgress();
          // Clear the resume toast flag so it can show again in future sessions
          sessionStorage.removeItem("menu-form-resume-toast-shown");
        }

        setFormState((prev) => ({ ...prev, hasUnsavedChanges: false }));
        onClose();
      } catch (error: any) {
        console.error("Error submitting form:", error);
        toast.error(error.message || "Failed to save menu item");
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    };

    // Handle modal close - preserve localStorage for normal close actions
    const handleClose = () => {
      // For normal close (close button, pressing outside), preserve the data
      // The data will be automatically saved by the useEffect that watches form changes
      onClose();
    };

    // Handle explicit cancel - clear localStorage when user clicks Cancel
    const handleCancel = () => {
      // Clear localStorage when user explicitly cancels
      if (!item) {
        clearMenuItemFormProgress();
        // Clear the resume toast flag so it can show again in future sessions
        sessionStorage.removeItem("menu-form-resume-toast-shown");
        toast.info("Progress cleared. You can start fresh next time.");
      }
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Summary */}
        {Object.keys(formState.formErrors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllErrors}
                className="h-6 px-2 text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(formState.formErrors).map(([field, error]) => (
                <li key={field} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="capitalize">{field}:</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step{" "}
              {formState.activeTab === "basic"
                ? "1"
                : formState.activeTab === "details"
                  ? "2"
                  : "3"}{" "}
              of 3
            </span>
            <span className="text-sm text-muted-foreground">
              {formState.activeTab === "basic"
                ? "Basic Information"
                : formState.activeTab === "details"
                  ? "Details & Settings"
                  : "Image Upload"}
            </span>
          </div>

          {/* Step completion indicators */}
          <div className="flex items-center gap-2 mb-2">
            {/* Step 1: Basic Info */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isStep1Completed() ? "text-green-600" : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  isStep1Completed()
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {isStep1Completed() ? <CheckCircle className="w-3 h-3" /> : "1"}
              </div>
              <span>Basic Info</span>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            {/* Step 2: Details */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isStep2Completed() ? "text-green-600" : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  isStep2Completed()
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {isStep2Completed() ? <CheckCircle className="w-3 h-3" /> : "2"}
              </div>
              <span>Details</span>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            {/* Step 3: Image - Only lights up when user has visited the image tab and step 2 is completed */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isStep2Completed() && formState.visitedSteps.has("image")
                  ? "text-green-600"
                  : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  isStep2Completed() && formState.visitedSteps.has("image")
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {isStep2Completed() && formState.visitedSteps.has("image") ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  "3"
                )}
              </div>
              <span>Image</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  // Step 1 completed: 33%
                  isStep1Completed()
                    ? formState.activeTab === "basic"
                      ? "33%"
                      : // Step 2 completed: 66%
                        isStep2Completed()
                        ? formState.activeTab === "details"
                          ? "66%"
                          : // Step 3: 100%
                            "100%"
                        : // Step 1 completed but step 2 not: 33%
                          "33%"
                    : // No steps completed: 0%
                      "0%",
              }}
            ></div>
          </div>
        </div>

        <Tabs
          value={formState.activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger
              value="basic"
              className={cn(
                "text-sm",
                Object.keys(formState.formErrors).length > 0 &&
                  "text-red-600 border-red-200"
              )}
            >
              <FileText className="w-4 h-4 mr-2" />
              Basic Info
              {Object.keys(formState.formErrors).length > 0 && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className={cn(
                "text-sm",
                // Disable if step 1 is not completed
                !isStep1Completed() && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isStep1Completed()}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Details
              {!isStep1Completed() ? <Lock className="w-3 h-3 ml-1" /> : null}
            </TabsTrigger>
            <TabsTrigger
              value="image"
              className={cn(
                "text-sm",
                // Disable if step 2 is not completed
                !isStep2Completed() && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isStep2Completed()}
            >
              <Image className="w-4 h-4 mr-2" />
              Image
              {!isStep2Completed() ? <Lock className="w-3 h-3 ml-1" /> : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name*
                </Label>
                <Input
                  id="name"
                  value={formState.formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="e.g. Margherita Pizza"
                  required
                  className={cn(
                    "h-10",
                    formState.formErrors.name &&
                      "border-red-500 focus:border-red-500"
                  )}
                />
                {formState.formErrors.name && (
                  <p className="text-sm text-red-500">
                    {formState.formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formState.formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  placeholder="Describe your dish..."
                  className="h-24 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formState.formData.description.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price ({currencySymbol})*
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="price"
                      type="number"
                      step="0.50"
                      min="0"
                      value={formState.formData.price}
                      onChange={(e) =>
                        updateFormData({ price: e.target.value })
                      }
                      placeholder="0.00"
                      className={cn(
                        "pl-10 h-10",
                        formState.formErrors.price &&
                          "border-red-500 focus:border-red-500"
                      )}
                      required
                    />
                  </div>
                  {formState.formErrors.price && (
                    <p className="text-sm text-red-500">
                      {formState.formErrors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="preparationTime"
                    className="text-sm font-medium"
                  >
                    Preparation Time (min)*
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="preparationTime"
                      type="number"
                      min="1"
                      value={formState.formData.preparationTime}
                      onChange={(e) =>
                        updateFormData({ preparationTime: e.target.value })
                      }
                      placeholder="15"
                      className={cn(
                        "pl-10 h-10",
                        formState.formErrors.preparationTime &&
                          "border-red-500 focus:border-red-500"
                      )}
                      required
                    />
                  </div>
                  {formState.formErrors.preparationTime && (
                    <p className="text-sm text-red-500">
                      {formState.formErrors.preparationTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="category"
                    className={cn(
                      formState.formErrors.category && "text-red-600"
                    )}
                  >
                    Category*
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        isAddingCategory: true,
                      }))
                    }
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {formState.isAddingCategory ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      placeholder="Category name"
                      value={formState.newCategory.name}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          newCategory: {
                            ...prev.newCategory,
                            name: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="Category description (optional)"
                      value={formState.newCategory.description}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          newCategory: {
                            ...prev.newCategory,
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={isCategoriesLoading}
                        className="flex-1"
                      >
                        {isCategoriesLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </div>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormState((prev) => ({
                            ...prev,
                            isAddingCategory: false,
                            newCategory: { name: "", description: "" },
                          }));
                        }}
                        disabled={isCategoriesLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Select
                    key={`category-select-${menuCategories.length}-${useMenuSettings.getState().categories.length}-${formState.formData.category}`}
                    value={formState.formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger
                      className={cn(
                        formState.formErrors.category &&
                          "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuCategories.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          No categories available. Please add a category first.
                        </SelectItem>
                      ) : (
                        menuCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {formState.formErrors.category && (
                  <p className="text-sm text-red-500">
                    {formState.formErrors.category}
                    {menuCategories.length > 0 && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Please select a category from the dropdown above.
                      </span>
                    )}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Allergens</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        isAddingAllergen: true,
                      }))
                    }
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {formState.isAddingAllergen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Allergen name"
                        value={formState.newAllergen.name}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            newAllergen: {
                              ...prev.newAllergen,
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                      <Input
                        placeholder="Icon (emoji)"
                        value={formState.newAllergen.icon}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            newAllergen: {
                              ...prev.newAllergen,
                              icon: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAllergen}
                        disabled={isAllergensLoading}
                        className="flex-1"
                      >
                        {isAllergensLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </div>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormState((prev) => ({
                            ...prev,
                            isAddingAllergen: false,
                            newAllergen: { name: "", icon: "" },
                          }));
                        }}
                        disabled={isAllergensLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <ScrollArea
                    key={`allergens-scroll-${menuAllergens.length}-${useMenuSettings.getState().allergens.length}`}
                    className="h-32 rounded-md border"
                  >
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {menuAllergens.length === 0 ? (
                        <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                          Loading allergens...
                        </div>
                      ) : (
                        menuAllergens.map((allergen) => (
                          <div
                            key={allergen.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`allergen-${allergen.id}`}
                              checked={formState.formData.allergens.includes(
                                allergen.id
                              )}
                              onCheckedChange={(checked) => {
                                updateFormData({
                                  allergens: checked
                                    ? [
                                        ...formState.formData.allergens,
                                        allergen.id,
                                      ]
                                    : formState.formData.allergens.filter(
                                        (id: string) => id !== allergen.id
                                      ),
                                });
                              }}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label
                              htmlFor={`allergen-${allergen.id}`}
                              className="text-sm font-normal flex items-center gap-2"
                            >
                              {allergen.icon && (
                                <span
                                  className="text-base"
                                  title={allergen.name}
                                >
                                  {allergen.icon}
                                </span>
                              )}
                              {allergen.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Available</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle if this item is currently available
                    </p>
                  </div>
                  <Switch
                    checked={formState.formData.available}
                    onCheckedChange={(checked) =>
                      updateFormData({ available: checked })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Popular</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark this item as popular to highlight it
                    </p>
                  </div>
                  <Switch
                    checked={formState.formData.popular}
                    onCheckedChange={(checked) =>
                      updateFormData({ popular: checked })
                    }
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Item Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a high-quality image of your dish
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {formState.isUploading && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {formState.uploadProgress >= 100
                              ? "Processing..."
                              : "Uploading image..."}
                          </p>
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(formState.uploadProgress, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Math.min(formState.uploadProgress, 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {formState.imagePreview && !formState.isUploading && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={formState.imagePreview}
                      alt="Image preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Upload Complete
                      </Badge>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">
                      Image uploaded successfully!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This preview will disappear in a moment
                    </p>
                  </div>
                </div>
              )}

              {/* Existing Image */}
              {formState.formData.image &&
              !formState.isUploading &&
              !formState.imagePreview ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={formState.formData.image}
                      alt="Menu item preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => updateFormData({ image: "" })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    disabled={formState.isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : null}

              {/* Upload Area */}
              {!formState.formData.image &&
              !formState.isUploading &&
              !formState.imagePreview ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    "hover:bg-accent/50 hover:border-accent-foreground/20",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    {
                      "border-green-500 bg-green-50":
                        isDragActive && !isDragReject,
                      "border-red-500 bg-red-50": isDragReject,
                      "border-gray-200": !isDragActive && !isDragReject,
                    }
                  )}
                >
                  <input {...getInputProps()} id="image-upload" />

                  <div className="p-8 space-y-4">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-green-50">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">
                          {isDragActive ? (
                            isDragReject ? (
                              <span className="text-red-600">
                                Invalid file type or size
                              </span>
                            ) : (
                              <span className="text-green-600">
                                Drop your image here
                              </span>
                            )
                          ) : (
                            <>
                              Drag and drop your image, or{" "}
                              <span className="text-green-600">browse</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: {bytesToSize(MAX_FILE_SIZE)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-4 px-6 mt-4 bg-accent/50 rounded-md">
                      <div className="text-center">
                        <p className="text-sm font-medium">File Types</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WebP
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Dimensions</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Min: 500x500px
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Aspect Ratio</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          1:1 (Square)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                <p>Tips for better food images:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use natural lighting when possible</li>
                  <li>Ensure the food is in focus</li>
                  <li>
                    Include any special garnishes or presentation elements
                  </li>
                  <li>Shoot from slightly above for best results</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={formState.isSubmitting || formState.isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={formState.isSubmitting || formState.isUploading}
          >
            {formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {item ? "Updating..." : "Adding..."}
              </div>
            ) : formState.activeTab === "image" ? (
              (item ? "Update" : "Add") + " Item"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </form>
    );
  };

  const MenuItemCard = ({
    item,
    onEdit,
    onDelete,
    onToggleVisibility,
    viewMode = "grid",
    isSelected = false,
    onSelect,
    showCheckbox = false,
  }: MenuItemCardProps) => {
    const { currency } = useRestaurantSettings();
    const { categories, allergens } = useMenuSettings();

    const category = categories.find((c) => c.id === item.categoryId);
    const itemAllergens = allergens.filter((a) =>
      item.allergenIds.includes(a.id)
    );

    if (viewMode === "grid") {
      return (
        <Card
          className={cn(
            "group overflow-hidden transition-all duration-300 hover:shadow-lg border-0 relative",
            !item.available && "opacity-75",
            isSelected && "ring-2 ring-blue-500"
          )}
        >
          {showCheckbox && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelect?.(item.id, checked as boolean)
                }
                className="bg-white border-2"
              />
            </div>
          )}
          <motion.div className="relative aspect-[4/3]" whileHover="hover">
            <motion.img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              variants={imageHoverVariants}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute top-3 left-3 flex flex-col gap-1.5"
              initial={{ opacity: 0, x: -20 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.popular && (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                  Popular
                </Badge>
              )}
              <Badge
                variant={item.available ? "default" : "secondary"}
                className={cn(
                  item.available &&
                    "bg-green-500 hover:bg-green-600 text-white border-none",
                  !item.available &&
                    "bg-gray-500 hover:bg-gray-600 text-white border-none"
                )}
              >
                {item.available ? "Available" : "Unavailable"}
              </Badge>
            </motion.div>
            <motion.div
              className="absolute bottom-3 right-3 flex gap-2"
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(item)}
                className="bg-white hover:bg-gray-100 h-8 w-8 p-0"
                asChild
              >
                <motion.div
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Edit className="w-4 h-4" />
                </motion.div>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onToggleVisibility(item)}
                className={cn(
                  "bg-white hover:bg-gray-100 h-8 w-8 p-0",
                  item.available
                    ? "text-green-600 hover:text-green-700"
                    : "text-gray-600 hover:text-gray-700"
                )}
                asChild
              >
                <motion.div
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {item.available ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </motion.div>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDelete(item)}
                className="bg-white hover:bg-gray-100 h-8 w-8 p-0 text-red-600 hover:text-red-700"
                asChild
              >
                <motion.div
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="font-bold text-lg text-green-600 whitespace-nowrap">
                    {currencySymbol}
                    {item.price.toFixed(2)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-gray-50/50">
                    {category?.name || item.category}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.preparationTime} min</span>
                  </div>
                </div>

                {itemAllergens.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {itemAllergens.map((allergen) => (
                      <Badge
                        key={allergen.id}
                        variant="outline"
                        className="bg-amber-50/50 text-amber-700 border-amber-200/70 text-[11px] px-1.5 py-0 flex items-center gap-1"
                      >
                        {allergen.icon && (
                          <span className="text-xs">{allergen.icon}</span>
                        )}
                        {allergen.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        className={cn(
          "group transition-all duration-300 hover:shadow-lg border border-gray-200/80 relative",
          !item.available && "opacity-75",
          isSelected && "ring-2 ring-blue-500"
        )}
      >
        <CardContent className="p-4">
          <div className="flex gap-5">
            {showCheckbox && (
              <div className="flex items-start pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelect?.(item.id, checked as boolean)
                  }
                />
              </div>
            )}
            <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex gap-1.5">
                      {item.popular && (
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                          Popular
                        </Badge>
                      )}
                      <Badge
                        variant={item.available ? "default" : "secondary"}
                        className={cn(
                          item.available &&
                            "bg-green-500 hover:bg-green-600 text-white border-none",
                          !item.available &&
                            "bg-gray-500 hover:bg-gray-600 text-white border-none"
                        )}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2.5">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline" className="bg-gray-50/50">
                        {category?.name || item.category}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.preparationTime} min</span>
                      </div>
                    </div>

                    {itemAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {itemAllergens.map((allergen) => (
                          <Badge
                            key={allergen.id}
                            variant="outline"
                            className="bg-amber-50/50 text-amber-700 border-amber-200/70 text-[11px] px-1.5 py-0 flex items-center gap-1"
                          >
                            {allergen.icon && (
                              <span className="text-xs">{allergen.icon}</span>
                            )}
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-6">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleVisibility(item)}
                      className={cn(
                        "h-8 w-8 p-0 border-gray-200",
                        item.available
                          ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                          : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {item.available ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="font-bold text-2xl text-green-600">
                    {currencySymbol}
                    {item.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div
      className="p-6 space-y-6"
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
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* WebSocket Connection Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700">Live</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-red-700">Offline</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Real-time Updates</p>
                  <p className="text-xs text-muted-foreground">
                    {isConnected
                      ? "Connected - Menu will update automatically"
                      : "Disconnected - Manual refresh required"
                    }
                  </p>
                  {reconnectAttempts > 0 && (
                    <p className="text-xs text-orange-600">
                      Reconnection attempts: {reconnectAttempts}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={cn(
                    "transition-all",
                    isBulkMode && "bg-blue-50 border-blue-200 text-blue-700",
                    isBulkMode &&
                      selectedItems.length === 0 &&
                      "bg-yellow-50 border-yellow-200 text-yellow-700"
                  )}
                >
                  {isBulkMode ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedItems.length > 0
                        ? `Bulk Mode (${selectedItems.length})`
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
                    Select multiple items to perform bulk actions
                  </p>
                  {isBulkMode && selectedItems.length > 0 && (
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
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                // When dialog is closing (close button, pressing outside), preserve data
                setIsAddDialogOpen(false);
              } else {
                setIsAddDialogOpen(true);
              }
            }}
          >
            <div className="flex gap-2">
              {hasMenuItemFormProgress() && (
                <Button
                  variant="outline"
                  className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                  onClick={() => {
                    setIsAddDialogOpen(true);
                    // Don't show toast here since the form will show its own resume toast
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resume Progress
                </Button>
              )}
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" asChild>
                  <motion.div
                    variants={buttonHoverVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </motion.div>
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your menu with details and pricing
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <motion.div
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </motion.div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Menu Actions</h4>

                {/* Phase 2: Advanced Actions */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => setShowExportDialog(true)}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export Menu"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => setShowImportDialog(true)}
                    disabled={isImporting}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? "Importing..." : "Import Menu"}
                  </Button>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Menu URL copied to clipboard");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Menu URL
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Alert for unavailable items */}
      <AnimatePresence>
        {menuItems.some((item) => !item.available) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unavailable Items</AlertTitle>
              <AlertDescription>
                Some menu items are marked as unavailable and won't be shown to
                customers.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{menuStats.totalItems}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Items</p>
                <p className="text-2xl font-bold">{menuStats.availableItems}</p>
              </div>
              <CheckSquare className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Popular Items</p>
                <p className="text-2xl font-bold">{menuStats.popularItems}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Unavailable Items
                </p>
                <p className="text-2xl font-bold">
                  {menuStats.unavailableItems}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & Search Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <motion.div
                    animate={{
                      rotate: searchTerm || activeCategory !== "all" ? 360 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Filter className="h-5 w-5" />
                  </motion.div>
                  Search & Filters
                </CardTitle>
                <CardDescription>
                  Find and organize your menu items
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showAdvancedFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="shrink-0"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  {showAdvancedFilters ? "Hide" : "Show"} Advanced
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("all");
                    setShowUnavailable(true);
                    setPriceRange([0, 1000]);
                    setPreparationTimeRange([0, 120]);
                    setPopularOnly(false);
                    setSortBy("name");
                    setSortOrder("asc");
                    setSelectedItems([]);
                    setIsBulkMode(false);
                    setShowBulkActions(false);
                  }}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Search & Category Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
              {/* Search Input */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  key={`category-filter-${categoriesWithCounts.length}-${categoriesWithCounts.map((c) => c.id).join("-")}`}
                  value={activeCategory}
                  onValueChange={setActiveCategory}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesWithCounts.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={showUnavailable ? "default" : "outline"}
                onClick={() => setShowUnavailable(!showUnavailable)}
                size="sm"
                className={`${
                  showUnavailable ? "bg-green-600 hover:bg-green-700" : ""
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showUnavailable ? "Showing All" : "Available Only"}
              </Button>

              <Button
                variant={popularOnly ? "default" : "outline"}
                onClick={() => setPopularOnly(!popularOnly)}
                size="sm"
                className={`${
                  popularOnly ? "bg-orange-600 hover:bg-orange-700" : ""
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Popular Only
              </Button>

              {categoriesWithCounts.slice(1).map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => setActiveCategory(category.id)}
                  size="sm"
                  className={`${
                    activeCategory === category.id
                      ? "bg-blue-600 hover:bg-blue-700"
                      : ""
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Separator before Advanced Filters */}
            {showAdvancedFilters && <Separator />}

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Advanced Filters
                  </h4>
                </div>

                {/* Sorting & View Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <h5 className="text-sm font-medium text-gray-600">
                      Sorting & Display
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* View Mode */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">View Mode</Label>
                      <Select
                        value={viewMode}
                        onValueChange={(value: "grid" | "list") =>
                          setViewMode(value)
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">List View</SelectItem>
                          <SelectItem value="grid">Grid View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sort By</Label>
                      <Select
                        value={sortBy}
                        onValueChange={(
                          value:
                            | "name"
                            | "price"
                            | "popularity"
                            | "preparationTime"
                        ) => setSortBy(value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="popularity">Popularity</SelectItem>
                          <SelectItem value="preparationTime">
                            Prep Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sort Order</Label>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="h-10 w-full justify-between"
                      >
                        <span>
                          {sortOrder === "asc" ? "Ascending" : "Descending"}
                        </span>
                        <span className="text-lg">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Range Filters */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Slider className="h-4 w-4 text-gray-500" />
                    <h5 className="text-sm font-medium text-gray-600">
                      Range Filters
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price Range */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Price Range
                        </Label>
                        <span className="text-xs text-gray-500">
                          {currencySymbol}
                          {priceRange[0].toFixed(2)} - {currencySymbol}
                          {priceRange[1].toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[priceRange[0], priceRange[1]]}
                        onValueChange={(val: number[]) =>
                          setPriceRange(val as [number, number])
                        }
                        min={0}
                        max={1000}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{currencySymbol}0</span>
                        <span>{currencySymbol}1000</span>
                      </div>
                    </div>

                    {/* Preparation Time */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Prep Time</Label>
                        <span className="text-xs text-gray-500">
                          {preparationTimeRange[0]} - {preparationTimeRange[1]}{" "}
                          min
                        </span>
                      </div>
                      <Slider
                        value={[
                          preparationTimeRange[0],
                          preparationTimeRange[1],
                        ]}
                        onValueChange={(val: number[]) =>
                          setPreparationTimeRange(val as [number, number])
                        }
                        min={0}
                        max={120}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 min</span>
                        <span>120 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {(searchTerm ||
              activeCategory !== "all" ||
              !showUnavailable ||
              popularOnly ||
              priceRange[0] > 0 ||
              priceRange[1] < 1000 ||
              preparationTimeRange[0] > 0 ||
              preparationTimeRange[1] < 120) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Active Filters:
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {activeCategory !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Category:{" "}
                      {
                        categoriesWithCounts.find(
                          (c) => c.id === activeCategory
                        )?.name
                      }
                    </Badge>
                  )}
                  {!showUnavailable && (
                    <Badge variant="secondary" className="text-xs">
                      Available Only
                    </Badge>
                  )}
                  {popularOnly && (
                    <Badge variant="secondary" className="text-xs">
                      Popular Only
                    </Badge>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                    <Badge variant="secondary" className="text-xs">
                      Price: {currencySymbol}
                      {priceRange[0].toFixed(2)} - {currencySymbol}
                      {priceRange[1].toFixed(2)}
                    </Badge>
                  )}
                  {(preparationTimeRange[0] > 0 ||
                    preparationTimeRange[1] < 120) && (
                    <Badge variant="secondary" className="text-xs">
                      Prep Time: {preparationTimeRange[0]} -{" "}
                      {preparationTimeRange[1]} min
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Selection Header */}
      {isBulkMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedItems.length === paginatedItems.length}
              onCheckedChange={handleSelectAll}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {selectedItems.length} of {paginatedItems.length} items selected
              </span>
              {selectedItems.length === 0 && (
                <span className="text-xs text-blue-600">
                  Click on items or use "Select All" to get started
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItems([]);
                setIsBulkMode(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Exit Bulk Mode
            </Button>
          </div>
        </motion.div>
      )}

      {/* Menu Items */}
      <motion.div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        }
        variants={itemVariants}
      >
        <AnimatePresence mode="wait">
          {isLoading
            ? // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            : paginatedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={cardHoverVariants}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MenuItemCard
                    item={item}
                    onEdit={(editedItem: MenuItem) =>
                      setEditingItem(editedItem)
                    }
                    onDelete={(deletedItem: MenuItem) =>
                      setDeleteConfirmItem(deletedItem)
                    }
                    onToggleVisibility={handleToggleVisibility}
                    viewMode={viewMode}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={handleSelectItem}
                    showCheckbox={isBulkMode}
                  />
                </motion.div>
              ))}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {!isLoading && filteredAndSortedItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full"
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Search className="w-12 h-12 text-gray-400" />
                    <h3 className="font-semibold text-lg">
                      {menuItems.length === 0
                        ? "No menu items yet"
                        : "No menu items found"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {menuItems.length === 0
                        ? "Get started by adding your first menu item"
                        : searchTerm
                          ? "Try adjusting your search or filters"
                          : `No ${
                              activeCategory === "all" ? "" : activeCategory
                            } items available`}
                    </p>
                    {menuItems.length === 0 && (
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky bottom-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-sm">
                {selectedItems.length} item
                {selectedItems.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEditDialog(true)}
                disabled={selectedItems.length === 0}
              >
                <Edit className="w-4 h-4 mr-2" />
                Bulk Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkToggleAvailability}
                disabled={selectedItems.length === 0}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Toggle Availability
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedItems.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this menu item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <MenuItemForm
              item={editingItem}
              onClose={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteConfirmItem && (
            <>
              <div className="py-4">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{deleteConfirmItem.name}</strong>?
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmItem) {
                      await removeMenuItem(deleteConfirmItem.id);
                      setDeleteConfirmItem(null);

                      // Refresh menu items to show the updated list instantly
                      await fetchMenuItems();
                    }
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Phase 2: Advanced Feature Dialogs */}

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Menu Items</DialogTitle>
            <DialogDescription>
              Export your menu data in your preferred format. The file will
              include all menu items with their details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Export Stats */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-900">
                    Export Summary
                  </h4>
                  <p className="text-sm text-green-700">
                    {menuStats.totalItems} total items •{" "}
                    {menuStats.availableItems} available •{" "}
                    {menuStats.popularItems} popular
                  </p>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value: "csv" | "json") =>
                  setExportFormat(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                  <SelectItem value="json">
                    JSON (Developer friendly)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Format Details</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {exportFormat === "csv" ? (
                  <>
                    <p>
                      • <strong>CSV Format:</strong> Comma-separated values
                    </p>
                    <p>
                      • <strong>Compatibility:</strong> Excel, Google Sheets,
                      Numbers
                    </p>
                    <p>
                      • <strong>Best for:</strong> Data analysis, sharing with
                      non-technical users
                    </p>
                    <p>
                      • <strong>File extension:</strong> .csv
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      • <strong>JSON Format:</strong> JavaScript Object Notation
                    </p>
                    <p>
                      • <strong>Compatibility:</strong> APIs, databases,
                      development tools
                    </p>
                    <p>
                      • <strong>Best for:</strong> Data migration, backups,
                      integrations
                    </p>
                    <p>
                      • <strong>File extension:</strong> .json
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleExport(exportFormat)}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Menu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Menu Items</DialogTitle>
            <DialogDescription>
              Import menu items from a CSV or JSON file. Download the sample CSV
              to see the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sample CSV Download */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Need help with the format?
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Download our sample CSV file to see the exact format
                    required for importing menu items.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {importFile && (
                <p className="text-sm text-green-600">
                  ✓ Selected: {importFile.name}
                </p>
              )}
            </div>

            {/* Import Guidelines */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Import Guidelines</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • <strong>Required fields:</strong> Name, Price
                </p>
                <p>
                  • <strong>Optional fields:</strong> Description, Category,
                  Preparation Time, Available, Popular, Allergens
                </p>
                <p>
                  • <strong>Price format:</strong> Numbers only (e.g., 12.99)
                </p>
                <p>
                  • <strong>Available/Popular:</strong> Use "Yes" or "No"
                </p>
                <p>
                  • <strong>Categories:</strong> Will be matched by name or
                  created if needed
                </p>
                <p>
                  • <strong>Existing items:</strong> Will be skipped to avoid
                  duplicates
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Menu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Menu Item</DialogTitle>
            <DialogDescription>
              Create a copy of this menu item with "(Copy)" added to the name
            </DialogDescription>
          </DialogHeader>
          {itemToDuplicate && (
            <>
              <div className="py-4">
                <p>
                  Are you sure you want to duplicate{" "}
                  <strong>{itemToDuplicate.name}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The new item will be named "{itemToDuplicate.name} (Copy)"
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDuplicateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmDuplicate} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Item
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Menu Items</DialogTitle>
            <DialogDescription>
              Update multiple menu items at once. Leave fields empty to skip
              changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                key={`bulk-edit-category-${menuCategories.length}-${menuCategories.map((c) => c.id).join("-")}`}
                value={bulkEditData.categoryId}
                onValueChange={(value) =>
                  setBulkEditData((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={
                  bulkEditData.available === null
                    ? ""
                    : bulkEditData.available.toString()
                }
                onValueChange={(value) =>
                  setBulkEditData((prev) => ({
                    ...prev,
                    available: value === "" ? null : value === "true",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Popular Status</Label>
              <Select
                value={
                  bulkEditData.popular === null
                    ? ""
                    : bulkEditData.popular.toString()
                }
                onValueChange={(value) =>
                  setBulkEditData((prev) => ({
                    ...prev,
                    popular: value === "" ? null : value === "true",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Mark as Popular</SelectItem>
                  <SelectItem value="false">Remove Popular Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkEdit}
              disabled={
                isSubmitting ||
                (!bulkEditData.categoryId &&
                  bulkEditData.available === null &&
                  bulkEditData.popular === null)
              }
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update {selectedItems.length} Items
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <motion.div
          className="flex items-center justify-between mt-6"
          variants={itemVariants}
        >
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * itemsPerPage + 1} to{" "}
            {Math.min(page * itemsPerPage, filteredAndSortedItems.length)} of{" "}
            {filteredAndSortedItems.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Wrap with error boundary and add connection status
export default function MenuPageWithErrorBoundary() {
  return (
    <MenuErrorBoundary>
      <MenuPage />
    </MenuErrorBoundary>
  );
}

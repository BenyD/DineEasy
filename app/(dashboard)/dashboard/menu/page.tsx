"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Custom hook for debouncing
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
  onDuplicate?: (item: MenuItem) => void;
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

export default function MenuPage() {
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

  const { currency, currencySymbol } = useRestaurantSettings();
  const {
    menuItems,
    categories: menuCategories,
    allergens: menuAllergens,
    isLoading,
    error,
    fetchMenuItems,
    fetchCategories,
    fetchAllergens,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addCategory,
    addAllergen,
  } = useMenuSettings();

  // Debounced search
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

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedItems.length === filteredAndSortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAndSortedItems.map((item) => item.id));
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

      // Delete items
      for (const itemId of selectedItems) {
        await removeMenuItem(itemId);
      }

      setSelectedItems([]);
      setIsBulkMode(false);
      toast.success(`Successfully deleted ${selectedItems.length} item(s)`);
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
      "Preparation Time",
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

      if (importFile.name.endsWith(".csv")) {
        // Parse CSV
        const lines = text.split("\n");
        const headers = lines[0]
          .split(",")
          .map((h) => h.replace(/"/g, "").trim());
        importedItems = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
          const item: any = {};
          headers.forEach((header, index) => {
            item[header.toLowerCase().replace(/\s+/g, "_")] = values[index];
          });
          return item;
        });
      } else if (importFile.name.endsWith(".json")) {
        // Parse JSON
        importedItems = JSON.parse(text);
      }

      // Validate and process imported items
      let successCount = 0;
      for (const item of importedItems) {
        if (item.name && item.price) {
          const formData = new FormData();
          formData.append("name", item.name);
          formData.append("description", item.description || "");
          formData.append("price", item.price.toString());
          const categoryId = item.category_id || menuCategories[0]?.id;
          if (categoryId) {
            formData.append("categoryId", categoryId);
          }
          formData.append("preparationTime", item.preparation_time || "15");
          formData.append(
            "available",
            item.available === "Yes" ? "true" : "false"
          );
          formData.append("popular", item.popular === "Yes" ? "true" : "false");

          await addMenuItem(formData);
          successCount++;
        }
      }

      toast.success(`Successfully imported ${successCount} items`);
      setImportFile(null);
      setShowImportDialog(false);
    } catch (error) {
      toast.error("Failed to import menu items");
    } finally {
      setIsImporting(false);
    }
  };

  // Duplicate functionality
  const handleDuplicate = (item: MenuItem) => {
    setItemToDuplicate(item);
    setShowDuplicateDialog(true);
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
          formData.append("categoryId", bulkEditData.categoryId);
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

  // Update bulk mode based on selections
  useEffect(() => {
    setIsBulkMode(selectedItems.length > 0);
    setShowBulkActions(selectedItems.length > 0);
  }, [selectedItems]);

  // Show loading state
  if (isLoading) {
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
    // Form state management
    const { currency, currencySymbol } = useRestaurantSettings();
    const { addCategory, addAllergen } = useMenuSettings();
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingAllergen, setIsAddingAllergen] = useState(false);
    const [isAddingCategoryLoading, setIsAddingCategoryLoading] =
      useState(false);
    const [isAddingAllergenLoading, setIsAddingAllergenLoading] =
      useState(false);
    const [newCategory, setNewCategory] = useState({
      name: "",
      description: "",
    });
    const [newAllergen, setNewAllergen] = useState({ name: "", icon: "" });
    const [activeTab, setActiveTab] = useState("basic");

    // Enhanced state management
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    const [formData, setFormData] = useState({
      name: "",
      description: "",
      price: "",
      category: "",
      preparationTime: "",
      available: true,
      allergens: [] as string[],
      popular: false,
      image: "",
    });

    useEffect(() => {
      if (item) {
        // For editing, always set the form data
        setFormData({
          name: item.name || "",
          description: item.description || "",
          price: item.price?.toString() || "",
          category: item.categoryId || "",
          preparationTime: item.preparationTime?.toString() || "",
          available: item.available ?? true,
          allergens: item.allergenIds || [],
          popular: item.popular || false,
          image: item.image || "",
        });
        setIsFormInitialized(true);
      } else if (!isFormInitialized) {
        // For new items, only initialize once
        setFormData({
          name: "",
          description: "",
          price: "",
          category: menuCategories.length > 0 ? menuCategories[0].id : "",
          preparationTime: "",
          available: true,
          allergens: [],
          popular: false,
          image: "",
        });
        setIsFormInitialized(true);
      }
    }, [item, menuCategories, isFormInitialized]);

    // Update category when categories are loaded (only if not already set)
    useEffect(() => {
      if (
        !item &&
        menuCategories.length > 0 &&
        !formData.category &&
        isFormInitialized
      ) {
        setFormData((prev) => ({
          ...prev,
          category: menuCategories[0].id,
        }));
      }
    }, [menuCategories, item, formData.category, isFormInitialized]);

    // Preserve form data when categories/allergens are updated
    useEffect(() => {
      // Don't reset form data when categories/allergens are refreshed
      // This prevents the form from resetting when new items are added
    }, [menuCategories, menuAllergens]);

    // Preserve form data when switching tabs
    const handleTabChange = (newTab: string) => {
      setActiveTab(newTab);
      // Don't reset form data when switching tabs
    };

    // Enhanced category and allergen management
    const handleAddCategory = async () => {
      if (!newCategory.name.trim()) {
        toast.error("Category name is required");
        return;
      }

      setIsAddingCategoryLoading(true);

      try {
        // Create FormData for the new category
        const formData = new FormData();
        formData.append("name", newCategory.name.trim());
        formData.append("description", newCategory.description.trim());

        // Call the addCategory function
        await addCategory(formData);

        // Clear the form
        setNewCategory({ name: "", description: "" });
        setIsAddingCategory(false);

        // The store will automatically refresh categories, but we'll handle it gracefully
        toast.success("Category added successfully!");
      } catch (error: any) {
        console.error("Error adding category:", error);
        toast.error(error.message || "Failed to add category");
      } finally {
        setIsAddingCategoryLoading(false);
      }
    };

    const handleAddAllergen = async () => {
      if (!newAllergen.name.trim()) {
        toast.error("Allergen name is required");
        return;
      }

      setIsAddingAllergenLoading(true);

      try {
        // Create FormData for the new allergen
        const formData = new FormData();
        formData.append("name", newAllergen.name.trim());
        formData.append("icon", newAllergen.icon || "⚠️");

        // Call the addAllergen function
        await addAllergen(formData);

        // Clear the form
        setNewAllergen({ name: "", icon: "" });
        setIsAddingAllergen(false);

        // The store will automatically refresh allergens, but we'll handle it gracefully
        toast.success("Allergen added successfully!");
      } catch (error: any) {
        console.error("Error adding allergen:", error);
        toast.error(error.message || "Failed to add allergen");
      } finally {
        setIsAddingAllergenLoading(false);
      }
    };

    // Preserve active tab when allergens load
    useEffect(() => {
      // This effect ensures the active tab doesn't change when allergens load
      // The activeTab state is already stable and doesn't need to be reset
    }, [menuAllergens]);

    // Reset form when switching between add and edit modes
    useEffect(() => {
      if (!item) {
        // Reset to basic tab for new items
        setActiveTab("basic");
        // Reset form initialization flag when opening new item modal
        setIsFormInitialized(false);
      } else {
        // Reset form initialization flag when opening edit modal
        setIsFormInitialized(false);
      }
    }, [item]);

    // Reset form data function
    const resetForm = () => {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: menuCategories.length > 0 ? menuCategories[0].id : "",
        preparationTime: "",
        available: true,
        allergens: [],
        popular: false,
        image: "",
      });
      setActiveTab("basic");
    };

    // Enhanced form data management
    const updateFormData = (updates: Partial<typeof formData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      setHasUnsavedChanges(true);
      // Clear errors when user starts typing
      if (updates.name && formErrors.name)
        setFormErrors((prev) => ({ ...prev, name: "" }));
      if (updates.price && formErrors.price)
        setFormErrors((prev) => ({ ...prev, price: "" }));
      if (updates.preparationTime && formErrors.preparationTime)
        setFormErrors((prev) => ({ ...prev, preparationTime: "" }));
    };

    // Form validation
    const validateForm = () => {
      const errors: Record<string, string> = {};

      if (!formData.name.trim()) {
        errors.name = "Name is required";
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = "Valid price is required";
      }

      if (
        !formData.preparationTime ||
        parseInt(formData.preparationTime) <= 0
      ) {
        errors.preparationTime = "Preparation time is required";
      }

      if (!formData.category) {
        errors.category = "Category is required";
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    // Clear category error when user selects a category
    const handleCategoryChange = (value: string) => {
      updateFormData({ category: value });
      if (formErrors.category) {
        setFormErrors((prev) => ({ ...prev, category: "" }));
      }
    };

    // Enhanced image upload with progress
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File size exceeds 5MB limit");
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 200);

          const result = await uploadImage(file, "menu-item");

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (result.error) {
            toast.error(result.error);
            setImagePreview(null);
          } else {
            updateFormData({ image: result.url || "" });
            toast.success("Image uploaded successfully");

            // Clear preview after successful upload
            setTimeout(() => setImagePreview(null), 1000);
          }
        } catch (error) {
          toast.error("Failed to upload image");
          setImagePreview(null);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
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
      if (activeTab === "basic") {
        setActiveTab("details");
      } else if (activeTab === "details") {
        setActiveTab("image");
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // If not on the last tab, validate current tab and move to next
      if (activeTab !== "image") {
        // Validate current tab before proceeding
        if (activeTab === "basic") {
          if (!validateForm()) {
            toast.error("Please fix the errors before continuing");
            return;
          }
        }
        handleNext();
        return;
      }

      // Final validation on last tab
      if (!validateForm()) {
        toast.error("Please fix the errors before submitting");
        return;
      }

      setIsSubmitting(true);

      try {
        // Create FormData for server action
        const formDataToSubmit = new FormData();
        formDataToSubmit.append("name", formData.name);
        formDataToSubmit.append("description", formData.description);
        formDataToSubmit.append("price", formData.price);
        formDataToSubmit.append("category", formData.category);
        formDataToSubmit.append("preparationTime", formData.preparationTime);
        formDataToSubmit.append("available", formData.available.toString());
        formDataToSubmit.append("popular", formData.popular.toString());
        formDataToSubmit.append("imageUrl", formData.image);

        // Add allergens
        formData.allergens.forEach((allergenId) => {
          formDataToSubmit.append("allergens", allergenId);
        });

        if (item) {
          await updateMenuItem(item.id, formDataToSubmit);
          toast.success("Menu item updated successfully!");
        } else {
          await addMenuItem(formDataToSubmit);
          toast.success("Menu item added successfully!");
        }

        setHasUnsavedChanges(false);
        onClose();
      } catch (error: any) {
        console.error("Error submitting form:", error);
        toast.error(error.message || "Failed to save menu item");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form
        key={item ? `edit-${item.id}` : "new"}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step{" "}
              {activeTab === "basic"
                ? "1"
                : activeTab === "details"
                  ? "2"
                  : "3"}{" "}
              of 3
            </span>
            <span className="text-sm text-muted-foreground">
              {activeTab === "basic"
                ? "Basic Information"
                : activeTab === "details"
                  ? "Details & Settings"
                  : "Image Upload"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  activeTab === "basic"
                    ? "33%"
                    : activeTab === "details"
                      ? "66%"
                      : "100%",
              }}
            ></div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic" className="text-sm">
              <FileText className="w-4 h-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="details" className="text-sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="image" className="text-sm">
              <Image className="w-4 h-4 mr-2" />
              Image
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
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="e.g. Margherita Pizza"
                  required
                  className={cn(
                    "h-10",
                    formErrors.name && "border-red-500 focus:border-red-500"
                  )}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  placeholder="Describe your dish..."
                  className="h-24 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
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
                      value={formData.price}
                      onChange={(e) =>
                        updateFormData({ price: e.target.value })
                      }
                      placeholder="0.00"
                      className={cn(
                        "pl-10 h-10",
                        formErrors.price &&
                          "border-red-500 focus:border-red-500"
                      )}
                      required
                    />
                  </div>
                  {formErrors.price && (
                    <p className="text-sm text-red-500">{formErrors.price}</p>
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
                      value={formData.preparationTime}
                      onChange={(e) =>
                        updateFormData({ preparationTime: e.target.value })
                      }
                      placeholder="15"
                      className={cn(
                        "pl-10 h-10",
                        formErrors.preparationTime &&
                          "border-red-500 focus:border-red-500"
                      )}
                      required
                    />
                  </div>
                  {formErrors.preparationTime && (
                    <p className="text-sm text-red-500">
                      {formErrors.preparationTime}
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
                  <Label htmlFor="category">Category*</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(true)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {isAddingCategory ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Category description (optional)"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={isAddingCategoryLoading}
                        className="flex-1"
                      >
                        {isAddingCategoryLoading ? (
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
                          setIsAddingCategory(false);
                          setNewCategory({ name: "", description: "" });
                        }}
                        disabled={isAddingCategoryLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger
                      className={cn(
                        formErrors.category &&
                          "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuCategories.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Loading categories...
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
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
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
                    onClick={() => setIsAddingAllergen(true)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {isAddingAllergen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Allergen name"
                        value={newAllergen.name}
                        onChange={(e) =>
                          setNewAllergen({
                            ...newAllergen,
                            name: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Icon (emoji)"
                        value={newAllergen.icon}
                        onChange={(e) =>
                          setNewAllergen({
                            ...newAllergen,
                            icon: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAllergen}
                        disabled={isAddingAllergenLoading}
                        className="flex-1"
                      >
                        {isAddingAllergenLoading ? (
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
                          setIsAddingAllergen(false);
                          setNewAllergen({ name: "", icon: "" });
                        }}
                        disabled={isAddingAllergenLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <ScrollArea className="h-32 rounded-md border">
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
                              checked={formData.allergens.includes(allergen.id)}
                              onCheckedChange={(checked) => {
                                updateFormData({
                                  allergens: checked
                                    ? [...formData.allergens, allergen.id]
                                    : formData.allergens.filter(
                                        (id) => id !== allergen.id
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
                    checked={formData.available}
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
                    checked={formData.popular}
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
              {isUploading && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Uploading image...
                          </p>
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {uploadProgress}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && !isUploading && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Image preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <Badge className="bg-green-600 text-white">
                        <Upload className="w-3 h-3 mr-1" />
                        Uploading...
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Image */}
              {formData.image && !isUploading && !imagePreview ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={formData.image}
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
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                </div>
              ) : null}

              {/* Upload Area */}
              {!formData.image && !isUploading && !imagePreview ? (
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
            onClick={onClose}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {item ? "Updating..." : "Adding..."}
              </div>
            ) : activeTab === "image" ? (
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
    onDuplicate,
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
              {onDuplicate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDuplicate(item)}
                  className="bg-white hover:bg-gray-100 h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  asChild
                >
                  <motion.div
                    variants={buttonHoverVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.div>
                </Button>
              )}
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
                    {onDuplicate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate(item)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
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
          <Button
            variant="outline"
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={cn(
              "transition-all",
              isBulkMode && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            {isBulkMode ? (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Bulk Mode
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Bulk Mode
              </>
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
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

            {/* Quick Filters & View Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
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

              {/* Compact View & Sort Controls */}
              <div className="flex items-center gap-2">
                <Select
                  value={viewMode}
                  onValueChange={(value: "grid" | "list") => setViewMode(value)}
                >
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(
                    value: "name" | "price" | "popularity" | "preparationTime"
                  ) => setSortBy(value)}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="popularity">Popular</SelectItem>
                    <SelectItem value="preparationTime">Prep Time</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="h-8 w-8 p-0"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Advanced Filters
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Price Range</Label>
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
                      value={[preparationTimeRange[0], preparationTimeRange[1]]}
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
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Active Filters:
                  </span>
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
              checked={selectedItems.length === filteredAndSortedItems.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedItems.length} of {filteredAndSortedItems.length} items
              selected
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedItems([]);
              setIsBulkMode(false);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
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
            : filteredAndSortedItems.map((item, index) => (
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
                    onDuplicate={handleDuplicate}
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
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowBulkEditDialog(true)}
            disabled={selectedItems.length === 0 || isSubmitting}
          >
            <Edit className="w-4 h-4 mr-2" />
            Bulk Edit ({selectedItems.length})
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkToggleAvailability}
            disabled={selectedItems.length === 0 || isSubmitting}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Toggle Availability ({selectedItems.length})
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkDelete}
            disabled={selectedItems.length === 0 || isSubmitting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected ({selectedItems.length})
          </Button>
        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Menu</DialogTitle>
            <DialogDescription>
              Choose the format to export your menu data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="text-sm text-muted-foreground">
              <p>• CSV: Best for spreadsheet applications</p>
              <p>• JSON: Best for data migration and backups</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Menu</DialogTitle>
            <DialogDescription>
              Import menu items from a CSV or JSON file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Supported formats: CSV, JSON</p>
              <p>
                • CSV should have headers: Name, Description, Price, Category,
                etc.
              </p>
              <p>• Existing items with the same name will be skipped</p>
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
    </motion.div>
  );
}

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types";

export interface MenuFiltersEnhancedProps {
  // Filter state
  searchTerm: string;
  categoryId: string;
  available?: boolean;
  popular?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  viewMode: "grid" | "list";

  // Actions
  onSearchChange: (term: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onAvailabilityChange: (available?: boolean) => void;
  onPopularChange: (popular?: boolean) => void;
  onPriceRangeChange: (min?: number, max?: number) => void;
  onSortingChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onClearFilters: () => void;

  // Data
  categories: MenuCategory[];
  totalItems: number;
  filteredCount: number;

  // UI state
  loading?: boolean;
  className?: string;

  // Currency
  currencySymbol?: string;
}

const filterVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export function MenuFiltersEnhanced({
  searchTerm,
  categoryId,
  available,
  popular,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
  viewMode,
  onSearchChange,
  onCategoryChange,
  onAvailabilityChange,
  onPopularChange,
  onPriceRangeChange,
  onSortingChange,
  onViewModeChange,
  onClearFilters,
  categories,
  totalItems,
  filteredCount,
  loading = false,
  className,
  currencySymbol = "CHF",
}: MenuFiltersEnhancedProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search effect
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearchTerm(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  // Memoized category options
  const categoryOptions = useMemo(
    () => [
      { id: "all", name: "All Categories", count: totalItems },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: 0, // This would need to be calculated from the data
      })),
    ],
    [categories, totalItems]
  );

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryId !== "all") count++;
    if (available !== undefined) count++;
    if (popular !== undefined) count++;
    if (minPrice !== undefined || maxPrice !== undefined) count++;
    return count;
  }, [searchTerm, categoryId, available, popular, minPrice, maxPrice]);

  // Price range options
  const priceRanges = [
    { label: "Any Price", min: undefined, max: undefined },
    { label: `Under ${currencySymbol}10`, min: 0, max: 10 },
    { label: `${currencySymbol}10 - ${currencySymbol}25`, min: 10, max: 25 },
    { label: `${currencySymbol}25 - ${currencySymbol}50`, min: 25, max: 50 },
    { label: `Over ${currencySymbol}50`, min: 50, max: undefined },
  ];

  // Sort options
  const sortOptions = [
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "price-asc", label: "Price (Low to High)" },
    { value: "price-desc", label: "Price (High to Low)" },
    { value: "created_at-desc", label: "Newest First" },
    { value: "created_at-asc", label: "Oldest First" },
  ];

  return (
    <TooltipProvider>
      <motion.div
        className={cn("space-y-4", className)}
        variants={filterVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filters & Search</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  {showAdvancedFilters ? "Hide" : "Show"} Advanced
                </Button>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            {filteredCount !== totalItems && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredCount} of {totalItems} items
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Main filters row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative col-span-full lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={localSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              {/* Category filter */}
              <div className="w-full">
                <Select
                  value={categoryId}
                  onValueChange={onCategoryChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          {category.count > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {category.count}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View mode */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onViewModeChange("grid")}
                      disabled={loading}
                      className={cn(
                        "flex-1",
                        viewMode === "grid"
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                          : "hover:bg-green-50 hover:border-green-200"
                      )}
                      asChild
                    >
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </motion.div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => onViewModeChange("list")}
                      disabled={loading}
                      className={cn(
                        "flex-1",
                        viewMode === "list"
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                          : "hover:bg-green-50 hover:border-green-200"
                      )}
                      asChild
                    >
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <List className="w-4 h-4" />
                      </motion.div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <motion.div
                className="space-y-4 pt-4 border-t"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price range */}
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block">
                      Price Range
                    </Label>
                    <Select
                      value={`${minPrice || ""}-${maxPrice || ""}`}
                      onValueChange={(value) => {
                        const [min, max] = value.split("-");
                        onPriceRangeChange(
                          min ? Number(min) : undefined,
                          max ? Number(max) : undefined
                        );
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any Price" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceRanges.map((range) => (
                          <SelectItem
                            key={`${range.min || ""}-${range.max || ""}`}
                            value={`${range.min || ""}-${range.max || ""}`}
                          >
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sorting */}
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block">
                      Sort By
                    </Label>
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split("-");
                        onSortingChange(field, order as "asc" | "desc");
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability toggle */}
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block">
                      Availability
                    </Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                      <Switch
                        id="availability"
                        checked={available === true}
                        onCheckedChange={(checked) =>
                          onAvailabilityChange(checked ? true : undefined)
                        }
                        disabled={loading}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="availability"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Available only
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Show only available items
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Popular toggle */}
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block">
                      Popularity
                    </Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                      <Switch
                        id="popular"
                        checked={popular === true}
                        onCheckedChange={(checked) =>
                          onPopularChange(checked ? true : undefined)
                        }
                        disabled={loading}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="popular"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Popular only
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Show only popular items
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

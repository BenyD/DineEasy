"use client";

import { useState, useMemo, useCallback } from "react";
import { type MenuItem } from "@/types";

interface UseMenuFiltersProps {
  menuItems: MenuItem[];
  menuCategories: { id: string; name: string }[];
}

interface MenuStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  popularItems: number;
  averagePrice: number;
}

export function useMenuFilters({
  menuItems,
  menuCategories,
}: UseMenuFiltersProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUnavailable, setShowUnavailable] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [preparationTimeRange, setPreparationTimeRange] = useState<
    [number, number]
  >([0, 120]);
  const [popularOnly, setPopularOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "popularity" | "preparationTime"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Categories with counts
  const categoriesWithCounts = useMemo(
    () => [
      { id: "all", name: "All Items", count: menuItems.length },
      ...menuCategories.map((category) => ({
        id: category.id,
        name: category.name,
        count: menuItems.filter((item) => item.categoryId === category.id)
          .length,
      })),
    ],
    [menuItems, menuCategories]
  );

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...menuItems];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((item) => item.categoryId === activeCategory);
    }

    // Apply availability filter
    if (!showUnavailable) {
      filtered = filtered.filter((item) => item.available);
    }

    // Apply price range filter
    filtered = filtered.filter(
      (item) => item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    // Apply preparation time filter
    filtered = filtered.filter(
      (item) =>
        item.preparationTime >= preparationTimeRange[0] &&
        item.preparationTime <= preparationTimeRange[1]
    );

    // Apply popular filter
    if (popularOnly) {
      filtered = filtered.filter((item) => item.popular);
    }

    // Apply sorting
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
    searchTerm,
    activeCategory,
    showUnavailable,
    priceRange,
    preparationTimeRange,
    popularOnly,
    sortBy,
    sortOrder,
  ]);

  // Menu statistics
  const menuStats = useMemo<MenuStats>(() => {
    const totalItems = menuItems.length;
    const availableItems = menuItems.filter((item) => item.available).length;
    const popularItems = menuItems.filter((item) => item.popular).length;
    const totalPrice = menuItems.reduce((sum, item) => sum + item.price, 0);

    return {
      totalItems,
      availableItems,
      unavailableItems: totalItems - availableItems,
      popularItems,
      averagePrice: totalItems > 0 ? totalPrice / totalItems : 0,
    };
  }, [menuItems]);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveCategory("all");
    setShowUnavailable(true);
    setPriceRange([0, 1000]);
    setPreparationTimeRange([0, 120]);
    setPopularOnly(false);
    setSortBy("name");
    setSortOrder("asc");
  }, []);

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    showUnavailable,
    setShowUnavailable,
    priceRange,
    setPriceRange,
    preparationTimeRange,
    setPreparationTimeRange,
    popularOnly,
    setPopularOnly,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Computed values
    categoriesWithCounts,
    filteredAndSortedItems,
    menuStats,

    // Actions
    clearFilters,
  };
}

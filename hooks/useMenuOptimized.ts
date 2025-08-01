import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/actions/menu";
import { getUserRestaurants } from "@/lib/actions/restaurant";

// Define types based on database schema
type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  allergens: string[] | null;
  tags: string[] | null;
  preparation_time: number | null;
  calories: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type MenuItemStatus = "available" | "unavailable" | "featured";

interface MenuStats {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  totalRevenue: number;
}

interface UseMenuOptimizedReturn {
  // State
  menuItems: MenuItem[];
  menuItemsById: Record<string, MenuItem>;
  stats: MenuStats;
  restaurant: any;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedItems: Set<string>;

  // Actions
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  removeMenuItem: (itemId: string) => void;
  updateMenuItemStatus: (
    itemId: string,
    status: MenuItemStatus
  ) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  selectItem: (itemId: string, selected: boolean) => void;
  selectAllItems: () => void;
  clearSelection: () => void;

  // Computed
  selectedItemsArray: string[];
  filteredItems: MenuItem[];
  itemCount: number;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  MENU_ITEMS: "dineeasy_menu_items_cache",
  STATS: "dineeasy_menu_stats_cache",
  RESTAURANT: "dineeasy_restaurant_cache",
  SELECTED: "dineeasy_selected_menu_items",
} as const;

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore localStorage errors
  }
};

export function useMenuOptimized(): UseMenuOptimizedReturn {
  // Normalized state for better performance
  const [menuItemsById, setMenuItemsById] = useState<Record<string, MenuItem>>(
    {}
  );
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [stats, setStats] = useState<MenuStats>({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0,
    totalRevenue: 0,
  });
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load cached data on mount
  useEffect(() => {
    const cachedItems = getCachedData<Record<string, MenuItem>>(
      CACHE_KEYS.MENU_ITEMS
    );
    const cachedStats = getCachedData<MenuStats>(CACHE_KEYS.STATS);
    const cachedRestaurant = getCachedData<any>(CACHE_KEYS.RESTAURANT);
    const cachedSelected = getCachedData<string[]>(CACHE_KEYS.SELECTED);

    if (cachedItems) {
      setMenuItemsById(cachedItems);
      setItemIds(Object.keys(cachedItems));
    }

    if (cachedStats) {
      setStats(cachedStats);
    }

    if (cachedRestaurant) {
      setRestaurant(cachedRestaurant);
    }

    if (cachedSelected) {
      setSelectedItems(new Set(cachedSelected));
    }
  }, []);

  // Computed values
  const menuItems = useMemo(() => {
    return itemIds.map((id) => menuItemsById[id]).filter(Boolean);
  }, [itemIds, menuItemsById]);

  const selectedItemsArray = useMemo(() => {
    return Array.from(selectedItems);
  }, [selectedItems]);

  const itemCount = useMemo(() => {
    return itemIds.length;
  }, [itemIds]);

  // Optimistic updates
  const addMenuItem = useCallback(
    (item: MenuItem) => {
      setMenuItemsById((prev) => ({
        ...prev,
        [item.id]: item,
      }));
      setItemIds((prev) => [...prev, item.id]);

      // Update cache
      const newItemsById = { ...menuItemsById, [item.id]: item };
      setCachedData(CACHE_KEYS.MENU_ITEMS, newItemsById);
    },
    [menuItemsById]
  );

  const updateMenuItemOptimistic = useCallback(
    (item: MenuItem) => {
      setMenuItemsById((prev) => ({
        ...prev,
        [item.id]: item,
      }));

      // Update cache
      const newItemsById = { ...menuItemsById, [item.id]: item };
      setCachedData(CACHE_KEYS.MENU_ITEMS, newItemsById);
    },
    [menuItemsById]
  );

  const removeMenuItem = useCallback(
    (itemId: string) => {
      setMenuItemsById((prev) => {
        const newItemsById = { ...prev };
        delete newItemsById[itemId];
        return newItemsById;
      });
      setItemIds((prev) => prev.filter((id) => id !== itemId));
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      // Update cache
      const newItemsById = { ...menuItemsById };
      delete newItemsById[itemId];
      setCachedData(CACHE_KEYS.MENU_ITEMS, newItemsById);
    },
    [menuItemsById]
  );

  // Data fetching with caching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsResult, restaurantsResult] = await Promise.all([
        getMenuItems(),
        getUserRestaurants(),
      ]);

      if (itemsResult.success && itemsResult.data) {
        const itemsById = itemsResult.data.reduce(
          (acc: Record<string, any>, item: any) => {
            acc[item.id] = item;
            return acc;
          },
          {} as Record<string, any>
        );

        setMenuItemsById(itemsById);
        setItemIds(itemsResult.data.map((i: any) => i.id));
        setCachedData(CACHE_KEYS.MENU_ITEMS, itemsById);
      } else {
        setError(itemsResult.error || "Failed to load menu items");
      }

      if (
        restaurantsResult.restaurants &&
        restaurantsResult.restaurants.length > 0
      ) {
        setRestaurant(restaurantsResult.restaurants[0]);
        setCachedData(CACHE_KEYS.RESTAURANT, restaurantsResult.restaurants[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load menu items");
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!loading && !refreshing) {
      setRefreshing(true);
      try {
        await fetchData();
        toast.success("Menu refreshed");
      } catch (error) {
        toast.error("Failed to refresh menu");
      } finally {
        setRefreshing(false);
      }
    }
  }, [fetchData, loading, refreshing]);

  // Menu item operations with optimistic updates
  const updateMenuItemStatusOptimistic = useCallback(
    async (itemId: string, status: MenuItemStatus) => {
      const item = menuItemsById[itemId];
      if (!item) return;

      // Optimistic update
      const updatedItem = { ...item, status };
      updateMenuItemOptimistic(updatedItem);

      try {
        const formData = new FormData();
        formData.append("status", status);
        const result = await updateMenuItem(itemId, formData);
        if (!result.success) {
          // Revert on failure
          updateMenuItemOptimistic(item);
          toast.error(result.error || "Failed to update menu item status");
        }
      } catch (error) {
        // Revert on error
        updateMenuItemOptimistic(item);
        toast.error("Failed to update menu item status");
      }
    },
    [menuItemsById, updateMenuItemOptimistic]
  );

  const deleteMenuItemOptimistic = useCallback(
    async (itemId: string) => {
      const item = menuItemsById[itemId];
      if (!item) return;

      // Optimistic removal
      removeMenuItem(itemId);

      try {
        const result = await deleteMenuItem(itemId);
        if (!result.success) {
          // Revert on failure
          addMenuItem(item);
          toast.error(result.error || "Failed to delete menu item");
        } else {
          toast.success(`Menu item ${item.name} deleted successfully`);
        }
      } catch (error) {
        // Revert on error
        addMenuItem(item);
        toast.error("Failed to delete menu item");
      }
    },
    [menuItemsById, removeMenuItem, addMenuItem]
  );

  // Selection management
  const selectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }

      // Cache selection
      setCachedData(CACHE_KEYS.SELECTED, Array.from(newSet));
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    const allItemIds = Object.keys(menuItemsById);
    setSelectedItems(new Set(allItemIds));
    setCachedData(CACHE_KEYS.SELECTED, allItemIds);
  }, [menuItemsById]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setCachedData(CACHE_KEYS.SELECTED, []);
  }, []);

  // Filtered items (placeholder for search/filter functionality)
  const filteredItems = useMemo(() => {
    return menuItems; // Add filtering logic here
  }, [menuItems]);

  return {
    // State
    menuItems,
    menuItemsById,
    stats,
    restaurant,
    loading,
    refreshing,
    error,
    selectedItems,

    // Actions
    fetchData,
    refreshData,
    addMenuItem,
    updateMenuItem: updateMenuItemOptimistic,
    removeMenuItem,
    updateMenuItemStatus: updateMenuItemStatusOptimistic,
    deleteMenuItem: deleteMenuItemOptimistic,
    selectItem,
    selectAllItems,
    clearSelection,

    // Computed
    selectedItemsArray,
    filteredItems,
    itemCount,
  };
}

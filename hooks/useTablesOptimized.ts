import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  getTables,
  getTableStats,
  generateTableQRCode,
  updateTableStatus,
  deleteTable,
  createTable,
  updateTable,
} from "@/lib/actions/tables";
import { getUserRestaurants } from "@/lib/actions/restaurant";
import type { Database } from "@/types/supabase";

type Table = Database["public"]["Tables"]["tables"]["Row"];
type TableStatus = Database["public"]["Enums"]["table_status"];

interface TableStats {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  unavailable: number;
  totalCapacity: number;
}

interface UseTablesOptimizedReturn {
  // State
  tables: Table[];
  tablesById: Record<string, Table>;
  stats: TableStats;
  restaurant: any;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedTables: Set<string>;

  // Actions
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  selectTable: (tableId: string, selected: boolean) => void;
  selectAllTables: () => void;
  clearSelection: () => void;

  // Computed
  selectedTablesArray: string[];
  filteredTables: Table[];
  tableCount: number;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  TABLES: "dineeasy_tables_cache",
  STATS: "dineeasy_stats_cache",
  RESTAURANT: "dineeasy_restaurant_cache",
  SELECTED: "dineeasy_selected_tables",
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

export function useTablesOptimized(): UseTablesOptimizedReturn {
  // Normalized state for better performance
  const [tablesById, setTablesById] = useState<Record<string, Table>>({});
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [stats, setStats] = useState<TableStats>({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    unavailable: 0,
    totalCapacity: 0,
  });
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // Load cached data on mount
  useEffect(() => {
    const cachedTables = getCachedData<Record<string, Table>>(
      CACHE_KEYS.TABLES
    );
    const cachedStats = getCachedData<TableStats>(CACHE_KEYS.STATS);
    const cachedRestaurant = getCachedData<any>(CACHE_KEYS.RESTAURANT);
    const cachedSelected = getCachedData<string[]>(CACHE_KEYS.SELECTED);

    if (cachedTables) {
      setTablesById(cachedTables);
      setTableIds(Object.keys(cachedTables));
    }

    if (cachedStats) {
      setStats(cachedStats);
    }

    if (cachedRestaurant) {
      setRestaurant(cachedRestaurant);
    }

    if (cachedSelected) {
      setSelectedTables(new Set(cachedSelected));
    }
  }, []);

  // Computed values
  const tables = useMemo(() => {
    return tableIds.map((id) => tablesById[id]).filter(Boolean);
  }, [tableIds, tablesById]);

  const selectedTablesArray = useMemo(() => {
    return Array.from(selectedTables);
  }, [selectedTables]);

  const tableCount = useMemo(() => {
    return tableIds.length;
  }, [tableIds]);

  // Optimistic updates
  const addTable = useCallback(
    (table: Table) => {
      setTablesById((prev) => ({
        ...prev,
        [table.id]: table,
      }));
      setTableIds((prev) => [...prev, table.id]);

      // Update cache
      const newTablesById = { ...tablesById, [table.id]: table };
      setCachedData(CACHE_KEYS.TABLES, newTablesById);
    },
    [tablesById]
  );

  const updateTableOptimistic = useCallback(
    (table: Table) => {
      setTablesById((prev) => ({
        ...prev,
        [table.id]: table,
      }));

      // Update cache
      const newTablesById = { ...tablesById, [table.id]: table };
      setCachedData(CACHE_KEYS.TABLES, newTablesById);
    },
    [tablesById]
  );

  const removeTable = useCallback(
    (tableId: string) => {
      setTablesById((prev) => {
        const newTablesById = { ...prev };
        delete newTablesById[tableId];
        return newTablesById;
      });
      setTableIds((prev) => prev.filter((id) => id !== tableId));
      setSelectedTables((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tableId);
        return newSet;
      });

      // Update cache
      const newTablesById = { ...tablesById };
      delete newTablesById[tableId];
      setCachedData(CACHE_KEYS.TABLES, newTablesById);
    },
    [tablesById]
  );

  // Data fetching with caching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tablesResult, statsResult, restaurantsResult] = await Promise.all([
        getTables(),
        getTableStats(),
        getUserRestaurants(),
      ]);

      if (tablesResult.success && tablesResult.data) {
        const tablesById = tablesResult.data.reduce(
          (acc, table) => {
            acc[table.id] = table;
            return acc;
          },
          {} as Record<string, Table>
        );

        setTablesById(tablesById);
        setTableIds(tablesResult.data.map((t) => t.id));
        setCachedData(CACHE_KEYS.TABLES, tablesById);
      } else {
        setError(tablesResult.error || "Failed to load tables");
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
        setCachedData(CACHE_KEYS.STATS, statsResult.data);
      } else {
        setError(statsResult.error || "Failed to load table statistics");
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
      setError("Failed to load tables");
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch fresh data on mount (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    if (!loading && !refreshing) {
      setRefreshing(true);
      try {
        await fetchData();
        toast.success("Tables refreshed");
      } catch (error) {
        toast.error("Failed to refresh tables");
      } finally {
        setRefreshing(false);
      }
    }
  }, [fetchData, loading, refreshing]);

  // Table operations with optimistic updates
  const updateTableStatusOptimistic = useCallback(
    async (tableId: string, status: TableStatus) => {
      const table = tablesById[tableId];
      if (!table) return;

      // Optimistic update
      const updatedTable = { ...table, status };
      updateTableOptimistic(updatedTable);

      try {
        const result = await updateTableStatus(tableId, status);
        if (!result.success) {
          // Revert on failure
          updateTableOptimistic(table);
          toast.error(result.error || "Failed to update table status");
        }
      } catch (error) {
        // Revert on error
        updateTableOptimistic(table);
        toast.error("Failed to update table status");
      }
    },
    [tablesById, updateTableOptimistic]
  );

  const deleteTableOptimistic = useCallback(
    async (tableId: string) => {
      const table = tablesById[tableId];
      if (!table) return;

      // Optimistic removal
      removeTable(tableId);

      try {
        const result = await deleteTable(tableId);
        if (!result.success) {
          // Revert on failure
          addTable(table);
          toast.error(result.error || "Failed to delete table");
        } else {
          toast.success(`Table ${table.number} deleted successfully`);
        }
      } catch (error) {
        // Revert on error
        addTable(table);
        toast.error("Failed to delete table");
      }
    },
    [tablesById, removeTable, addTable]
  );

  // Selection management
  const selectTable = useCallback((tableId: string, selected: boolean) => {
    setSelectedTables((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(tableId);
      } else {
        newSet.delete(tableId);
      }

      // Cache selection
      setCachedData(CACHE_KEYS.SELECTED, Array.from(newSet));
      return newSet;
    });
  }, []);

  const selectAllTables = useCallback(() => {
    const allTableIds = Object.keys(tablesById);
    setSelectedTables(new Set(allTableIds));
    setCachedData(CACHE_KEYS.SELECTED, allTableIds);
  }, [tablesById]);

  const clearSelection = useCallback(() => {
    setSelectedTables(new Set());
    setCachedData(CACHE_KEYS.SELECTED, []);
  }, []);

  // Filtered tables (placeholder for search/filter functionality)
  const filteredTables = useMemo(() => {
    return tables; // Add filtering logic here
  }, [tables]);

  return {
    // State
    tables,
    tablesById,
    stats,
    restaurant,
    loading,
    refreshing,
    error,
    selectedTables,

    // Actions
    fetchData,
    refreshData,
    addTable,
    updateTable: updateTableOptimistic,
    removeTable,
    updateTableStatus: updateTableStatusOptimistic,
    deleteTable: deleteTableOptimistic,
    selectTable,
    selectAllTables,
    clearSelection,

    // Computed
    selectedTablesArray,
    filteredTables,
    tableCount,
  };
}

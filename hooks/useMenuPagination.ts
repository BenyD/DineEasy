import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getMenuItemsPaginated } from "@/lib/actions/menu";
import type { MenuItem } from "@/types";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterState {
  searchTerm: string;
  categoryId: string;
  available?: boolean;
  popular?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface UseMenuPaginationOptions {
  initialPageSize?: number;
  debounceMs?: number;
  enableVirtualization?: boolean;
  enableInfiniteScroll?: boolean;
}

export interface UseMenuPaginationReturn {
  // Data
  items: MenuItem[];
  pagination: PaginationState;
  filters: FilterState;
  loading: boolean;
  error: string | null;

  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (categoryId: string) => void;
  setAvailabilityFilter: (available?: boolean) => void;
  setPopularFilter: (popular?: boolean) => void;
  setPriceRange: (min?: number, max?: number) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Computed
  isEmpty: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  canLoadMore: boolean;
}

// Debounce hook
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

export function useMenuPagination(
  options: UseMenuPaginationOptions = {}
): UseMenuPaginationReturn {
  const {
    initialPageSize = 20,
    debounceMs = 300,
    enableVirtualization = false,
    enableInfiniteScroll = false,
  } = options;

  // State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    categoryId: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs for tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestIdRef = useRef(0);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(filters.searchTerm, debounceMs);

  // Memoized filter object for API calls
  const apiFilters = useMemo(
    () => ({
      searchTerm: debouncedSearchTerm,
      categoryId: filters.categoryId,
      available: filters.available,
      popular: filters.popular,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [
      debouncedSearchTerm,
      filters.categoryId,
      filters.available,
      filters.popular,
      filters.minPrice,
      filters.maxPrice,
      filters.sortBy,
      filters.sortOrder,
    ]
  );

  // Fetch data function
  const fetchData = useCallback(
    async (page: number, append = false) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const requestId = ++lastRequestIdRef.current;
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const result = await getMenuItemsPaginated({
          page,
          pageSize: pagination.pageSize,
          ...apiFilters,
        });

        // Check if this is still the latest request
        if (requestId !== lastRequestIdRef.current) {
          return;
        }

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.success && result.data) {
          if (append) {
            setItems((prev) => [...prev, ...result.data]);
          } else {
            setItems(result.data);
          }

          if (result.pagination) {
            setPagination(result.pagination);
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return; // Request was cancelled
        }

        if (requestId === lastRequestIdRef.current) {
          setError(error.message || "Failed to fetch menu items");
        }
      } finally {
        if (requestId === lastRequestIdRef.current) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [pagination.pageSize, apiFilters]
  );

  // Load initial data
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Reset to first page when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [apiFilters]);

  // Actions
  const setPage = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
      fetchData(page);
    },
    [fetchData]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
      fetchData(1);
    },
    [fetchData]
  );

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, searchTerm }));
  }, []);

  const setCategoryFilter = useCallback((categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId }));
  }, []);

  const setAvailabilityFilter = useCallback((available?: boolean) => {
    setFilters((prev) => ({ ...prev, available }));
  }, []);

  const setPopularFilter = useCallback((popular?: boolean) => {
    setFilters((prev) => ({ ...prev, popular }));
  }, []);

  const setPriceRange = useCallback((min?: number, max?: number) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  }, []);

  const setSorting = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      categoryId: "",
      sortBy: "created_at",
      sortOrder: "desc",
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(pagination.page);
  }, [fetchData, pagination.page]);

  const loadMore = useCallback(async () => {
    if (enableInfiniteScroll && pagination.hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      await fetchData(pagination.page + 1, true);
    }
  }, [
    enableInfiniteScroll,
    pagination.hasNextPage,
    pagination.page,
    isLoadingMore,
    fetchData,
  ]);

  // Computed values
  const isEmpty = useMemo(
    () => items.length === 0 && !loading,
    [items.length, loading]
  );
  const isFirstPage = useMemo(() => pagination.page === 1, [pagination.page]);
  const isLastPage = useMemo(
    () => !pagination.hasNextPage,
    [pagination.hasNextPage]
  );
  const canLoadMore = useMemo(
    () =>
      enableInfiniteScroll &&
      pagination.hasNextPage &&
      !loading &&
      !isLoadingMore,
    [enableInfiniteScroll, pagination.hasNextPage, loading, isLoadingMore]
  );

  return {
    // Data
    items,
    pagination,
    filters,
    loading,
    error,

    // Actions
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
    loadMore,

    // Computed
    isEmpty,
    isFirstPage,
    isLastPage,
    canLoadMore,
  };
}

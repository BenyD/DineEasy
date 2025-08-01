"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  QrCode,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Users,
  Loader2,
  MoreVertical,
  CheckSquare,
  Square,
  Grid3X3,
  Layout,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Upload,
  FileText,
  MapPin,
  Clock,
  BarChart3,
  Copy,
  ExternalLink,
  Settings,
  AlertTriangle,
  Wifi,
  WifiOff,
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createTable,
  updateTable,
  deleteTable,
  bulkDeleteTables,
  updateTableStatus,
  bulkUpdateTableStatus,
  bulkUpdateTableLayouts,
  generateTableQRCode,
  updateAllQRCodesForEnvironment,
  cleanupOrphanedData,
} from "@/lib/actions/tables";

import type { Database } from "@/types/supabase";
import {
  TABLE_CAPACITY_OPTIONS,
  TABLE_CAPACITY_FILTER_OPTIONS,
} from "@/lib/constants/tables";

import { BulkActions } from "@/components/dashboard/common/BulkActions";
import { TableQRCode } from "@/components/dashboard/tables/TableQRCode";

import { TablesErrorBoundary } from "@/components/dashboard/tables/TablesErrorBoundary";
import {
  generateTableQRData,
  isQRCodeEnvironmentCorrect,
} from "@/lib/utils/qr-code";
import { QR_CONFIG } from "@/lib/constants";

import { useTablesOptimized } from "@/hooks/useTablesOptimized";
import { useTablesWebSocket } from "@/hooks/useTablesWebSocket";
import { retry } from "@/lib/utils/retry";

type Table = Database["public"]["Tables"]["tables"]["Row"];
type TableStatus = Database["public"]["Enums"]["table_status"];

// Table status options
const tableStatuses = [
  { value: "all", label: "All Tables" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
  { value: "unavailable", label: "Unavailable" },
];

// Use shared capacity constants
const capacityOptions = TABLE_CAPACITY_FILTER_OPTIONS;

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

const qrCodeHoverVariants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 300,
    },
  },
};

function TablesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "number" | "capacity" | "status" | "created_at"
  >("number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // Optimized state management
  const {
    tables,
    stats,
    restaurant,
    loading,
    refreshing,
    error,
    selectedTables,
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
    selectedTablesArray,
    tableCount,
  } = useTablesOptimized();

  // WebSocket real-time updates
  const { isConnected, reconnectAttempts } = useTablesWebSocket({
    onTableAdded: (table: Table) => {
      console.log("WebSocket: Table added", table);
      addTable(table);
    },
    onTableUpdated: (table: Table, oldTable?: Table) => {
      console.log("WebSocket: Table updated", table, oldTable);
      updateTableOptimistic(table);
    },
    onTableDeleted: (table: Table) => {
      console.log("WebSocket: Table deleted", table);
      removeTable(table.id);
    },
  });

  // Search function without debounce to prevent random refreshes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Refresh data with retry logic
  const handleRefresh = useCallback(async () => {
    if (!loading && !refreshing) {
      try {
        await retry(refreshData, {
          maxAttempts: 3,
        });
      } catch (error) {
        toast.error("Failed to refresh tables after multiple attempts");
      }
    }
  }, [refreshData, loading, refreshing]);

  // Load data on mount with retry logic
  useEffect(() => {
    const loadDataWithRetry = async () => {
      try {
        await retry(fetchData, {
          maxAttempts: 3,
        });
      } catch (error) {
        toast.error("Failed to load tables after multiple attempts");
      }
    };

    loadDataWithRetry();
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, capacityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "unavailable":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCapacityFilter("all");
    setPage(1); // Reset to first page when clearing filters
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || capacityFilter !== "all";

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedTables.size === paginatedTables.length) {
      clearSelection();
    } else {
      selectAllTables();
    }
  };

  const handleSelectTable = (tableId: string, selected: boolean) => {
    selectTable(tableId, selected);
  };

  const handleDeleteTable = async (table: Table) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return;

    setActionLoading(tableToDelete.id);
    try {
      const result = await deleteTable(tableToDelete.id);
      if (result.success) {
        toast.success("Table deleted successfully");
        closeDeleteDialog();
      } else {
        toast.error(result.error || "Failed to delete table");
      }
    } catch (error) {
      console.error("Delete table error:", error);
      toast.error("Failed to delete table");
    } finally {
      setActionLoading(null);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTableToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedTables.size === 0) return;

    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedTables.size} table(s)? This action cannot be undone.`
      );

      if (!confirmed) return;

      const result = await bulkDeleteTables(Array.from(selectedTables));

      if (result.success) {
        if (result.errors && result.errors.length > 0) {
          // Some tables failed to delete
          const errorMessages = result.errors.map((e) => e.error).join(", ");
          toast.error(
            `Deleted ${result.deleted} table(s), but failed to delete ${result.errors.length}: ${errorMessages}`
          );
        } else {
          toast.success(`Successfully deleted ${result.deleted} table(s)`);
        }
        clearSelection();
        setShowBulkOperations(false);
      } else {
        toast.error(result.error || "Failed to delete tables");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete tables");
    }
  };

  const handleBulkStatusUpdate = async (status: TableStatus) => {
    if (selectedTables.size === 0) return;

    try {
      const result = await bulkUpdateTableStatus(
        Array.from(selectedTables),
        status
      );
      if (result.success) {
        toast.success(`Updated status for ${selectedTables.size} table(s)`);
        clearSelection();
        setShowBulkOperations(false);
      } else {
        toast.error(result.error || "Failed to update table status");
      }
    } catch (error) {
      toast.error("Failed to update table status");
    }
  };

  const handleBulkExport = async (format: "csv" | "json") => {
    if (selectedTables.size === 0) return;

    try {
      setIsExporting(true);
      const selectedTableData = tables.filter((t) => selectedTables.has(t.id));
      let content = "";

      if (format === "csv") {
        const headers = [
          "Table Number",
          "Capacity",
          "Status",
          "QR Code URL",
          "Created At",
        ];
        content = [
          headers.join(","),
          ...selectedTableData.map((table) =>
            [
              table.number,
              table.capacity,
              table.status,
              table.qr_code,
              new Date(table.created_at).toLocaleDateString(),
            ].join(",")
          ),
        ].join("\n");
      } else {
        content = JSON.stringify(selectedTableData, null, 2);
      }

      const blob = new Blob([content], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tables-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `Exported ${selectedTables.size} table(s) as ${format.toUpperCase()}`
      );
    } catch (error) {
      toast.error("Failed to export tables");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkQRDownload = async () => {
    if (selectedTables.size === 0) return;

    try {
      // Refresh QR codes for selected tables
      const tableIds = Array.from(selectedTables);
      let successCount = 0;
      let errorCount = 0;

      for (const tableId of tableIds) {
        try {
          const result = await generateTableQRCode(tableId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Refreshed QR codes for ${successCount} tables${errorCount > 0 ? ` (${errorCount} failed)` : ""}`
        );
        await fetchData();
      } else {
        toast.error("Failed to refresh QR codes");
      }
    } catch (error) {
      toast.error("Failed to refresh QR codes");
    }
  };

  const handleBulkDownloadQR = async () => {
    if (selectedTables.size === 0) return;

    try {
      const selectedTableData = tables.filter((table) =>
        selectedTables.has(table.id)
      );
      let successCount = 0;
      let errorCount = 0;

      for (const table of selectedTableData) {
        try {
          const qrUrl =
            table.qr_code ||
            `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`;

          // Generate QR code as data URL with default options
          const QRCode = (await import("qrcode")).default;
          const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

          // Create download link
          const link = document.createElement("a");
          link.href = qrDataUrl;
          link.download = `table-${table.number}-qr.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          successCount++;
        } catch (error) {
          console.error(
            `Error downloading QR code for table ${table.number}:`,
            error
          );
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Downloaded QR codes for ${successCount} tables${errorCount > 0 ? ` (${errorCount} failed)` : ""}`
        );
      } else {
        toast.error("Failed to download QR codes");
      }
    } catch (error) {
      console.error("Error in bulk download:", error);
      toast.error("Failed to download QR codes");
    }
  };

  const handleUpdateAllQRCodes = async () => {
    try {
      const result = await updateAllQRCodesForEnvironment();
      if (result.success) {
        toast.success(result.message);
        await fetchData(); // Refresh the tables
      } else {
        toast.error(result.error || "Failed to update QR codes");
      }
    } catch (error) {
      console.error("Error updating QR codes:", error);
      toast.error("Failed to update QR codes");
    }
  };

  // Keyboard shortcuts for bulk operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showBulkOperations) return;

      if (event.key === "Delete" && selectedTables.size > 0) {
        event.preventDefault();
        handleBulkDelete();
      } else if (event.ctrlKey && event.key === "a") {
        event.preventDefault();
        handleSelectAll();
      } else if (event.key === "Escape") {
        setShowBulkOperations(false);
        clearSelection();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showBulkOperations, selectedTables]);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkOperations(selectedTables.size > 0);
  }, [selectedTables]);

  // Memoized filtered and sorted tables
  const filteredAndSortedTables = useMemo(() => {
    let filtered = tables.filter((table: Table) => {
      const matchesSearch = table.number
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || table.status === statusFilter;
      const matchesCapacity =
        capacityFilter === "all" ||
        capacityFilter === table.capacity.toString();
      return matchesSearch && matchesStatus && matchesCapacity;
    });

    // Sort tables
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle string sorting for table numbers
      if (sortBy === "number") {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tables, searchQuery, statusFilter, capacityFilter, sortBy, sortOrder]);

  // Paginated tables for performance
  const paginatedTables = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTables.slice(startIndex, endIndex);
  }, [filteredAndSortedTables, page, itemsPerPage]);

  // Total pages for pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedTables.length / itemsPerPage);
  }, [filteredAndSortedTables.length, itemsPerPage]);

  const TableForm = ({
    table,
    onClose,
  }: {
    table?: Table | null;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      number: table?.number || "",
      capacity: table?.capacity?.toString() || "4",
    });
    const [submitting, setSubmitting] = useState(false);

    // Auto-generate next table number
    const getNextTableNumber = useCallback(() => {
      if (table) return table.number; // Don't auto-number when editing

      const existingNumbers = tables
        .map((t) => parseInt(t.number))
        .filter((n) => !isNaN(n));

      if (existingNumbers.length === 0) {
        return "1";
      }

      // Find the first gap in the sequence
      const sortedNumbers = [...existingNumbers].sort((a, b) => a - b);

      // Check for gaps starting from 1
      for (let i = 1; i <= Math.max(...sortedNumbers) + 1; i++) {
        if (!sortedNumbers.includes(i)) {
          return i.toString();
        }
      }

      // If no gaps, use the next number after the highest
      return (Math.max(...sortedNumbers) + 1).toString();
    }, [tables, table]);

    // Set initial table number when creating a new table
    useEffect(() => {
      if (!table && formData.number === "") {
        setFormData((prev) => ({
          ...prev,
          number: getNextTableNumber(),
        }));
      }
    }, [table, getNextTableNumber]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Use shared capacity constants
    const capacityOptions = TABLE_CAPACITY_OPTIONS;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        // Validation
        const tableNumber = formData.number.trim();
        const capacity = parseInt(formData.capacity);

        if (!tableNumber) {
          toast.error("Table number is required");
          return;
        }

        if (isNaN(capacity) || capacity < 1 || capacity > 20) {
          toast.error("Capacity must be between 1 and 20");
          return;
        }

        // Note: Server-side validation will handle duplicate table numbers,
        // including checking for inactive tables that can be reactivated

        const formDataObj = new FormData();
        formDataObj.append("number", tableNumber);
        formDataObj.append("capacity", capacity.toString());

        let result;
        if (table) {
          result = await updateTable(table.id, formDataObj);
        } else {
          result = await createTable(formDataObj);
        }

        if (result.success) {
          toast.success(
            (result as any).message ||
              (table
                ? "Table updated successfully"
                : "Table created successfully")
          );

          // Close the dialog first
          onClose();

          // For new table creation, add a fallback refresh mechanism
          if (!table && result.data) {
            const newTableId = result.data.id;
            const newTableNumber = result.data.number;

            // Check if the table appears in the list after a short delay
            setTimeout(() => {
              const tableExists = tables.some((t) => t.id === newTableId);
              if (!tableExists) {
                console.log("Table not found in list, refreshing data...");
                fetchData();
              } else {
                console.log("Table found in list via WebSocket");
              }
            }, 500); // Wait 500ms for WebSocket to update
          }
        } else {
          toast.error(result.error || "Failed to save table");
        }
      } catch (error) {
        console.error("Error saving table:", error);
        toast.error("Failed to save table");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        onKeyDown={handleKeyDown}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Table Number</Label>
            <div className="relative">
              <Input
                id="number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                placeholder="1"
                required
                className={!table ? "pr-20" : ""}
              />
              {!table && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-1 top-1 h-7 px-2 text-xs"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      number: getNextTableNumber(),
                    }))
                  }
                >
                  Auto
                </Button>
              )}
            </div>
            {!table && (
              <p className="text-xs text-muted-foreground">
                Auto-fills the next available number. Click &quot;Auto&quot; to
                regenerate.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Select
              value={formData.capacity}
              onValueChange={(value) =>
                setFormData({ ...formData, capacity: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select capacity" />
              </SelectTrigger>
              <SelectContent>
                {capacityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Table numbering info */}
        {!table && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <p className="font-medium text-blue-900">Smart Numbering</p>
                <p className="text-blue-700">
                  Automatically finds the next available table number.
                  {tables.length > 0 && (
                    <span className="block mt-1">
                      Current tables:{" "}
                      {tables
                        .map((t) => t.number)
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .join(", ")}
                    </span>
                  )}
                  <span className="block mt-1">
                    Next available: <strong>{getNextTableNumber()}</strong>
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {table ? "Updating..." : "Adding..."}
              </>
            ) : table ? (
              "Update Table"
            ) : (
              "Add Table"
            )}
          </Button>
        </div>
      </form>
    );
  };

  // Show loading state
  if (loading) {
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

        {/* Tables Grid Skeleton */}
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
                {/* QR Code Skeleton */}
                <div className="flex justify-center">
                  <Skeleton className="w-32 h-32 rounded-lg" />
                </div>
                {/* QR URL Skeleton */}
                <div className="text-center">
                  <Skeleton className="h-8 w-48 mx-auto" />
                </div>
                {/* Action Buttons Skeleton */}
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <Skeleton className="h-9 w-full" />
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
            Error Loading Tables
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={fetchData} className="mt-4" variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Tables & QR</h1>
          <p className="text-muted-foreground">
            Manage your restaurant tables and QR codes
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
                      ? "Connected - Tables will update automatically"
                      : "Disconnected - Manual refresh required"}
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
            disabled={refreshing || loading}
            asChild
          >
            <motion.div
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {refreshing ? "Refreshing..." : "Refresh"}
            </motion.div>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkOperations(!showBulkOperations)}
                  className={cn(
                    "transition-all",
                    showBulkOperations &&
                      "bg-blue-50 border-blue-200 text-blue-700",
                    showBulkOperations &&
                      selectedTables.size === 0 &&
                      "bg-yellow-50 border-yellow-200 text-yellow-700"
                  )}
                >
                  {showBulkOperations ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedTables.size > 0
                        ? `Bulk Mode (${selectedTables.size})`
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
                    Select multiple tables to perform bulk actions
                  </p>
                  {showBulkOperations && selectedTables.size > 0 && (
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
                  Add Table
                </motion.div>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <TableForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Layout Editor Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "/dashboard/tables/layout")
                  }
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Layout Editor
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Table Layout Editor</p>
                  <p className="text-xs text-muted-foreground">
                    Visualize and arrange your restaurant tables
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Quick Actions</h4>
                  <p className="text-sm text-muted-foreground">
                    Export, import, and manage your tables
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {/* Only show these options in development environment */}
                  {process.env.NODE_ENV === "development" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExportDialog(true)}
                        className="w-full justify-start"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Tables
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImportDialog(true)}
                        className="w-full justify-start"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Tables
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUpdateAllQRCodes}
                    className="w-full justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update All QR Codes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const confirmed = window.confirm(
                          "This will clean up orphaned data from the database. This action cannot be undone. Continue?"
                        );
                        if (!confirmed) return;

                        const result = await cleanupOrphanedData();
                        if (result.success) {
                          toast.success(
                            `Cleaned up ${result.cleaned} orphaned records`
                          );
                        } else {
                          toast.error(
                            result.error || "Failed to cleanup orphaned data"
                          );
                        }
                      } catch (error) {
                        toast.error("Failed to cleanup orphaned data");
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Orphaned Data
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
              title: "Available Tables",
              value: stats.available,
              description: "Ready to seat guests",
              icon: CheckSquare,
            },
            {
              title: "Occupied Tables",
              value: stats.occupied,
              description: "Currently serving guests",
              icon: Users,
            },
            {
              title: "Total Tables",
              value: stats.total,
              description: "All restaurant tables",
              icon: Layout,
            },
            {
              title: "Total Seating Capacity",
              value: stats.totalCapacity,
              description: "Maximum guest capacity",
              icon: BarChart3,
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

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <motion.div
                animate={{ rotate: hasActiveFilters ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Filter className="h-5 w-5" />
              </motion.div>
              Filters & Search
            </CardTitle>
            <CardDescription>Filter and search through tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {/* Search Input */}
              <div className="relative col-span-full lg:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by table number..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {tableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Capacity Filter with Reset Button */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={capacityFilter}
                    onValueChange={setCapacityFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      {capacityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bulk Actions and Tables Grid */}
      <BulkActions
        items={paginatedTables}
        itemKey={(table) => table.id}
        selectedIds={Array.from(selectedTables)}
        onSelectAll={(all) => {
          if (all) {
            selectAllTables();
          } else {
            clearSelection();
          }
        }}
        onSelectItem={(id, selected) => {
          selectTable(id, selected);
        }}
        isBulkMode={showBulkOperations}
        onBulkModeChange={setShowBulkOperations}
        color="blue"
        onBulkDelete={handleBulkDelete}
        onBulkToggleAvailability={async () => {
          // For tables, we'll toggle between available and unavailable
          const firstTable = paginatedTables.find((table) =>
            selectedTables.has(table.id)
          );
          const targetStatus =
            firstTable && firstTable.status === "available"
              ? "unavailable"
              : "available";
          await handleBulkStatusUpdate(targetStatus as TableStatus);
        }}
        onBulkExport={() => handleBulkExport("csv")}
        bulkActionsLoading={false}
      >
        {({ selectedIds }) => (
          <>
            {/* Tables Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={itemVariants}
            >
              <AnimatePresence mode="wait">
                {paginatedTables.map((table: Table, index: number) => (
                  <motion.div
                    key={table.id}
                    variants={cardHoverVariants}
                    whileHover="hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                        "bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60",
                        showBulkOperations && "ring-2 ring-blue-200",
                        selectedIds.includes(table.id) &&
                          "ring-2 ring-blue-500 bg-blue-50/80",
                        "hover:border-gray-300 hover:scale-[1.02]",
                        showBulkOperations && "cursor-pointer"
                      )}
                      onClick={() => {
                        if (showBulkOperations) {
                          selectTable(
                            table.id,
                            !selectedIds.includes(table.id)
                          );
                        }
                      }}
                    >
                      {/* Bulk Selection Checkbox */}
                      {showBulkOperations && (
                        <motion.div
                          className="absolute top-3 left-3 z-20"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Checkbox
                            checked={selectedIds.includes(table.id)}
                            onCheckedChange={(checked) => {
                              selectTable(table.id, !!checked);
                            }}
                            className="w-6 h-6 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-xl border-2 border-blue-300 bg-white/95 backdrop-blur-sm hover:scale-110 transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </motion.div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            delay: 0.1,
                          }}
                        >
                          <Badge
                            className={cn(
                              "px-3 py-1 text-xs font-medium shadow-sm transition-all duration-200",
                              "hover:scale-105 cursor-pointer",
                              getStatusColor(table.status)
                            )}
                            onClick={() => {
                              // Quick status change functionality
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  table.status === "available" &&
                                    "bg-green-500",
                                  table.status === "occupied" && "bg-red-500",
                                  table.status === "reserved" && "bg-blue-500",
                                  table.status === "unavailable" &&
                                    "bg-gray-500"
                                )}
                              />
                              {getStatusLabel(table.status)}
                            </div>
                          </Badge>
                        </motion.div>
                      </div>

                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        {/* Table Number and Title */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              className="relative"
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {table.number}
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            </motion.div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                Table {table.number}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">
                                  {table.capacity} seats
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {table.capacity <= 2
                                    ? "Small"
                                    : table.capacity <= 4
                                      ? "Medium"
                                      : table.capacity <= 6
                                        ? "Large"
                                        : "Extra Large"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs font-medium text-gray-600">
                                ID
                              </span>
                            </div>
                            <p className="text-sm font-mono text-gray-800">
                              {table.id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-medium text-gray-600">
                                Created
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">
                              {new Date(table.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="relative">
                          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 border border-blue-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <QrCode className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-800">
                                    QR Code
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    Ready to scan
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                >
                                  Table {table.number}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-medium ${
                                    isQRCodeEnvironmentCorrect(
                                      table.qr_code || ""
                                    )
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  }`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full mr-1.5 ${
                                      isQRCodeEnvironmentCorrect(
                                        table.qr_code || ""
                                      )
                                        ? "bg-green-500"
                                        : "bg-yellow-500"
                                    }`}
                                  />
                                  {isQRCodeEnvironmentCorrect(
                                    table.qr_code || ""
                                  )
                                    ? "Active"
                                    : "Needs Update"}
                                </Badge>
                              </div>
                            </div>

                            {/* QR Code Display */}
                            <div className="flex justify-center mb-6">
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                                <div className="relative bg-white rounded-2xl p-4 shadow-xl border border-gray-200">
                                  <TableQRCode
                                    tableData={generateTableQRData(
                                      table.id,
                                      table.number,
                                      table.restaurant_id
                                    )}
                                    size="lg"
                                    showActions={false}
                                    className="mx-auto"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* QR Code Info */}
                            <div className="text-center space-y-3">
                              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Scan to access menu & order
                                </p>
                                <p className="text-xs text-gray-500">
                                  Customers can scan this QR code to view your
                                  menu and place orders
                                </p>
                              </div>

                              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                  <span className="font-medium">Ready</span>
                                </div>
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Users className="w-3 h-3" />
                                  <span className="font-medium">
                                    {table.capacity}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                                  <span className="font-medium">HD</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-6 pb-6">
                        <div className="space-y-3">
                          {/* Primary Actions */}
                          <div className="grid grid-cols-3 gap-2">
                            <Dialog
                              open={editingTable?.id === table.id}
                              onOpenChange={(open) =>
                                !open && setEditingTable(null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200 flex items-center justify-center"
                                  onClick={() => setEditingTable(table)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Edit Table {table.number}
                                  </DialogTitle>
                                </DialogHeader>
                                <TableForm
                                  table={table}
                                  onClose={() => setEditingTable(null)}
                                />
                              </DialogContent>
                            </Dialog>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="col-span-2 h-10 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200 flex items-center justify-center"
                                    onClick={async () => {
                                      try {
                                        const qrUrl =
                                          table.qr_code ||
                                          `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`;

                                        // Generate QR code as data URL with default options
                                        const QRCode = (await import("qrcode"))
                                          .default;
                                        const qrDataUrl =
                                          await QRCode.toDataURL(qrUrl, {
                                            width: 256,
                                            margin: 2,
                                            color: {
                                              dark: "#000000",
                                              light: "#FFFFFF",
                                            },
                                          });

                                        // Create download link
                                        const link =
                                          document.createElement("a");
                                        link.href = qrDataUrl;
                                        link.download = `table-${table.number}-qr.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);

                                        toast.success(
                                          "QR code downloaded successfully"
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Error downloading QR code:",
                                          error
                                        );
                                        toast.error(
                                          "Failed to download QR code"
                                        );
                                      }
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download QR
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Download QR code for Table {table.number}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {/* Secondary Actions */}
                          <div className="flex gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700"
                                >
                                  <MoreVertical className="w-4 h-4 mr-2" />
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-sm font-medium text-gray-500">
                                  Quick Actions
                                </div>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      const result = await generateTableQRCode(
                                        table.id
                                      );
                                      if (result.success) {
                                        toast.success(
                                          "QR code regenerated successfully"
                                        );
                                        await fetchData();
                                      } else {
                                        toast.error(
                                          result.error ||
                                            "Failed to regenerate QR code"
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error regenerating QR code:",
                                        error
                                      );
                                      toast.error(
                                        "Failed to regenerate QR code"
                                      );
                                    }
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Regenerate QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      const qrUrl =
                                        table.qr_code ||
                                        `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`;

                                      // Generate QR code as data URL with default options
                                      const QRCode = (await import("qrcode"))
                                        .default;
                                      const qrDataUrl = await QRCode.toDataURL(
                                        qrUrl,
                                        {
                                          width: 256,
                                          margin: 2,
                                          color: {
                                            dark: "#000000",
                                            light: "#FFFFFF",
                                          },
                                        }
                                      );

                                      // Create download link
                                      const link = document.createElement("a");
                                      link.href = qrDataUrl;
                                      link.download = `table-${table.number}-qr.png`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      toast.success(
                                        "QR code downloaded successfully"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error downloading QR code:",
                                        error
                                      );
                                      toast.error("Failed to download QR code");
                                    }
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Copy QR URL to clipboard
                                    const qrUrl =
                                      table.qr_code ||
                                      `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`;
                                    navigator.clipboard.writeText(qrUrl);
                                    toast.success("QR URL copied to clipboard");
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy QR URL
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Test QR code by opening in new tab
                                    const qrUrl =
                                      table.qr_code ||
                                      `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`;
                                    window.open(qrUrl, "_blank");
                                    toast.success(
                                      "Opening QR code page in new tab"
                                    );
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Test QR Code
                                </DropdownMenuItem>
                                <Separator className="my-1" />
                                <div className="px-2 py-1.5 text-sm font-medium text-gray-500">
                                  Change Status
                                </div>
                                {tableStatuses
                                  .filter((status) => status.value !== "all")
                                  .map((status) => (
                                    <DropdownMenuItem
                                      key={status.value}
                                      onClick={async () => {
                                        const result = await updateTableStatus(
                                          table.id,
                                          status.value as TableStatus
                                        );
                                        if (result.success) {
                                          toast.success(
                                            `Table ${table.number} status updated to ${status.label}`
                                          );
                                        } else {
                                          toast.error(
                                            result.error ||
                                              "Failed to update status"
                                          );
                                        }
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          status.value === "available"
                                            ? "bg-green-500"
                                            : status.value === "occupied"
                                              ? "bg-red-500"
                                              : status.value === "reserved"
                                                ? "bg-blue-500"
                                                : "bg-gray-500"
                                        }`}
                                      />
                                      {status.label}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 bg-white hover:bg-red-50 border-gray-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-all duration-200"
                              disabled={actionLoading === table.id}
                              onClick={() => handleDeleteTable(table)}
                            >
                              {actionLoading === table.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              <AnimatePresence>
                {!loading && filteredAndSortedTables.length === 0 && (
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
                          <QrCode className="w-12 h-12 text-gray-400" />
                          <h3 className="font-semibold text-lg">
                            {tables.length === 0
                              ? "No tables yet"
                              : "No tables found"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tables.length === 0
                              ? "Get started by adding your first table"
                              : searchQuery
                                ? "Try adjusting your search or filters"
                                : `No ${
                                    statusFilter === "all" ? "" : statusFilter
                                  } tables available`}
                          </p>
                          {tables.length === 0 && (
                            <Button
                              onClick={() => setIsAddDialogOpen(true)}
                              className="mt-4 bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Table
                            </Button>
                          )}
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </BulkActions>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <motion.div
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * itemsPerPage + 1} to{" "}
            {Math.min(page * itemsPerPage, filteredAndSortedTables.length)} of{" "}
            {filteredAndSortedTables.length} tables
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

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Tables</DialogTitle>
            <DialogDescription>
              Export your table data in your preferred format. The file will
              include all tables with their details.
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
                    {stats.total} total tables • {stats.available} available •{" "}
                    {stats.occupied} occupied
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
                      • <strong>Best for:</strong> Data integration, programming
                    </p>
                    <p>
                      • <strong>File extension:</strong> .json
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={() => handleBulkExport(exportFormat)}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Tables
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Tables</DialogTitle>
            <DialogDescription>
              Import table data from a CSV or JSON file. Make sure your file
              follows the correct format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Sample Download */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Need a sample file?
                  </h4>
                  <p className="text-sm text-blue-700">
                    Download our sample CSV template to see the correct format
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sampleData = [
                    ["Table Number", "Capacity", "Status"],
                    ["1", "4", "available"],
                    ["2", "6", "available"],
                    ["3", "2", "available"],
                  ];
                  const csvContent = sampleData
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "tables-sample.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="mt-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".csv,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            {/* Import Instructions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Import Instructions</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Supported formats: CSV, JSON</p>
                <p>• CSV should have headers: Table Number, Capacity, Status</p>
                <p>
                  • Status options: available, occupied, reserved, unavailable
                </p>
                <p>• Capacity should be between 1-20 people</p>
                <p>• Table numbers must be unique</p>
              </div>
            </div>

            {/* Import Button */}
            <Button
              onClick={async () => {
                if (!importFile) return;

                try {
                  setIsImporting(true);
                  const text = await importFile.text();
                  let importedTables: any[] = [];

                  if (importFile.name.endsWith(".csv")) {
                    const lines = text.split("\n");
                    const headers = lines[0]
                      .split(",")
                      .map((h) => h.replace(/"/g, "").trim());
                    importedTables = lines.slice(1).map((line) => {
                      const values = line
                        .split(",")
                        .map((v) => v.replace(/"/g, "").trim());
                      const table: any = {};
                      headers.forEach((header, index) => {
                        table[header.toLowerCase().replace(/\s+/g, "_")] =
                          values[index];
                      });
                      return table;
                    });
                  } else if (importFile.name.endsWith(".json")) {
                    importedTables = JSON.parse(text);
                  }

                  // Create tables
                  let successCount = 0;
                  for (const tableData of importedTables) {
                    if (tableData.table_number && tableData.capacity) {
                      const formData = new FormData();
                      formData.append("number", tableData.table_number);
                      formData.append("capacity", tableData.capacity);

                      const result = await createTable(formData);
                      if (result.success) {
                        successCount++;
                      }
                    }
                  }

                  toast.success(`Successfully imported ${successCount} tables`);
                  setShowImportDialog(false);
                  setImportFile(null);
                } catch (error) {
                  toast.error("Failed to import tables");
                } finally {
                  setIsImporting(false);
                }
              }}
              disabled={!importFile || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Tables
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Table
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                Table {tableToDelete?.number}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">
                    This will permanently delete the table
                  </p>
                  <p className="text-red-600 mt-1">
                    • All associated QR codes will be invalidated
                  </p>
                  <p className="text-red-600">
                    • Any active orders will be affected
                  </p>
                  <p className="text-red-600">• This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={actionLoading === tableToDelete?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTable}
                disabled={actionLoading === tableToDelete?.id}
              >
                {actionLoading === tableToDelete?.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Table
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Wrap with error boundary and add connection status
export default function TablesPageWithErrorBoundary() {
  return (
    <TablesErrorBoundary>
      <TablesPage />
    </TablesErrorBoundary>
  );
}

"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

import {
  Plus,
  Save,
  Undo,
  Redo,
  RotateCcw,
  Users,
  Settings,
  Layers,
  Building2,
  DoorOpen,
  ChefHat,
  Wine,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Download,
  Trash2,
  Copy,
  RotateCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Grid3X3,
  Palette,
  FileText,
  Layout,
  Bath,
  Package,
  PlusCircle,
  MinusCircle,
  Move,
  GripVertical,
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
  DialogDescription,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTablesOptimized } from "@/hooks/useTablesOptimized";
import { useTablesWebSocket } from "@/hooks/useTablesWebSocket";
import {
  updateTableLayout,
  getTablesWithLayout,
  getCurrentRestaurantType,
  getRestaurantElements,
  saveRestaurantElements,
} from "@/lib/actions/tables";
import { LAYOUT_TEMPLATES } from "@/lib/constants/layout-templates";
import {
  createElement,
  getStatusColor,
  getStatusBackground,
} from "@/lib/constants/restaurant-elements";
import type { Database } from "@/types/supabase";
import type { RestaurantElement } from "@/types";
import { getTableSize as getTableSizeFromConstants } from "@/lib/constants/tables";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

type Table = Database["public"]["Tables"]["tables"]["Row"];

interface TablePosition {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width: number;
  height: number;
  locked: boolean;
  visible: boolean;
}

interface LayoutSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showStatus: boolean;
  showCapacity: boolean;
  theme: "light" | "dark" | "professional";
  zoom: number;
  showRulers: boolean;
  showGuides: boolean;
}

interface LayoutHistory {
  tables: Map<string, TablePosition>;
  elements: RestaurantElement[];
  timestamp: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 },
  },
};

const tableVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: { scale: 1.05, zIndex: 10 },
  drag: { scale: 1.1, zIndex: 20 },
};

// Draggable Table Component
function DraggableTable({
  table,
  position,
  isSelected,
  onSelect,
  settings,
  getStatusColor,
}: {
  table: Table;
  position: TablePosition;
  isSelected: boolean;
  onSelect: (id: string) => void;
  settings: LayoutSettings;
  getStatusColor: (status: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    left: position.x,
    top: position.y,
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0) rotate(${position.rotation}deg) scale(${position.scale})`,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get status color and background
  const statusColor = getStatusColor(table.status);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute cursor-move",
        position.locked && "cursor-not-allowed opacity-60"
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover="hover"
      variants={tableVariants}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(table.id)}
    >
      {/* Table Visual */}
      <div
        className={cn(
          "relative rounded-lg border-2 shadow-lg transition-all duration-200",
          getStatusBackground(table.status),
          isSelected && "ring-2 ring-blue-500 ring-offset-2"
        )}
        style={{
          width: position.width,
          height: position.height,
        }}
      >
        {/* Status Indicator - Always visible for restaurant staff */}
        <div
          className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
            statusColor
          )}
        />

        {/* Table Number - Larger and more prominent */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg text-gray-800 drop-shadow-sm">
            {table.number}
          </span>
        </div>

        {/* Capacity Badge - Always visible */}
        <div className="absolute -bottom-2 -right-2">
          <Badge
            variant="secondary"
            className="text-xs font-semibold bg-gray-800 text-white hover:bg-gray-700"
          >
            <Users className="w-3 h-3 mr-1" />
            {table.capacity}
          </Badge>
        </div>

        {/* Status Label - Always visible for quick reference */}
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium capitalize px-2 py-1",
              table.status === "available" &&
                "bg-green-100 text-green-800 border-green-300",
              table.status === "occupied" &&
                "bg-red-100 text-red-800 border-red-300",
              table.status === "reserved" &&
                "bg-yellow-100 text-yellow-800 border-yellow-300",
              table.status === "unavailable" &&
                "bg-gray-100 text-gray-800 border-gray-300"
            )}
          >
            {table.status}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

// Draggable Element Component
function DraggableElement({
  element,
  isSelected,
  onSelect,
}: {
  element: RestaurantElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0) rotate(${element.rotation}deg)`,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const iconMap: Record<string, React.ComponentType<any>> = {
    DoorOpen,
    ChefHat,
    Wine,
    Building2,
    Bath,
    Package,
  };
  const IconComponent = iconMap[element.icon] || Building2;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute cursor-move",
        element.locked && "cursor-not-allowed opacity-60"
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(element.id)}
    >
      <div
        className={cn(
          "w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center p-2 transition-all duration-200",
          isSelected && "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
        )}
        style={{ backgroundColor: element.color + "20" }}
      >
        <div className="text-center w-full">
          <IconComponent
            className="w-4 h-4 mx-auto mb-1"
            style={{ color: element.color }}
          />
          <p
            className="text-xs font-medium leading-tight break-words"
            style={{ color: element.color }}
          >
            {element.name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TableLayoutEditor() {
  // Core state
  const [tables, setTables] = useState<Table[]>([]);
  const [tablePositions, setTablePositions] = useState<
    Map<string, TablePosition>
  >(new Map());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Layout settings
  const [settings, setSettings] = useState<LayoutSettings>({
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
    showLabels: true,
    showStatus: true,
    showCapacity: true,
    theme: "professional",
    zoom: 1,
    showRulers: true,
    showGuides: true,
  });

  // Restaurant elements
  const [restaurantElements, setRestaurantElements] = useState<
    RestaurantElement[]
  >([
    {
      id: "entrance-1",
      type: "entrance",
      name: "Main Entrance",
      x: 50,
      y: 50,
      width: 140,
      height: 80,
      rotation: 0,
      color: "#10b981",
      icon: "DoorOpen",
      locked: false,
      visible: true,
    },
    {
      id: "kitchen-1",
      type: "kitchen",
      name: "Kitchen",
      x: 400,
      y: 50,
      width: 100,
      height: 70,
      rotation: 0,
      color: "#f59e0b",
      icon: "ChefHat",
      locked: false,
      visible: true,
    },
    {
      id: "bar-1",
      type: "bar",
      name: "Bar",
      x: 50,
      y: 300,
      width: 80,
      height: 60,
      rotation: 0,
      color: "#8b5cf6",
      icon: "Wine",
      locked: false,
      visible: true,
    },
  ]);

  // UI state

  const [showElementLibrary, setShowElementLibrary] = useState(false);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [restaurantType, setRestaurantType] = useState<string | null>(null);
  const [defaultTemplateLoaded, setDefaultTemplateLoaded] = useState(false);

  // History management
  const [history, setHistory] = useState<LayoutHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // DND Kit state
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"table" | "element" | null>(
    null
  );

  // WebSocket for real-time updates
  const { isConnected } = useTablesWebSocket({
    onTableAdded: (table: Table) => {
      setTables((prev) => [...prev, table]);
    },
    onTableUpdated: (table: Table) => {
      setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
    },
    onTableDeleted: (table: Table) => {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      setTablePositions((prev) => {
        const newPositions = new Map(prev);
        newPositions.delete(table.id);
        return newPositions;
      });
    },
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Loading layout data...");

        // Load tables and restaurant elements in parallel
        const [tablesResult, elementsResult] = await Promise.all([
          getTablesWithLayout(),
          getRestaurantElements(),
        ]);

        console.log("Tables result:", tablesResult);
        console.log("Elements result:", elementsResult);

        if (tablesResult.success && tablesResult.data) {
          setTables(tablesResult.data);
          console.log("Loaded tables:", tablesResult.data.length);
          
          // Initialize positions from database layout data
          setTablePositions((prev) => {
            const newPositions = new Map(prev);
            tablesResult.data.forEach((table) => {
              // Use saved layout data or default values
              const savedX = table.layout_x ?? Math.random() * 400 + 100;
              const savedY = table.layout_y ?? Math.random() * 300 + 100;
              const savedRotation = table.layout_rotation ?? 0;
              const defaultSize = getTableSize(table.capacity);
              const savedWidth = table.layout_width ?? defaultSize.width;
              const savedHeight = table.layout_height ?? defaultSize.height;

              newPositions.set(table.id, {
                id: table.id,
                x: savedX,
                y: savedY,
                rotation: savedRotation,
                scale: 1,
                width: savedWidth,
                height: savedHeight,
                locked: false,
                visible: true,
              });
              
              console.log(`Table ${table.id}: layout_x=${table.layout_x}, layout_y=${table.layout_y}, savedX=${savedX}, savedY=${savedY}`);
            });
            return newPositions;
          });
        } else {
          console.error("Failed to load tables:", tablesResult.error);
          setError(tablesResult.error || "Failed to load tables");
        }

        // Load restaurant elements
        if (elementsResult.success && elementsResult.data) {
          setRestaurantElements(elementsResult.data);
          console.log("Loaded restaurant elements:", elementsResult.data.length);
        } else {
          console.warn(
            "Failed to load restaurant elements:",
            elementsResult.error
          );
          // Don't set error for elements as they're optional
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load default template based on restaurant type (only once)
  useEffect(() => {
    // Skip if already loaded or still loading
    if (defaultTemplateLoaded || loading) {
      return;
    }

    const loadDefaultTemplate = async () => {
      try {
        const restaurantType = await getCurrentRestaurantType();

        if (!restaurantType) {
          console.log("No restaurant type found, skipping template loading");
          setDefaultTemplateLoaded(true);
          return;
        }

        console.log("Loading default template for restaurant type:", restaurantType);
        setRestaurantType(restaurantType);

        // Find templates that match the restaurant type
        const matchingTemplates = LAYOUT_TEMPLATES.filter(
          (template) => template.restaurantType === restaurantType
        );

        console.log("Found matching templates:", matchingTemplates.length);

        if (matchingTemplates.length > 0) {
          // Use the first matching template as default
          const defaultTemplate = matchingTemplates[0];
          console.log("Loading template:", defaultTemplate.name);

          // Load the template
          await loadTemplate(defaultTemplate);

          // Automatically save the template after loading
          try {
            // Save table positions
            if (tables.length > 0) {
              const tablePromises = Array.from(tablePositions.entries()).map(
                ([tableId, position]) => {
                  return updateTableLayout(
                    tableId,
                    position.x,
                    position.y,
                    position.rotation,
                    position.width,
                    position.height
                  );
                }
              );
              await Promise.all(tablePromises);
            }

            // Save restaurant elements
            if (restaurantElements.length > 0) {
              await saveRestaurantElements(restaurantElements);
            }

            toast.success(
              `Loaded and saved ${defaultTemplate.name} template for your ${restaurantType}`
            );
          } catch (error) {
            console.error("Error auto-saving template:", error);
            toast.success(
              `Loaded ${defaultTemplate.name} template for your ${restaurantType}`
            );
          }
        } else {
          console.log("No matching templates found for restaurant type:", restaurantType);
        }

        // Mark as loaded regardless of outcome to prevent retries
        setDefaultTemplateLoaded(true);
      } catch (error) {
        console.error("Error loading default template:", error);
        setDefaultTemplateLoaded(true); // Mark as loaded even on error to prevent retries
      }
    };

    // Check if we should load a default template
    // We should load if:
    // 1. We have tables but no proper saved layout
    // 2. We have no restaurant elements (indicating first time setup)
    const hasProperSavedLayout = tables.some(
      (table) =>
        table.layout_x !== null &&
        table.layout_y !== null &&
        table.layout_width !== null &&
        table.layout_height !== null &&
        // Check if positions are not just random values
        table.layout_x > 0 &&
        table.layout_y > 0
    );

    const hasRestaurantElements = restaurantElements.length > 0;
    const shouldLoadTemplate = tables.length > 0 && (!hasProperSavedLayout || !hasRestaurantElements);

    console.log("Template loading check:", {
      tablesCount: tables.length,
      hasProperSavedLayout,
      hasRestaurantElements,
      shouldLoadTemplate
    });

    if (shouldLoadTemplate) {
      console.log("Loading default template...");
      loadDefaultTemplate();
    } else {
      console.log("Skipping template loading - user has saved layout or no tables");
      setDefaultTemplateLoaded(true);
    }
  }, [tables, loading, defaultTemplateLoaded, restaurantElements.length]);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Initialize DND Kit
  useEffect(() => {
    setMounted(true);
  }, []);

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // History management
  const saveToHistory = useCallback(() => {
    const newHistory: LayoutHistory = {
      tables: new Map(tablePositions),
      elements: [...restaurantElements],
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const newHistoryArray = [...prev.slice(0, historyIndex + 1), newHistory];
      return newHistoryArray.slice(-20); // Keep last 20 states
    });
    setHistoryIndex((prev) => prev + 1);

    // Clear last saved indicator when layout changes
    setLastSaved(null);
  }, [tablePositions, restaurantElements, historyIndex]);

  useEffect(() => {
    setCanUndo(historyIndex > 0);
    setCanRedo(historyIndex < history.length - 1);
  }, [historyIndex, history.length]);

  const undo = useCallback(() => {
    if (canUndo && historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setTablePositions(new Map(previousState.tables));
      setRestaurantElements(previousState.elements);
      setHistoryIndex(historyIndex - 1);
    }
  }, [canUndo, historyIndex, history]);

  const redo = useCallback(() => {
    if (canRedo && historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTablePositions(new Map(nextState.tables));
      setRestaurantElements(nextState.elements);
      setHistoryIndex(historyIndex + 1);
    }
  }, [canRedo, historyIndex, history]);

  // Drag handlers using Framer Motion
  const handleTableDragStart = useCallback((tableId: string) => {
    setIsDragging(true);
    setSelectedTable(tableId);
  }, []);

  const handleTableDrag = useCallback(
    (tableId: string, info: any) => {
      setTablePositions((prev) => {
        const newPositions = new Map(prev);
        const current = newPositions.get(tableId);
        if (current) {
          let newX = current.x + info.delta.x / settings.zoom;
          let newY = current.y + info.delta.y / settings.zoom;

          // Snap to grid
          if (settings.snapToGrid) {
            newX = Math.round(newX / settings.gridSize) * settings.gridSize;
            newY = Math.round(newY / settings.gridSize) * settings.gridSize;
          }

          newPositions.set(tableId, {
            ...current,
            x: newX,
            y: newY,
          });
        }
        return newPositions;
      });
    },
    [settings.zoom, settings.snapToGrid, settings.gridSize]
  );

  const handleTableDragEnd = useCallback(() => {
    setIsDragging(false);
    setSelectedTable(null);
    saveToHistory();
  }, [saveToHistory]);

  const handleElementDragStart = useCallback((elementId: string) => {
    setIsDragging(true);
    setSelectedElement(elementId);
  }, []);

  const handleElementDrag = useCallback(
    (elementId: string, info: any) => {
      setRestaurantElements((prev) =>
        prev.map((element) => {
          if (element.id === elementId) {
            let newX = element.x + info.delta.x / settings.zoom;
            let newY = element.y + info.delta.y / settings.zoom;

            if (settings.snapToGrid) {
              newX = Math.round(newX / settings.gridSize) * settings.gridSize;
              newY = Math.round(newY / settings.gridSize) * settings.gridSize;
            }

            return { ...element, x: newX, y: newY };
          }
          return element;
        })
      );
    },
    [settings.zoom, settings.snapToGrid, settings.gridSize]
  );

  const handleElementDragEnd = useCallback(() => {
    setIsDragging(false);
    setSelectedElement(null);
    saveToHistory();
  }, [saveToHistory]);

  // Delete selected element
  const deleteSelectedElement = useCallback(() => {
    if (selectedElement) {
      setRestaurantElements((prev) =>
        prev.filter((el) => el.id !== selectedElement)
      );
      setSelectedElement(null);
      saveToHistory();
      toast.success("Element deleted successfully!");
    }
  }, [selectedElement, saveToHistory]);

  // Delete selected table
  const deleteSelectedTable = useCallback(() => {
    if (selectedTable) {
      setTables((prev) => prev.filter((t) => t.id !== selectedTable));
      setTablePositions((prev) => {
        const newPositions = new Map(prev);
        newPositions.delete(selectedTable);
        return newPositions;
      });
      setSelectedTable(null);
      saveToHistory();
      toast.success("Table deleted successfully!");
    }
  }, [selectedTable, saveToHistory]);

  // Save layout to Supabase
  const saveLayout = useCallback(async () => {
    if (saving) return; // Prevent multiple simultaneous saves

    setSaving(true);
    try {
      console.log("Saving layout...", {
        tableCount: tablePositions.size,
        elementCount: restaurantElements.length,
      });

      // Validate data before saving
      if (tablePositions.size === 0 && restaurantElements.length === 0) {
        toast.warning("No layout data to save");
        return;
      }

      // Validate table positions data
      const invalidTablePositions = Array.from(tablePositions.entries()).filter(
        ([_, position]) =>
          typeof position.x !== "number" ||
          typeof position.y !== "number" ||
          typeof position.width !== "number" ||
          typeof position.height !== "number" ||
          isNaN(position.x) ||
          isNaN(position.y) ||
          isNaN(position.width) ||
          isNaN(position.height)
      );

      if (invalidTablePositions.length > 0) {
        console.warn("Invalid table positions found:", invalidTablePositions);
        toast.error(
          "Invalid table positions detected. Please refresh and try again."
        );
        return;
      }

      // Validate restaurant elements data
      const invalidElements = restaurantElements.filter(
        (element) =>
          typeof element.x !== "number" ||
          typeof element.y !== "number" ||
          typeof element.width !== "number" ||
          typeof element.height !== "number" ||
          isNaN(element.x) ||
          isNaN(element.y) ||
          isNaN(element.width) ||
          isNaN(element.height)
      );

      if (invalidElements.length > 0) {
        console.warn("Invalid elements found:", invalidElements);
        toast.error("Invalid elements detected. Please refresh and try again.");
        return;
      }

      // Save table positions
      let tableResults: Array<{ success: boolean; error?: string }> = [];
      if (tablePositions.size > 0) {
        const tablePromises = Array.from(tablePositions.entries()).map(
          ([tableId, position]) => {
            console.log(`Saving table ${tableId}:`, position);
            return updateTableLayout(
              tableId,
              position.x,
              position.y,
              position.rotation,
              position.width,
              position.height
            );
          }
        );

        tableResults = await Promise.all(tablePromises);
        console.log("Table save results:", tableResults);
      }

      // Save restaurant elements
      let elementsResult: { success: boolean; error?: string } = {
        success: true,
      };
      if (restaurantElements.length > 0) {
        console.log("Saving restaurant elements:", restaurantElements);
        elementsResult = await saveRestaurantElements(restaurantElements);
      }

      // Check results and provide appropriate feedback
      const failedTableSaves = tableResults.filter((result) => !result.success);

      if (failedTableSaves.length > 0) {
        console.warn("Some table saves failed:", failedTableSaves);
        toast.warning(
          `Saved ${tableResults.length - failedTableSaves.length} tables, ${failedTableSaves.length} failed`
        );
      }

      if (!elementsResult.success) {
        console.warn(
          "Failed to save restaurant elements:",
          elementsResult.error
        );
        toast.warning("Tables saved, but elements failed to save");
      }

      // Success message
      if (failedTableSaves.length === 0 && elementsResult.success) {
        toast.success("Layout saved successfully!");
        setLastSaved(new Date());
      } else if (failedTableSaves.length === 0) {
        toast.success("Table layout saved successfully!");
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [tablePositions, restaurantElements, saving]);

  // Download layout as image
  const downloadLayoutAsImage = useCallback(async () => {
    if (!canvasRef.current) return;

    const loadingToast = toast.loading("Generating image...");

    try {
      // Temporarily hide any UI elements that shouldn't be in the image
      const canvas = canvasRef.current;
      const originalStyle = canvas.style.pointerEvents;
      canvas.style.pointerEvents = "none";

      // Create the image with options to handle oklch color issues
      const canvasImage = await html2canvas(canvas, {
        backgroundColor: "#f9fafb",
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        onclone: (clonedDoc) => {
          // Replace oklch colors with fallback colors in the cloned document
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const style = window.getComputedStyle(htmlElement);
            if (style.background.includes("oklch")) {
              htmlElement.style.background = "#ffffff";
            }
            if (style.color.includes("oklch")) {
              htmlElement.style.color = "#000000";
            }
            if (style.borderColor.includes("oklch")) {
              htmlElement.style.borderColor = "#e5e7eb";
            }
          });
        },
      });

      // Restore original style
      canvas.style.pointerEvents = originalStyle;

      // Convert to blob and download
      canvasImage.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `restaurant-layout-${new Date().toISOString().split("T")[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Dismiss loading toast and show success
          toast.dismiss(loadingToast);
          toast.success("Layout image downloaded successfully!");
        } else {
          // Dismiss loading toast and show error
          toast.dismiss(loadingToast);
          toast.error("Failed to generate image");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error downloading layout as image:", error);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("Failed to download layout as image");
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            saveLayout();
            break;
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "d":
            event.preventDefault();
            downloadLayoutAsImage();
            break;
          case "Delete":
          case "Backspace":
            event.preventDefault();
            if (selectedElement) {
              deleteSelectedElement();
            } else if (selectedTable) {
              deleteSelectedTable();
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    saveLayout,
    undo,
    redo,
    downloadLayoutAsImage,
    deleteSelectedElement,
    deleteSelectedTable,
  ]);

  // DND Kit event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Determine if it's a table or element
    const table = tables.find((t) => t.id === active.id);
    const element = restaurantElements.find((e) => e.id === active.id);

    if (table) {
      setActiveType("table");
    } else if (element) {
      setActiveType("element");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    // Get the delta from the transform
    const transform = event.delta;

    if (activeType === "table") {
      const position = tablePositions.get(active.id as string);
      if (position) {
        const updatedPosition = {
          ...position,
          x: position.x + transform.x,
          y: position.y + transform.y,
        };
        setTablePositions((prev) =>
          new Map(prev).set(active.id as string, updatedPosition)
        );
        saveToHistory();
      }
    } else if (activeType === "element") {
      const element = restaurantElements.find((e) => e.id === active.id);
      if (element) {
        const updatedElement = {
          ...element,
          x: element.x + transform.x,
          y: element.y + transform.y,
        };
        setRestaurantElements((prev) =>
          prev.map((e) => (e.id === active.id ? updatedElement : e))
        );
        saveToHistory();
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  // Load layout template
  const loadTemplate = useCallback(
    async (template: (typeof LAYOUT_TEMPLATES)[0]) => {
      console.log("Loading template:", template.name, "with", template.tables.length, "tables");
      console.log("Available tables:", tables.length);
      
      const newPositions = new Map<string, TablePosition>();

      // Match template tables with actual tables by capacity
      const sortedTables = [...tables].sort((a, b) => a.capacity - b.capacity);
      const sortedTemplateTables = [...template.tables].sort((a, b) => a.capacity - b.capacity);

      console.log("Sorted tables by capacity:", sortedTables.map(t => ({ id: t.id, capacity: t.capacity })));
      console.log("Sorted template tables by capacity:", sortedTemplateTables.map(t => ({ capacity: t.capacity, x: t.x, y: t.y })));

      // Apply template positions to tables, matching by capacity
      sortedTemplateTables.forEach((tableConfig, index) => {
        const table = sortedTables[index];
        if (table) {
          const tableSize = getTableSize(table.capacity);
          newPositions.set(table.id, {
            id: table.id,
            x: tableConfig.x,
            y: tableConfig.y,
            rotation: 0,
            scale: 1,
            width: tableSize.width,
            height: tableSize.height,
            locked: false,
            visible: true,
          });
          console.log(`Positioned table ${table.id} (capacity: ${table.capacity}) at (${tableConfig.x}, ${tableConfig.y})`);
        }
      });

      // For any remaining tables that don't have template positions, place them in a grid
      const remainingTables = sortedTables.slice(sortedTemplateTables.length);
      let gridX = 100;
      let gridY = 400;
      remainingTables.forEach((table) => {
        const tableSize = getTableSize(table.capacity);
        newPositions.set(table.id, {
          id: table.id,
          x: gridX,
          y: gridY,
          rotation: 0,
          scale: 1,
          width: tableSize.width,
          height: tableSize.height,
          locked: false,
          visible: true,
        });
        console.log(`Positioned remaining table ${table.id} at grid position (${gridX}, ${gridY})`);
        gridX += 120;
        if (gridX > 600) {
          gridX = 100;
          gridY += 100;
        }
      });

      // Load template elements if they exist
      if (template.elements && template.elements.length > 0) {
        console.log("Loading template elements:", template.elements.length);
        setRestaurantElements(template.elements as RestaurantElement[]);

        // Save template elements to database
        try {
          await saveRestaurantElements(
            template.elements as RestaurantElement[]
          );
          console.log("Template elements saved to database");
        } catch (error) {
          console.warn("Failed to save template elements to database:", error);
        }
      } else {
        console.log("No template elements to load");
      }

      setTablePositions(newPositions);
      saveToHistory();
      setShowTemplates(false);
      toast.success(`Loaded ${template.name} template`);
    },
    [tables, saveToHistory]
  );

  // Reset layout
  const resetLayout = useCallback(async () => {
    const newPositions = new Map<string, TablePosition>();

    tables.forEach((table, index) => {
      const tableSize = getTableSize(table.capacity);
      newPositions.set(table.id, {
        id: table.id,
        x: 100 + (index % 4) * 120,
        y: 100 + Math.floor(index / 4) * 120,
        rotation: 0,
        scale: 1,
        width: tableSize.width,
        height: tableSize.height,
        locked: false,
        visible: true,
      });
    });

    setTablePositions(newPositions);
    setRestaurantElements([
      createElement("entrance", [], {
        id: "entrance-1",
        name: "Main Entrance",
        x: 50,
        y: 50,
      }),
      createElement("kitchen", [], {
        id: "kitchen-1",
        name: "Kitchen",
        x: 400,
        y: 50,
      }),
      createElement("bar", [], {
        id: "bar-1",
        name: "Bar",
        x: 50,
        y: 300,
      }),
    ]);

    // Save default elements to database
    try {
      await saveRestaurantElements([
        createElement("entrance", [], {
          id: "entrance-1",
          name: "Main Entrance",
          x: 50,
          y: 50,
        }),
        createElement("kitchen", [], {
          id: "kitchen-1",
          name: "Kitchen",
          x: 400,
          y: 50,
        }),
        createElement("bar", [], {
          id: "bar-1",
          name: "Bar",
          x: 50,
          y: 300,
        }),
      ]);
    } catch (error) {
      console.warn("Failed to save default elements to database:", error);
    }

    saveToHistory();
    toast.success("Layout reset to default");
  }, [tables, saveToHistory]);

  // Add new restaurant element
  const addElement = useCallback(
    (
      type: RestaurantElement["type"],
      baseName: string,
      icon: string,
      color: string
    ) => {
      const newElement = createElement(type, restaurantElements, {
        name: baseName,
        icon,
        color,
      });

      setRestaurantElements((prev) => [...prev, newElement]);
      saveToHistory();
      toast.success(`Added ${newElement.name} to layout`);
    },
    [saveToHistory, restaurantElements]
  );

  // Use shared table sizing function
  const getTableSize = useCallback(getTableSizeFromConstants, []);

  // Handle new tables being added
  useEffect(() => {
    if (tables.length > 0) {
      const currentTableIds = new Set(Array.from(tablePositions.keys()));
      const newTables = tables.filter(
        (table) => !currentTableIds.has(table.id)
      );

      if (newTables.length > 0) {
        const newPositions = new Map(tablePositions);

        newTables.forEach((table) => {
          const tableSize = getTableSize(table.capacity);
          newPositions.set(table.id, {
            id: table.id,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
            rotation: 0,
            scale: 1,
            width: tableSize.width,
            height: tableSize.height,
            locked: false,
            visible: true,
          });
        });

        setTablePositions(newPositions);
        toast.success(
          `Added ${newTables.length} new table${newTables.length > 1 ? "s" : ""} to layout`
        );
      }
    }
  }, [tables, tablePositions, getTableSize]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Table Layout Editor
          </h1>
          <p className="text-muted-foreground">
            Design and arrange your restaurant floor plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(true)}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard Shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadLayoutAsImage}
                  disabled={!canvasRef.current}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download as Image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {(selectedElement || selectedTable) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      selectedElement
                        ? deleteSelectedElement
                        : deleteSelectedTable
                    }
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete selected {selectedElement ? "element" : "table"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={saveLayout}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Layout
            </Button>
            {lastSaved && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Summary Panel */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
            Restaurant Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Total Tables */}
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {tables.length}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Total Tables
              </div>
            </div>

            {/* Available Tables */}
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {tables.filter((t) => t.status === "available").length}
              </div>
              <div className="text-sm text-green-700 font-medium">
                Available
              </div>
            </div>

            {/* Occupied Tables */}
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {tables.filter((t) => t.status === "occupied").length}
              </div>
              <div className="text-sm text-red-700 font-medium">Occupied</div>
            </div>

            {/* Reserved Tables */}
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {tables.filter((t) => t.status === "reserved").length}
              </div>
              <div className="text-sm text-yellow-700 font-medium">
                Reserved
              </div>
            </div>

            {/* Total Capacity */}
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {tables.reduce((sum, t) => sum + t.capacity, 0)}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                Total Capacity
              </div>
            </div>

            {/* Available Capacity */}
            <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">
                {tables
                  .filter((t) => t.status === "available")
                  .reduce((sum, t) => sum + t.capacity, 0)}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Available Seats
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full h-full overflow-auto rounded-none m-0 p-0">
              <div
                ref={canvasRef}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 relative w-full h-full m-0 p-0"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "600px",
                  margin: "0",
                  padding: "0",
                }}
                onClick={(e) => {
                  // Only deselect if clicking directly on the canvas (not on elements)
                  if (e.target === e.currentTarget) {
                    setSelectedElement(null);
                    setSelectedTable(null);
                  }
                }}
              >
                {/* Grid Pattern */}
                {settings.showGrid && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                        `,
                      backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
                    }}
                  />
                )}

                {/* Restaurant Elements */}
                <SortableContext
                  items={restaurantElements
                    .filter((element) => element.visible)
                    .map((element) => element.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {restaurantElements
                    .filter((element) => element.visible)
                    .map((element) => (
                      <DraggableElement
                        key={element.id}
                        element={element}
                        isSelected={selectedElement === element.id}
                        onSelect={setSelectedElement}
                      />
                    ))}
                </SortableContext>

                {/* Tables */}
                <SortableContext
                  items={tables.map((table) => table.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tables.map((table) => {
                    const position = tablePositions.get(table.id);
                    if (!position || !position.visible) return null;

                    return (
                      <DraggableTable
                        key={table.id}
                        table={table}
                        position={position}
                        isSelected={selectedTable === table.id}
                        onSelect={setSelectedTable}
                        settings={settings}
                        getStatusColor={getStatusColor}
                      />
                    );
                  })}
                </SortableContext>
              </div>
            </div>

            {mounted &&
              createPortal(
                <DragOverlay adjustScale={true}>
                  {activeId && activeType ? (
                    <div className="opacity-50">
                      {activeType === "table" && (
                        <div className="bg-white rounded-lg border-2 shadow-lg p-4">
                          <span className="font-bold text-lg">
                            Table{" "}
                            {tables.find((t) => t.id === activeId)?.number}
                          </span>
                        </div>
                      )}
                      {activeType === "element" && (
                        <div className="bg-white rounded-lg border-2 shadow-lg p-4">
                          <span className="font-bold text-lg">
                            {
                              restaurantElements.find((e) => e.id === activeId)
                                ?.name
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
          </DndContext>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Editor Settings */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                Editor Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Layout editor controls and tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-2">
                {/* Undo */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  className="w-full justify-start"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>

                {/* Redo */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  className="w-full justify-start"
                >
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </Button>

                {/* Reset Layout */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetLayout()}
                  className="w-full justify-start"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Layout
                </Button>

                {/* Layout Templates */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                  className="w-full justify-start"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Layout Templates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Element Library */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                Element Library
              </CardTitle>
              <CardDescription className="text-sm">
                Drag and drop elements to build your restaurant layout
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {/* Main Entrance */}
                <div
                  onClick={() =>
                    addElement("entrance", "Entrance", "DoorOpen", "#10b981")
                  }
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-green-100 rounded-md">
                        <DoorOpen className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-green-700">
                        Entrance
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kitchen */}
                <div
                  onClick={() =>
                    addElement("kitchen", "Kitchen", "ChefHat", "#f59e0b")
                  }
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-orange-100 rounded-md">
                        <ChefHat className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-orange-700">
                        Kitchen
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar Counter */}
                <div
                  onClick={() => addElement("bar", "Bar", "Wine", "#8b5cf6")}
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-purple-100 rounded-md">
                        <Wine className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700">
                        Bar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bathroom */}
                <div
                  onClick={() =>
                    addElement("bathroom", "Bathroom", "Bath", "#06b6d4")
                  }
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-cyan-100 rounded-md">
                        <Bath className="w-3 h-3 text-cyan-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-cyan-700">
                        Bathroom
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Counter */}
                <div
                  onClick={() =>
                    addElement("counter", "Counter", "Building2", "#ef4444")
                  }
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-red-100 rounded-md">
                        <Building2 className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-red-700">
                        Counter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div
                  onClick={() =>
                    addElement("storage", "Storage", "Package", "#6b7280")
                  }
                  className="group cursor-pointer"
                >
                  <div className="p-2 border-2 border-gray-200 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-gray-100 rounded-md">
                        <Package className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-gray-700">
                        Storage
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Layout Templates</DialogTitle>
            {restaurantType && (
              <DialogDescription>
                Showing templates for {restaurantType} restaurants
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LAYOUT_TEMPLATES.filter(
              (template) =>
                !restaurantType || template.restaurantType === restaurantType
            ).map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {template.tables.length} tables
                      {template.elements && template.elements.length > 0 && (
                        <span className="ml-2">
                          • {template.elements.length} elements
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => loadTemplate(template)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">File Operations</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Save Layout</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+S
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+Z
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+Shift+Z
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Download as Image</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+D
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete Selected</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Delete
                    </kbd>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">View Controls</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Zoom In</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+=
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Zoom Out</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+-
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset Zoom</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Ctrl+0
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>
                💡 Tip: You can drag tables and elements around the canvas to
                rearrange your layout.
              </p>
              <p>💡 Tip: Use the grid settings to align elements perfectly.</p>
              <p>💡 Tip: Save your layout frequently to preserve your work.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

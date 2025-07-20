"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Grid3X3,
  Move,
  Plus,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Trash2,
  Copy,
  QrCode,
  Users,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  Palette,
  Ruler,
  Undo2,
  Redo2,
  Download,
  Upload,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw as RotateIcon,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Group,
  Ungroup,
  Smartphone,
  Monitor,
  Printer,
  FileText,
  Layout,
  Building,
  Utensils,
  Coffee,
  Wine,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";
import { TableQRCode } from "./TableQRCode";
import { generateTableQRData } from "@/lib/utils/qr-code";

type Table = Database["public"]["Tables"]["tables"]["Row"];

interface TablePosition {
  id: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  status: string;
  capacity: number;
}

interface TableLayoutEditorProps {
  tables: Table[];
  onSave: (positions: TablePosition[]) => Promise<void>;
  onClose: () => void;
  restaurantId: string;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// Restaurant layout templates
const LAYOUT_TEMPLATES = [
  {
    id: "restaurant",
    name: "Restaurant",
    icon: Utensils,
    description: "Traditional restaurant layout",
    tables: [
      { x: 100, y: 100, width: 120, height: 80 },
      { x: 300, y: 100, width: 120, height: 80 },
      { x: 500, y: 100, width: 120, height: 80 },
      { x: 100, y: 250, width: 120, height: 80 },
      { x: 300, y: 250, width: 120, height: 80 },
      { x: 500, y: 250, width: 120, height: 80 },
    ],
  },
  {
    id: "cafe",
    name: "Café",
    icon: Coffee,
    description: "Cozy café layout",
    tables: [
      { x: 80, y: 80, width: 100, height: 100 },
      { x: 220, y: 80, width: 100, height: 100 },
      { x: 360, y: 80, width: 100, height: 100 },
      { x: 80, y: 220, width: 100, height: 100 },
      { x: 220, y: 220, width: 100, height: 100 },
      { x: 360, y: 220, width: 100, height: 100 },
    ],
  },
  {
    id: "bar",
    name: "Bar",
    icon: Wine,
    description: "Bar and lounge layout",
    tables: [
      { x: 50, y: 50, width: 80, height: 60 },
      { x: 150, y: 50, width: 80, height: 60 },
      { x: 250, y: 50, width: 80, height: 60 },
      { x: 350, y: 50, width: 80, height: 60 },
      { x: 50, y: 150, width: 80, height: 60 },
      { x: 150, y: 150, width: 80, height: 60 },
    ],
  },
];

// Table shapes and styles
const TABLE_SHAPES = [
  { id: "rectangle", name: "Rectangle", icon: Square },
  { id: "circle", name: "Circle", icon: Circle },
];

const TABLE_THEMES = [
  {
    id: "default",
    name: "Default",
    colors: { bg: "#ffffff", border: "#e5e7eb", text: "#374151" },
  },
  {
    id: "modern",
    name: "Modern",
    colors: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
  },
  {
    id: "elegant",
    name: "Elegant",
    colors: { bg: "#fefefe", border: "#d1d5db", text: "#6b7280" },
  },
  {
    id: "bold",
    name: "Bold",
    colors: { bg: "#1f2937", border: "#374151", text: "#f9fafb" },
  },
];

export default function TableLayoutEditor({
  tables,
  onSave,
  onClose,
  restaurantId,
}: TableLayoutEditorProps) {
  const [tablePositions, setTablePositions] = useState<TablePosition[]>(() =>
    tables.map((table, index) => ({
      id: table.id,
      x: (index % 8) * 160 + 50,
      y: Math.floor(index / 8) * 160 + 50,
      rotation: 0,
      width: 140,
      height: 100,
      zIndex: index,
      locked: false,
      visible: true,
      status: table.status,
      capacity: table.capacity,
    }))
  );

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [selectedShape, setSelectedShape] = useState("rectangle");
  const [history, setHistory] = useState<TablePosition[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPanning, setIsPanning] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [activeTab, setActiveTab] = useState("layout");
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });

  // Save to history
  const saveToHistory = useCallback(
    (newPositions: TablePosition[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push([...newPositions]);
        return newHistory.slice(-20); // Keep last 20 states
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
      setTablePositions([...history[historyIndex - 1]]);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
      setTablePositions([...history[historyIndex + 1]]);
    }
  }, [canRedo, history, historyIndex]);

  // Apply layout template
  const applyTemplate = useCallback(
    (template: (typeof LAYOUT_TEMPLATES)[0]) => {
      const newPositions = tablePositions.map((pos, index) => {
        const templateTable = template.tables[index];
        if (templateTable) {
          return {
            ...pos,
            x: templateTable.x,
            y: templateTable.y,
            width: templateTable.width,
            height: templateTable.height,
          };
        }
        return pos;
      });
      setTablePositions(newPositions);
      saveToHistory(newPositions);
      toast.success(`Applied ${template.name} layout template`);
    },
    [tablePositions, saveToHistory]
  );

  // Grid pattern
  const gridPattern = useMemo(() => {
    const pattern = [];
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      pattern.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_HEIGHT}
          stroke="#e5e7eb"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      pattern.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={CANVAS_WIDTH}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    return pattern;
  }, []);

  // Handle table selection
  const handleTableSelect = useCallback(
    (tableId: string, multiSelect = false) => {
      if (multiSelect) {
        setSelectedTables((prev) =>
          prev.includes(tableId)
            ? prev.filter((id) => id !== tableId)
            : [...prev, tableId]
        );
      } else {
        setSelectedTables([tableId]);
      }
    },
    []
  );

  // Handle table drag
  const handleTableDrag = useCallback(
    (tableId: string, x: number, y: number) => {
      setTablePositions((prev) => {
        const newPositions = prev.map((pos) => {
          if (pos.id === tableId) {
            let newX = x;
            let newY = y;

            if (snapToGrid) {
              newX = Math.round(x / GRID_SIZE) * GRID_SIZE;
              newY = Math.round(y / GRID_SIZE) * GRID_SIZE;
            }

            return { ...pos, x: newX, y: newY };
          }
          return pos;
        });
        saveToHistory(newPositions);
        return newPositions;
      });
    },
    [snapToGrid, saveToHistory]
  );

  // Handle table resize
  const handleTableResize = useCallback(
    (tableId: string, width: number, height: number) => {
      setTablePositions((prev) => {
        const newPositions = prev.map((pos) => {
          if (pos.id === tableId) {
            return { ...pos, width, height };
          }
          return pos;
        });
        saveToHistory(newPositions);
        return newPositions;
      });
    },
    [saveToHistory]
  );

  // Handle table rotation
  const handleTableRotate = useCallback(
    (tableId: string, rotation: number) => {
      setTablePositions((prev) => {
        const newPositions = prev.map((pos) => {
          if (pos.id === tableId) {
            return { ...pos, rotation };
          }
          return pos;
        });
        saveToHistory(newPositions);
        return newPositions;
      });
    },
    [saveToHistory]
  );

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  }, []);

  // Pan controls
  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPan((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  // Alignment tools
  const alignTables = useCallback(
    (alignment: string) => {
      if (selectedTables.length < 2) return;

      setTablePositions((prev) => {
        const newPositions = [...prev];
        const selectedPositions = newPositions.filter((pos) =>
          selectedTables.includes(pos.id)
        );

        if (alignment === "left") {
          const minX = Math.min(...selectedPositions.map((p) => p.x));
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].x = minX;
          });
        } else if (alignment === "center") {
          const centerX =
            selectedPositions.reduce(
              (sum, pos) => sum + pos.x + pos.width / 2,
              0
            ) / selectedPositions.length;
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].x = centerX - pos.width / 2;
          });
        } else if (alignment === "right") {
          const maxX = Math.max(...selectedPositions.map((p) => p.x + p.width));
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].x = maxX - pos.width;
          });
        } else if (alignment === "top") {
          const minY = Math.min(...selectedPositions.map((p) => p.y));
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].y = minY;
          });
        } else if (alignment === "middle") {
          const centerY =
            selectedPositions.reduce(
              (sum, pos) => sum + pos.y + pos.height / 2,
              0
            ) / selectedPositions.length;
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].y = centerY - pos.height / 2;
          });
        } else if (alignment === "bottom") {
          const maxY = Math.max(
            ...selectedPositions.map((p) => p.y + p.height)
          );
          selectedPositions.forEach((pos) => {
            const index = newPositions.findIndex((p) => p.id === pos.id);
            if (index !== -1) newPositions[index].y = maxY - pos.height;
          });
        }

        saveToHistory(newPositions);
        return newPositions;
      });
    },
    [selectedTables, saveToHistory]
  );

  // Distribute tables
  const distributeTables = useCallback(
    (direction: "horizontal" | "vertical") => {
      if (selectedTables.length < 3) return;

      setTablePositions((prev) => {
        const newPositions = [...prev];
        const selectedPositions = newPositions.filter((pos) =>
          selectedTables.includes(pos.id)
        );

        if (direction === "horizontal") {
          const sorted = selectedPositions.sort((a, b) => a.x - b.x);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalSpace = last.x - first.x;
          const spacing = totalSpace / (sorted.length - 1);

          sorted.forEach((pos, index) => {
            if (index > 0 && index < sorted.length - 1) {
              const tableIndex = newPositions.findIndex((p) => p.id === pos.id);
              if (tableIndex !== -1) {
                newPositions[tableIndex].x = first.x + spacing * index;
              }
            }
          });
        } else {
          const sorted = selectedPositions.sort((a, b) => a.y - b.y);
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const totalSpace = last.y - first.y;
          const spacing = totalSpace / (sorted.length - 1);

          sorted.forEach((pos, index) => {
            if (index > 0 && index < sorted.length - 1) {
              const tableIndex = newPositions.findIndex((p) => p.id === pos.id);
              if (tableIndex !== -1) {
                newPositions[tableIndex].y = first.y + spacing * index;
              }
            }
          });
        }

        saveToHistory(newPositions);
        return newPositions;
      });
    },
    [selectedTables, saveToHistory]
  );

  // Save layout
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(tablePositions);
      toast.success("Table layout saved successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save table layout");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset layout
  const handleReset = () => {
    const resetPositions = tables.map((table, index) => ({
      id: table.id,
      x: (index % 8) * 160 + 50,
      y: Math.floor(index / 8) * 160 + 50,
      rotation: 0,
      width: 140,
      height: 100,
      zIndex: index,
      locked: false,
      visible: true,
      status: table.status,
      capacity: table.capacity,
    }));
    setTablePositions(resetPositions);
    setSelectedTables([]);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    saveToHistory(resetPositions);
    toast.success("Layout reset to default");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
      case "reserved":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unavailable":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Get theme colors
  const themeColors =
    TABLE_THEMES.find((theme) => theme.id === selectedTheme)?.colors ||
    TABLE_THEMES[0].colors;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Layout className="w-6 h-6" />
                Table Layout Editor
              </DialogTitle>
              <p className="text-muted-foreground">
                Design your restaurant layout with drag-and-drop precision
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 className="w-4 h-4 mr-2" />
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Toolbar */}
          <div className="w-16 bg-gray-50 border-r flex flex-col items-center py-4 space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    className="w-10 h-10 p-0"
                  >
                    {showGrid ? (
                      <Grid3X3 className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {showGrid ? "Hide Grid" : "Show Grid"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`w-10 h-10 p-0 ${snapToGrid ? "bg-blue-100 text-blue-600" : ""}`}
                  >
                    <Ruler className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {snapToGrid ? "Snap to Grid: On" : "Snap to Grid: Off"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPanning(!isPanning)}
                    className={`w-10 h-10 p-0 ${isPanning ? "bg-blue-100 text-blue-600" : ""}`}
                  >
                    <Move className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isPanning ? "Pan Mode: On" : "Pan Mode: Off"}
                </TooltipContent>
              </Tooltip>

              <Separator className="w-8" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom(0.1)}
                    className="w-10 h-10 p-0"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom(-0.1)}
                    className="w-10 h-10 p-0"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(1)}
                    className="w-10 h-10 p-0"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Reset Zoom</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={canvasRef}
              className="w-full h-full relative cursor-grab active:cursor-grabbing"
              style={{
                background: showGrid
                  ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEgyMFYyMEgwVjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMCAwSDFWSDIwVjBIMFYwWiIgZmlsbD0iI2U1ZTdlYiIvPgo8cGF0aCBkPSJNMCAwSDFWSDIwVjBIMFYwWiIgZmlsbD0iI2U1ZTdlYiIvPgo8L3N2Zz4K")'
                  : "#ffffff",
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: "0 0",
              }}
              onMouseDown={(e) => {
                if (isPanning) {
                  setIsDragging(true);
                  lastPanRef.current = { x: e.clientX, y: e.clientY };
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && isPanning) {
                  const deltaX = e.clientX - lastPanRef.current.x;
                  const deltaY = e.clientY - lastPanRef.current.y;
                  handlePan(deltaX / zoom, deltaY / zoom);
                  lastPanRef.current = { x: e.clientX, y: e.clientY };
                }
              }}
              onMouseUp={() => {
                setIsDragging(false);
              }}
            >
              {/* Tables */}
              <motion.div className="absolute inset-0">
                {tablePositions.map((position) => {
                  const table = tables.find((t) => t.id === position.id);
                  if (!table || !position.visible) return null;

                  const isSelected = selectedTables.includes(position.id);
                  const theme =
                    TABLE_THEMES.find((t) => t.id === selectedTheme)?.colors ||
                    TABLE_THEMES[0].colors;

                  return (
                    <motion.div
                      key={position.id}
                      className={`absolute cursor-move ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                      style={{
                        left: position.x,
                        top: position.y,
                        width: position.width,
                        height: position.height,
                        transform: `rotate(${position.rotation}deg)`,
                        zIndex: position.zIndex,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!isPanning) {
                          handleTableSelect(position.id, e.shiftKey);
                        }
                      }}
                      drag={!isPanning && !position.locked}
                      dragMomentum={false}
                      dragElastic={0}
                      onDragEnd={(event, info) => {
                        if (!isPanning) {
                          handleTableDrag(
                            position.id,
                            info.point.x,
                            info.point.y
                          );
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="w-full h-full border-2 hover:border-blue-300 transition-colors"
                        style={{
                          backgroundColor: theme.bg,
                          borderColor: isSelected ? "#3b82f6" : theme.border,
                        }}
                      >
                        <CardContent className="p-2 h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="text-xs font-bold"
                              style={{ color: theme.text }}
                            >
                              {table.number}
                            </Badge>
                            <Badge
                              className={`text-xs ${getStatusColor(position.status)}`}
                            >
                              {position.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-center flex-1">
                            <div className="text-center">
                              <div
                                className="flex items-center justify-center gap-1 text-xs"
                                style={{ color: theme.text }}
                              >
                                <Users className="w-3 h-3" />
                                <span>{position.capacity}</span>
                              </div>
                              {showQRPreview && (
                                <div className="mt-1">
                                  <TableQRCode
                                    tableData={generateTableQRData(
                                      table.id,
                                      table.number,
                                      restaurantId
                                    )}
                                    size="sm"
                                    showActions={false}
                                    className="mx-auto scale-75"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-lg shadow-lg text-sm">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="tables">Tables</TabsTrigger>
                <TabsTrigger value="qr">QR Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="space-y-6 mt-4">
                {/* Layout Templates */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Layout Templates
                  </h3>
                  <div className="space-y-2">
                    {LAYOUT_TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="w-full justify-start"
                      >
                        <template.icon className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500">
                            {template.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Canvas Controls */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Canvas Controls
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">
                        Zoom: {Math.round(zoom * 100)}%
                      </Label>
                      <Slider
                        value={[zoom]}
                        onValueChange={([value]) => setZoom(value)}
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Grid</Label>
                      <Switch
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Snap to Grid</Label>
                      <Switch
                        checked={snapToGrid}
                        onCheckedChange={setSnapToGrid}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Rulers</Label>
                      <Switch
                        checked={showRulers}
                        onCheckedChange={setShowRulers}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Theme & Style */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme & Style
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Theme</Label>
                      <Select
                        value={selectedTheme}
                        onValueChange={setSelectedTheme}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TABLE_THEMES.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Shape</Label>
                      <Select
                        value={selectedShape}
                        onValueChange={setSelectedShape}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TABLE_SHAPES.map((shape) => (
                            <SelectItem key={shape.id} value={shape.id}>
                              {shape.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tables" className="space-y-6 mt-4">
                {/* Table Properties */}
                {selectedTables.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Table Properties ({selectedTables.length} selected)
                    </h3>
                    <div className="space-y-3">
                      {selectedTables.map((tableId) => {
                        const position = tablePositions.find(
                          (p) => p.id === tableId
                        );
                        const table = tables.find((t) => t.id === tableId);
                        if (!position || !table) return null;

                        return (
                          <Card key={tableId} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  Table {table.number}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTableSelect(tableId)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">X</Label>
                                  <Input
                                    type="number"
                                    value={position.x}
                                    onChange={(e) =>
                                      handleTableDrag(
                                        tableId,
                                        parseInt(e.target.value),
                                        position.y
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Y</Label>
                                  <Input
                                    type="number"
                                    value={position.y}
                                    onChange={(e) =>
                                      handleTableDrag(
                                        tableId,
                                        position.x,
                                        parseInt(e.target.value)
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    value={position.width}
                                    onChange={(e) =>
                                      handleTableResize(
                                        tableId,
                                        parseInt(e.target.value),
                                        position.height
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Height</Label>
                                  <Input
                                    type="number"
                                    value={position.height}
                                    onChange={(e) =>
                                      handleTableResize(
                                        tableId,
                                        position.width,
                                        parseInt(e.target.value)
                                      )
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Rotation</Label>
                                <Input
                                  type="number"
                                  value={position.rotation}
                                  onChange={(e) =>
                                    handleTableRotate(
                                      tableId,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Alignment Tools */}
                {selectedTables.length > 1 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlignCenter className="w-4 h-4" />
                      Alignment Tools
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("left")}
                        className="h-8"
                      >
                        <AlignLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("center")}
                        className="h-8"
                      >
                        <AlignCenter className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("right")}
                        className="h-8"
                      >
                        <AlignRight className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("top")}
                        className="h-8"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("middle")}
                        className="h-8"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alignTables("bottom")}
                        className="h-8"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => distributeTables("horizontal")}
                        className="flex-1 h-8 text-xs"
                      >
                        <ChevronRight className="w-3 h-3 mr-1" />
                        Distribute H
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => distributeTables("vertical")}
                        className="flex-1 h-8 text-xs"
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Distribute V
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="qr" className="space-y-6 mt-4">
                {/* QR Preview Controls */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code Preview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show QR Codes</Label>
                      <Switch
                        checked={showQRPreview}
                        onCheckedChange={setShowQRPreview}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Toggle QR code preview on tables to see how they'll appear
                      to customers.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* QR Code Information */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    QR Code Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tables:</span>
                      <span className="font-medium">{tables.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">QR Codes Generated:</span>
                      <span className="font-medium">{tables.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Layout Saved:</span>
                      <span className="font-medium text-green-600">Yes</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Export Options */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Options
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Export layout as image
                        toast.info("Export layout feature coming soon!");
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Export as Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Print layout
                        toast.info("Print layout feature coming soon!");
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Layout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        // Export QR codes
                        toast.info("Bulk QR export feature coming soon!");
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Export All QR Codes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

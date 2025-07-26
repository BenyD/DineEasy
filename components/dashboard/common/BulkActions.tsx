"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsProps<T> {
  items: T[];
  itemKey: (item: T) => string;
  selectedIds?: string[];
  onSelectAll?: (all: boolean) => void;
  onSelectItem?: (id: string, selected: boolean) => void;
  isBulkMode?: boolean;
  onBulkModeChange?: (active: boolean) => void;
  children?: (props: {
    selectedIds: string[];
    isBulkMode: boolean;
    handleSelectAll: () => void;
    handleSelectItem: (id: string, selected: boolean) => void;
    handleBulkModeToggle: () => void;
  }) => React.ReactNode;
  className?: string;
  color?: "blue" | "green" | "purple" | "red";
}

const colorVariants = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    badge: "bg-blue-100 text-blue-800",
    button: "text-blue-600 hover:text-blue-700",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    badge: "bg-green-100 text-green-800",
    button: "text-green-600 hover:text-green-700",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-900",
    badge: "bg-purple-100 text-purple-800",
    button: "text-purple-600 hover:text-purple-700",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    badge: "bg-red-100 text-red-800",
    button: "text-red-600 hover:text-red-700",
  },
};

export function BulkActions<T>({
  items,
  itemKey,
  selectedIds: externalSelectedIds,
  onSelectAll: externalOnSelectAll,
  onSelectItem: externalOnSelectItem,
  isBulkMode: externalIsBulkMode,
  onBulkModeChange: externalOnBulkModeChange,
  children,
  className,
  color = "blue",
}: BulkActionsProps<T>) {
  // Internal state for uncontrolled mode
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalIsBulkMode, setInternalIsBulkMode] = useState(false);

  // Use external or internal state
  const selectedIds = externalSelectedIds ?? internalSelectedIds;
  const isBulkMode = externalIsBulkMode ?? internalIsBulkMode;

  const handleSelectAll = () => {
    if (externalOnSelectAll) {
      externalOnSelectAll(selectedIds.length === items.length);
    } else {
      if (selectedIds.length === items.length) {
        setInternalSelectedIds([]);
      } else {
        setInternalSelectedIds(items.map(itemKey));
      }
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    if (externalOnSelectItem) {
      externalOnSelectItem(id, selected);
    } else {
      if (selected) {
        setInternalSelectedIds((prev) => [...prev, id]);
      } else {
        setInternalSelectedIds((prev) =>
          prev.filter((itemId) => itemId !== id)
        );
      }
    }
  };

  const handleBulkModeToggle = () => {
    if (externalOnBulkModeChange) {
      externalOnBulkModeChange(!isBulkMode);
    } else {
      setInternalIsBulkMode(!isBulkMode);
    }
  };

  const colors = colorVariants[color];

  if (items.length === 0) return null;

  return (
    <>
      {/* Bulk Mode Toggle Button - Only show if not in controlled mode */}
      {!externalOnBulkModeChange && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkModeToggle}
            data-bulk-toggle
            className={cn(
              isBulkMode && `${colors.bg} ${colors.border}`,
              className
            )}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {isBulkMode ? "Exit Bulk Mode" : "Bulk Mode"}
          </Button>
        </motion.div>
      )}

      {/* Bulk Actions Panel */}
      {isBulkMode && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden mb-6"
        >
          <div
            className={cn(
              "rounded-xl p-4 shadow-lg border-2 backdrop-blur-sm",
              colors.bg,
              colors.border,
              "relative overflow-hidden"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-current rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-current rounded-full translate-y-12 -translate-x-12" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    colors.bg.replace("bg-", "bg-").replace("-50", "-100")
                  )}
                >
                  <CheckSquare className={cn("w-5 h-5", colors.text)} />
                </div>
                <div>
                  <h3 className={cn("font-semibold text-lg", colors.text)}>
                    Bulk Operations Mode
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select items to perform actions on multiple items at once
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkModeToggle}
                className={cn(
                  "text-gray-500 hover:text-gray-700 transition-colors",
                  "hover:bg-white/50 rounded-full p-2"
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            {/* Selection Status */}
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "bg-white/80 backdrop-blur-sm border-2 px-3 py-1.5 text-sm font-medium",
                    colors.badge
                  )}
                >
                  <CheckSquare className="w-3 h-3 mr-1.5" />
                  {selectedIds.length} of {items.length} items selected
                </Badge>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 font-medium">
                      Ready for bulk actions
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                className={cn(
                  "text-sm font-medium transition-all duration-200",
                  selectedIds.length === items.length
                    ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    : "bg-white/80 border-gray-200 text-gray-700 hover:bg-white"
                )}
              >
                {selectedIds.length === items.length ? (
                  <>
                    <svg
                      className="w-3 h-3 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3 h-3 mr-1.5" />
                    Select All ({items.length})
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {items.length > 0 && (
              <div className="relative mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-all duration-300 bg-green-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(0, Math.min(100, (selectedIds.length / items.length) * 100))}%`,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{selectedIds.length} selected</span>
                  <span>
                    {Math.round((selectedIds.length / items.length) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="relative pt-3 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>💡 Tip: Use Ctrl+A to select all items quickly</span>
                <span>
                  {selectedIds.length > 0
                    ? `${selectedIds.length} items ready`
                    : "No items selected"}
                </span>
              </div>
              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkModeToggle();
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Exit Bulk Mode
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Always render children (tables grid, menu items, etc.) */}
      {children &&
        children({
          selectedIds,
          isBulkMode,
          handleSelectAll,
          handleSelectItem,
          handleBulkModeToggle,
        })}
    </>
  );
}

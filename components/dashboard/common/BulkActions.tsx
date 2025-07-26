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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mb-4"
        >
          <div
            className={cn(
              "rounded-lg p-2 flex items-center justify-between",
              colors.bg,
              colors.border,
              "border"
            )}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("bg-white", colors.badge)}>
                {selectedIds.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className={cn("text-xs", colors.button)}
              >
                {selectedIds.length === items.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {/* Custom actions from children */}
            {children &&
              children({
                selectedIds,
                isBulkMode,
                handleSelectAll,
                handleSelectItem,
                handleBulkModeToggle,
              })}
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

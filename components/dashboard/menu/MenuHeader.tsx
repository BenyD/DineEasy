"use client";

import {
  Search,
  Grid,
  List,
  CheckSquare,
  MoreHorizontal,
  Download,
  Upload,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MenuHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  isBulkMode: boolean;
  onBulkModeToggle: () => void;
}

export function MenuHeader({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isBulkMode,
  onBulkModeToggle,
}: MenuHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11"
        />
      </div>
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="bg-muted p-1 rounded-md flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "h-8 w-8",
              viewMode === "list" &&
                "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "h-8 w-8",
              viewMode === "grid" &&
                "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>

        {/* Bulk Actions */}
        <Button
          variant={isBulkMode ? "default" : "outline"}
          size="icon"
          onClick={onBulkModeToggle}
          className={cn(
            "h-8 w-8",
            isBulkMode && "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

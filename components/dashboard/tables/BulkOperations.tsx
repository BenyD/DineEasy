"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  Settings,
  Download,
  Trash2,
  Copy,
  QrCode,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  FileText,
  Share2,
} from "lucide-react";
import type { Database } from "@/types/supabase";

type Table = Database["public"]["Tables"]["tables"]["Row"];
type TableStatus = Database["public"]["Enums"]["table_status"];

interface BulkOperationsProps {
  tables: Table[];
  selectedTables: string[];
  onSelectionChange: (tableIds: string[], selected: boolean) => void;
  onBulkStatusUpdate: (
    tableIds: string[],
    status: TableStatus
  ) => Promise<void>;
  onBulkDelete: (tableIds: string[]) => Promise<void>;
  onBulkExport: (tableIds: string[], format: "csv" | "json") => Promise<void>;
  onBulkQRDownload: (tableIds: string[]) => Promise<void>;
}

const tableStatuses = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
  { value: "unavailable", label: "Unavailable" },
];

export default function BulkOperations({
  tables,
  selectedTables,
  onSelectionChange,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkExport,
  onBulkQRDownload,
}: BulkOperationsProps) {
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [selectedStatus, setSelectedStatus] =
    useState<TableStatus>("available");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTableObjects = tables.filter((table) =>
    selectedTables.includes(table.id)
  );
  const hasSelection = selectedTables.length > 0;

  const handleSelectAll = () => {
    if (selectedTables.length === tables.length) {
      onSelectionChange([], false);
    } else {
      onSelectionChange(
        tables.map((t) => t.id),
        true
      );
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTables.length === 0) return;

    setIsProcessing(true);
    try {
      switch (bulkAction) {
        case "status":
          await onBulkStatusUpdate(selectedTables, selectedStatus);
          toast.success(`Updated status for ${selectedTables.length} tables`);
          break;
        case "delete":
          if (
            confirm(
              `Are you sure you want to delete ${selectedTables.length} tables?`
            )
          ) {
            await onBulkDelete(selectedTables);
            toast.success(`Deleted ${selectedTables.length} tables`);
          }
          break;
        case "export":
          await onBulkExport(selectedTables, exportFormat);
          toast.success(
            `Exported ${selectedTables.length} tables as ${exportFormat.toUpperCase()}`
          );
          break;
        case "qr":
          await onBulkQRDownload(selectedTables);
          toast.success(
            `Downloaded QR codes for ${selectedTables.length} tables`
          );
          break;
      }
      setShowBulkDialog(false);
      setBulkAction("");
    } catch (error) {
      toast.error("Failed to perform bulk operation");
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (!hasSelection) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">
                  Bulk Operations
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {selectedTables.length} selected
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([], false)}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Selection
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Tables Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {
                    selectedTableObjects.filter((t) => t.status === "available")
                      .length
                  }
                </div>
                <div className="text-sm text-blue-700">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {
                    selectedTableObjects.filter((t) => t.status === "occupied")
                      .length
                  }
                </div>
                <div className="text-sm text-blue-700">Occupied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {selectedTableObjects.reduce((sum, t) => sum + t.capacity, 0)}
                </div>
                <div className="text-sm text-blue-700">Total Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {selectedTableObjects.length}
                </div>
                <div className="text-sm text-blue-700">Tables</div>
              </div>
            </div>

            <Separator />

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2">
              <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("status")}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Update Status for {selectedTables.length} Tables
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>New Status</Label>
                      <Select
                        value={selectedStatus}
                        onValueChange={(value: TableStatus) =>
                          setSelectedStatus(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tableStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkAction}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Status"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction("qr");
                  handleBulkAction();
                }}
                disabled={isProcessing}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Codes
              </Button>

              <Dialog
                open={showBulkDialog && bulkAction === "export"}
                onOpenChange={setShowBulkDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("export")}
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Export {selectedTables.length} Tables
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
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
                          <SelectItem value="csv">
                            CSV (Excel compatible)
                          </SelectItem>
                          <SelectItem value="json">
                            JSON (Developer friendly)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkAction}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          "Export"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction("delete");
                  handleBulkAction();
                }}
                disabled={isProcessing}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tables
              </Button>
            </div>

            {/* Selected Tables List */}
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedTableObjects.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Table {table.number}</span>
                      <Badge
                        className={`text-xs ${getStatusColor(table.status)}`}
                      >
                        {table.capacity}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {table.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

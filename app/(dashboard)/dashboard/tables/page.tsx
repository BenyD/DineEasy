"use client";

import { useState } from "react";
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

// Mock table data
const mockTables = [
  {
    id: "1",
    number: "1",
    capacity: 4,
    qrCode: "/placeholder.svg?height=120&width=120",
    status: "available",
  },
  {
    id: "2",
    number: "2",
    capacity: 2,
    qrCode: "/placeholder.svg?height=120&width=120",
    status: "occupied",
  },
  {
    id: "3",
    number: "3",
    capacity: 6,
    qrCode: "/placeholder.svg?height=120&width=120",
    status: "available",
  },
  {
    id: "4",
    number: "4",
    capacity: 4,
    qrCode: "/placeholder.svg?height=120&width=120",
    status: "occupied",
  },
  {
    id: "5",
    number: "5",
    capacity: 8,
    qrCode: "/placeholder.svg?height=120&width=120",
    status: "available",
  },
];

const tableStatuses = [
  { value: "all", label: "All Tables" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
];

const capacityOptions = [
  { value: "all", label: "All Capacities" },
  { value: "1-2", label: "1-2 People" },
  { value: "3-4", label: "3-4 People" },
  { value: "5-6", label: "5-6 People" },
  { value: "7+", label: "7+ People" },
];

export default function TablesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
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
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || capacityFilter !== "all";

  const filteredTables = mockTables.filter((table) => {
    const matchesSearch = table.number
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || table.status === statusFilter;
    const matchesCapacity =
      capacityFilter === "all" ||
      (capacityFilter === "1-2" && table.capacity <= 2) ||
      (capacityFilter === "3-4" &&
        table.capacity >= 3 &&
        table.capacity <= 4) ||
      (capacityFilter === "5-6" &&
        table.capacity >= 5 &&
        table.capacity <= 6) ||
      (capacityFilter === "7+" && table.capacity >= 7);
    return matchesSearch && matchesStatus && matchesCapacity;
  });

  const TableForm = ({
    table,
    onClose,
  }: {
    table?: any;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      number: table?.number || "",
      capacity: table?.capacity?.toString() || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const tableData = {
        id: table?.id || Date.now().toString(),
        number: formData.number,
        capacity: Number.parseInt(formData.capacity),
        qrCode: `/placeholder.svg?height=120&width=120`,
        status: table?.status || "available",
      };
      console.log(table ? "Updating table:" : "Adding new table:", tableData);
      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Table Number</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="4"
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            {table ? "Update Table" : "Add Table"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables & QR</h1>
          <p className="text-muted-foreground">
            Manage your restaurant tables and QR codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <TableForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                filteredTables.filter((table) => table.status === "available")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to seat guests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupied Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                filteredTables.filter((table) => table.status === "occupied")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Currently serving guests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTables.length}</div>
            <p className="text-xs text-muted-foreground">
              All restaurant tables
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Seating Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockTables.reduce((sum, table) => sum + table.capacity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum guest capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>Filter and search through tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative col-span-full lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by table number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <Card
            key={table.id}
            className="hover:shadow-lg transition-shadow relative"
          >
            <Badge
              className={`absolute top-4 right-4 ${getStatusColor(
                table.status
              )}`}
            >
              {getStatusLabel(table.status)}
            </Badge>
            <CardHeader className="pb-3 space-y-1">
              <div className="flex items-center">
                <CardTitle className="text-lg">Table {table.number}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Seats {table.capacity} people
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              </div>

              {/* QR Code URL */}
              <div className="text-center">
                <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded select-all">
                  dineeasy.com/qr/table-{table.number}
                </code>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Dialog
                    open={editingTable?.id === table.id}
                    onOpenChange={(open) => !open && setEditingTable(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => setEditingTable(table)}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Table {table.number}</DialogTitle>
                      </DialogHeader>
                      <TableForm
                        table={table}
                        onClose={() => setEditingTable(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Get QR
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

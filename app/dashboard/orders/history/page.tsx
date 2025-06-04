"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, Filter, Search, ChevronDown, X, ArrowUpDown, FileText, Printer, RefreshCcw } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock historical orders data
const mockHistoricalOrders = [
  {
    id: "ORD-001",
    tableNumber: "3",
    items: [
      { id: "1", name: "Margherita Pizza", quantity: 1, price: 22.0, notes: "Extra cheese" },
      { id: "2", name: "Caesar Salad", quantity: 1, price: 16.5, notes: "" },
      { id: "3", name: "Sparkling Water", quantity: 2, price: 4.5, notes: "" },
    ],
    total: 47.5,
    status: "completed",
    orderTime: "2025-06-01T18:30:00.000Z",
    completedTime: "2025-06-01T19:15:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Extra cheese on pizza please",
    transactionId: "txn_1234567890",
    customer: {
      name: "John Smith",
      email: "john@example.com",
    },
  },
  {
    id: "ORD-002",
    tableNumber: "7",
    items: [
      { id: "4", name: "House Wine Red", quantity: 2, price: 8.5, notes: "" },
      { id: "5", name: "Tiramisu", quantity: 1, price: 9.5, notes: "" },
    ],
    total: 26.5,
    status: "completed",
    orderTime: "2025-06-01T19:45:00.000Z",
    completedTime: "2025-06-01T20:20:00.000Z",
    paymentMethod: "twint",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_0987654321",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
    },
  },
  {
    id: "ORD-003",
    tableNumber: "2",
    items: [{ id: "6", name: "Spaghetti Carbonara", quantity: 1, price: 24.5, notes: "No pepper" }],
    total: 24.5,
    status: "completed",
    orderTime: "2025-06-01T20:15:00.000Z",
    completedTime: "2025-06-01T20:45:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "No pepper",
    transactionId: "",
    customer: {
      name: "Michael Brown",
      email: "",
    },
  },
  {
    id: "ORD-004",
    tableNumber: "5",
    items: [
      { id: "7", name: "Beef Burger", quantity: 2, price: 18.0, notes: "Medium well" },
      { id: "8", name: "French Fries", quantity: 1, price: 6.5, notes: "Extra salt" },
      { id: "9", name: "Cola", quantity: 2, price: 4.0, notes: "" },
    ],
    total: 50.5,
    status: "refunded",
    orderTime: "2025-05-31T18:30:00.000Z",
    completedTime: "2025-05-31T19:10:00.000Z",
    refundedTime: "2025-05-31T19:45:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "refunded",
    customerNotes: "Extra ketchup on the side",
    refundReason: "Customer dissatisfied with food temperature",
    transactionId: "txn_5678901234",
    refundId: "ref_1234567890",
    customer: {
      name: "Emma Wilson",
      email: "emma@example.com",
    },
  },
  {
    id: "ORD-005",
    tableNumber: "10",
    items: [
      { id: "10", name: "Vegetable Risotto", quantity: 1, price: 19.5, notes: "" },
      { id: "11", name: "Garlic Bread", quantity: 1, price: 5.5, notes: "" },
    ],
    total: 25.0,
    status: "completed",
    orderTime: "2025-05-31T19:15:00.000Z",
    completedTime: "2025-05-31T19:50:00.000Z",
    paymentMethod: "twint",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_1357924680",
    customer: {
      name: "David Lee",
      email: "david@example.com",
    },
  },
  {
    id: "ORD-006",
    tableNumber: "4",
    items: [
      { id: "12", name: "Chicken Curry", quantity: 1, price: 21.0, notes: "Spicy" },
      { id: "13", name: "Naan Bread", quantity: 2, price: 3.5, notes: "" },
      { id: "14", name: "Mango Lassi", quantity: 1, price: 5.0, notes: "" },
    ],
    total: 33.0,
    status: "cancelled",
    orderTime: "2025-05-30T20:00:00.000Z",
    cancelledTime: "2025-05-30T20:10:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "refunded",
    customerNotes: "Extra spicy curry",
    cancellationReason: "Customer left restaurant",
    transactionId: "txn_2468013579",
    refundId: "ref_0987654321",
    customer: {
      name: "Lisa Chen",
      email: "lisa@example.com",
    },
  },
  {
    id: "ORD-007",
    tableNumber: "8",
    items: [
      { id: "15", name: "Seafood Paella", quantity: 2, price: 26.0, notes: "" },
      { id: "16", name: "Green Salad", quantity: 1, price: 8.5, notes: "No onions" },
      { id: "17", name: "Sparkling Water", quantity: 2, price: 4.5, notes: "" },
    ],
    total: 69.5,
    status: "completed",
    orderTime: "2025-05-30T19:30:00.000Z",
    completedTime: "2025-05-30T20:15:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "No onions in salad",
    transactionId: "txn_3692581470",
    customer: {
      name: "Robert Taylor",
      email: "robert@example.com",
    },
  },
  {
    id: "ORD-008",
    tableNumber: "6",
    items: [
      { id: "18", name: "Mushroom Risotto", quantity: 1, price: 18.5, notes: "" },
      { id: "19", name: "Bruschetta", quantity: 1, price: 9.0, notes: "" },
      { id: "20", name: "White Wine", quantity: 1, price: 7.5, notes: "" },
    ],
    total: 35.0,
    status: "completed",
    orderTime: "2025-05-29T18:45:00.000Z",
    completedTime: "2025-05-29T19:20:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "",
    customer: {
      name: "Jennifer Adams",
      email: "",
    },
  },
  {
    id: "ORD-009",
    tableNumber: "9",
    items: [
      { id: "21", name: "Steak Frites", quantity: 2, price: 28.0, notes: "Medium rare" },
      { id: "22", name: "Chocolate Mousse", quantity: 2, price: 8.0, notes: "" },
      { id: "23", name: "Red Wine", quantity: 1, price: 9.5, notes: "" },
    ],
    total: 81.5,
    status: "completed",
    orderTime: "2025-05-29T20:00:00.000Z",
    completedTime: "2025-05-29T20:45:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Medium rare steaks",
    transactionId: "txn_4815162342",
    customer: {
      name: "Thomas Wilson",
      email: "thomas@example.com",
    },
  },
  {
    id: "ORD-010",
    tableNumber: "1",
    items: [
      { id: "24", name: "Vegetarian Pizza", quantity: 1, price: 20.0, notes: "No olives" },
      { id: "25", name: "Garlic Bread", quantity: 1, price: 5.5, notes: "" },
      { id: "26", name: "Tiramisu", quantity: 1, price: 9.5, notes: "" },
      { id: "27", name: "Sparkling Water", quantity: 1, price: 4.5, notes: "" },
    ],
    total: 39.5,
    status: "completed",
    orderTime: "2025-05-28T19:15:00.000Z",
    completedTime: "2025-05-28T19:55:00.000Z",
    paymentMethod: "twint",
    paymentStatus: "paid",
    customerNotes: "No olives on pizza",
    transactionId: "txn_9876543210",
    customer: {
      name: "Anna Martinez",
      email: "anna@example.com",
    },
  },
  {
    id: "ORD-011",
    tableNumber: "3",
    items: [
      { id: "28", name: "Lasagna", quantity: 1, price: 19.0, notes: "" },
      { id: "29", name: "Caprese Salad", quantity: 1, price: 12.5, notes: "" },
      { id: "30", name: "Cheesecake", quantity: 1, price: 8.5, notes: "" },
      { id: "31", name: "Coffee", quantity: 1, price: 4.0, notes: "" },
    ],
    total: 44.0,
    status: "completed",
    orderTime: "2025-05-28T18:30:00.000Z",
    completedTime: "2025-05-28T19:10:00.000Z",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "txn_1029384756",
    customer: {
      name: "James Johnson",
      email: "james@example.com",
    },
  },
  {
    id: "ORD-012",
    tableNumber: "7",
    items: [
      { id: "32", name: "Fish & Chips", quantity: 2, price: 22.0, notes: "" },
      { id: "33", name: "Coleslaw", quantity: 1, price: 5.0, notes: "" },
      { id: "34", name: "Beer", quantity: 2, price: 6.5, notes: "" },
    ],
    total: 62.0,
    status: "completed",
    orderTime: "2025-05-27T19:45:00.000Z",
    completedTime: "2025-05-27T20:20:00.000Z",
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerNotes: "",
    transactionId: "",
    customer: {
      name: "Daniel Brown",
      email: "",
    },
  },
]

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "refunded":
      return "bg-amber-100 text-amber-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Payment method color mapping
const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case "stripe":
      return "bg-purple-100 text-purple-800"
    case "twint":
      return "bg-blue-100 text-blue-800"
    case "cash":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Payment status color mapping
const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800"
    case "refunded":
      return "bg-amber-100 text-amber-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")

  // State for sorting
  const [sortField, setSortField] = useState("orderTime")
  const [sortDirection, setSortDirection] = useState("desc")

  // State for selected order
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // Get unique table numbers for filter dropdown
  const uniqueTables = Array.from(new Set(mockHistoricalOrders.map((order) => order.tableNumber))).sort()

  // Apply filters and sorting
  const filteredOrders = mockHistoricalOrders
    .filter((order) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesId = order.id.toLowerCase().includes(searchLower)
        const matchesTable = order.tableNumber.toLowerCase().includes(searchLower)
        const matchesItems = order.items.some((item) => item.name.toLowerCase().includes(searchLower))
        const matchesNotes = order.customerNotes?.toLowerCase().includes(searchLower) || false

        if (!(matchesId || matchesTable || matchesItems || matchesNotes)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }

      // Payment method filter
      if (paymentMethodFilter !== "all" && order.paymentMethod !== paymentMethodFilter) {
        return false
      }

      // Payment status filter
      if (paymentStatusFilter !== "all" && order.paymentStatus !== paymentStatusFilter) {
        return false
      }

      // Table filter
      if (tableFilter !== "all" && order.tableNumber !== tableFilter) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Apply sorting
      const fieldA = a[sortField as keyof typeof a]
      const fieldB = b[sortField as keyof typeof b]

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      // Default to date sorting
      const dateA = new Date(a.orderTime).getTime()
      const dateB = new Date(b.orderTime).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    })

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPaymentMethodFilter("all")
    setPaymentStatusFilter("all")
    setTableFilter("all")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500">View and manage past orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders by ID, table, items, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Filter Orders</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <p className="text-sm font-medium mb-1">Status</p>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <p className="text-sm font-medium mb-1">Payment Method</p>
                    <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="twint">TWINT</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <p className="text-sm font-medium mb-1">Payment Status</p>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <p className="text-sm font-medium mb-1">Table</p>
                    <Select value={tableFilter} onValueChange={setTableFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tables</SelectItem>
                        {uniqueTables.map((table) => (
                          <SelectItem key={table} value={table}>
                            Table {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={resetFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active filters display */}
          <div className="flex flex-wrap gap-2">
            {statusFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {statusFilter}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            {paymentMethodFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Payment: {paymentMethodFilter}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setPaymentMethodFilter("all")} />
              </Badge>
            )}
            {paymentStatusFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Payment Status: {paymentStatusFilter}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setPaymentStatusFilter("all")} />
              </Badge>
            )}
            {tableFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Table: {tableFilter}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setTableFilter("all")} />
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchTerm}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchTerm("")} />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-medium p-0 h-auto"
                      onClick={() => toggleSort("id")}
                    >
                      Order ID
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-medium p-0 h-auto"
                      onClick={() => toggleSort("orderTime")}
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-medium p-0 h-auto"
                      onClick={() => toggleSort("total")}
                    >
                      Total
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(order.orderTime), "MMM d, yyyy")}</span>
                          <span className="text-xs text-gray-500">{format(new Date(order.orderTime), "h:mm a")}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.tableNumber}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {order.items.map((item: any, i: number) => (
                            <span key={item.id}>
                              {item.quantity}x {item.name}
                              {i < order.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">CHF {order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={getPaymentMethodColor(order.paymentMethod)}>
                            {order.paymentMethod.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log("Print receipt for", order.id)
                            }}
                          >
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print Receipt</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log("View details for", order.id)
                              setSelectedOrder(order)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <p className="mb-2">No orders found</p>
                        <p className="text-sm">Try adjusting your filters or search term</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Side Panel */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Order {selectedOrder?.id}</span>
              {selectedOrder && (
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedOrder && (
            <div className="mt-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedOrder.orderTime), "MMM d, yyyy")}</p>
                  <p className="text-sm">{format(new Date(selectedOrder.orderTime), "h:mm a")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Table</p>
                  <p className="font-medium">Table {selectedOrder.tableNumber}</p>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              {selectedOrder.customer && (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Customer</h3>
                    <p>{selectedOrder.customer.name || "Anonymous"}</p>
                    {selectedOrder.customer.email && (
                      <p className="text-sm text-gray-500">{selectedOrder.customer.email}</p>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                      </div>
                      <span>CHF {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>CHF {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h3 className="font-medium mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Method</p>
                    <Badge variant="outline" className={getPaymentMethodColor(selectedOrder.paymentMethod)}>
                      {selectedOrder.paymentMethod.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant="outline" className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {selectedOrder.transactionId && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-mono text-xs">{selectedOrder.transactionId}</p>
                  </div>
                )}

                {selectedOrder.refundId && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Refund ID</p>
                    <p className="font-mono text-xs">{selectedOrder.refundId}</p>
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              {selectedOrder.customerNotes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Customer Notes</h3>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.customerNotes}</p>
                  </div>
                </>
              )}

              {/* Order Timeline */}
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Order Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(selectedOrder.orderTime), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.completedTime && (
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-4 w-4 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">Order Completed</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(selectedOrder.completedTime), "MMM d, yyyy h:mm a")}
                        </p>
                        {selectedOrder.refundReason && (
                          <p className="text-sm bg-amber-50 p-1 rounded mt-1">{selectedOrder.refundReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedOrder.refundedTime && (
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-4 w-4 rounded-full bg-amber-500" />
                      <div>
                        <p className="font-medium">Payment Refunded</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(selectedOrder.refundedTime), "MMM d, yyyy h:mm a")}
                        </p>
                        {selectedOrder.refundReason && (
                          <p className="text-sm bg-amber-50 p-1 rounded mt-1">{selectedOrder.refundReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedOrder.cancelledTime && (
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-4 w-4 rounded-full bg-red-500" />
                      <div>
                        <p className="font-medium">Order Cancelled</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(selectedOrder.cancelledTime), "MMM d, yyyy h:mm a")}
                        </p>
                        {selectedOrder.cancellationReason && (
                          <p className="text-sm bg-red-50 p-1 rounded mt-1">{selectedOrder.cancellationReason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => console.log("Print receipt for", selectedOrder.id)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

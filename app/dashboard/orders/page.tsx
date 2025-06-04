"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  ChevronDown,
  Bell,
  Printer,
  RefreshCcw,
  MoreHorizontal,
  ChefHat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    tableNumber: "3",
    items: [
      { id: "1", name: "Margherita Pizza", quantity: 1, price: 22.0, notes: "Extra cheese" },
      { id: "2", name: "Caesar Salad", quantity: 1, price: 16.5, notes: "" },
      { id: "3", name: "Sparkling Water", quantity: 2, price: 4.5, notes: "" },
    ],
    total: 47.5,
    status: "new",
    orderTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Extra cheese on pizza please",
  },
  {
    id: "ORD-002",
    tableNumber: "7",
    items: [
      { id: "4", name: "House Wine Red", quantity: 2, price: 8.5, notes: "" },
      { id: "5", name: "Tiramisu", quantity: 1, price: 9.5, notes: "" },
    ],
    total: 26.5,
    status: "preparing",
    orderTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    paymentMethod: "twint",
    paymentStatus: "paid",
    customerNotes: "",
  },
  {
    id: "ORD-003",
    tableNumber: "2",
    items: [{ id: "6", name: "Spaghetti Carbonara", quantity: 1, price: 24.5, notes: "No pepper" }],
    total: 24.5,
    status: "ready",
    orderTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
    paymentMethod: "cash",
    paymentStatus: "pending",
    customerNotes: "No pepper",
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
    status: "new",
    orderTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    paymentMethod: "stripe",
    paymentStatus: "paid",
    customerNotes: "Extra ketchup on the side",
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
    orderTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    paymentMethod: "twint",
    paymentStatus: "paid",
    customerNotes: "",
  },
]

const orderStatuses = [
  { id: "all", name: "All Orders", count: mockOrders.length },
  { id: "new", name: "New", count: mockOrders.filter((o) => o.status === "new").length },
  { id: "preparing", name: "Preparing", count: mockOrders.filter((o) => o.status === "preparing").length },
  { id: "ready", name: "Ready", count: mockOrders.filter((o) => o.status === "ready").length },
  { id: "completed", name: "Completed", count: mockOrders.filter((o) => o.status === "completed").length },
]

export default function OrdersPage() {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isKitchenMode, setIsKitchenMode] = useState(false)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-4 h-4" />
      case "preparing":
        return <Clock className="w-4 h-4" />
      case "ready":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const orderTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  const filteredOrders = mockOrders
    .filter((order) => {
      // Filter by status
      if (activeStatus !== "all" && order.status !== activeStatus) return false

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          order.id.toLowerCase().includes(searchLower) ||
          order.tableNumber.toLowerCase().includes(searchLower) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
    .sort((a, b) => {
      // Sort by newest first
      return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime()
    })

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    console.log(`Updating order ${orderId} to ${newStatus}`)
    // In real app, this would update the order status
  }

  const handleKitchenModeToggle = () => {
    if (isKitchenMode) {
      setIsKitchenMode(false)
    } else {
      setIsKitchenMode(true)
      setActiveStatus("all") // Reset to all orders when entering kitchen mode
    }
  }

  const OrderDetailsDialog = ({ order }: { order: any }) => (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Order {order.id}</span>
          <Badge className={getStatusColor(order.status)}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </Badge>
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Table</p>
            <p className="font-semibold">Table {order.tableNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-semibold">{getTimeAgo(order.orderTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment</p>
            <div className="flex items-center gap-1">
              <span className="font-semibold capitalize">{order.paymentMethod}</span>
              <Badge variant="outline" className={order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="space-y-3">
            {order.items.map((item: any) => (
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
            <span>CHF {order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.customerNotes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Customer Notes</h4>
              <p className="text-sm bg-gray-50 p-2 rounded">{order.customerNotes}</p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {order.status === "new" && (
            <Button
              onClick={() => updateOrderStatus(order.id, "preparing")}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Start Preparing
            </Button>
          )}
          {order.status === "preparing" && (
            <Button onClick={() => updateOrderStatus(order.id, "ready")} className="bg-green-500 hover:bg-green-600">
              Mark Ready
            </Button>
          )}
          {order.status === "ready" && (
            <Button onClick={() => updateOrderStatus(order.id, "completed")} className="bg-gray-500 hover:bg-gray-600">
              Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  )

  // Kitchen Mode View
  if (isKitchenMode) {
    const newOrders = filteredOrders.filter((o) => o.status === "new")
    const preparingOrders = filteredOrders.filter((o) => o.status === "preparing")
    const readyOrders = filteredOrders.filter((o) => o.status === "ready")

    return (
      <div className="p-4 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display</h1>
            <p className="text-gray-500">Real-time order management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={isAutoRefresh} onCheckedChange={setIsAutoRefresh} />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>
            <Button variant="outline" onClick={handleKitchenModeToggle}>
              Exit Kitchen Mode
            </Button>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* New Orders Column */}
          <div className="flex flex-col h-full">
            <div className="bg-blue-50 p-3 rounded-t-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="font-bold text-blue-800">New Orders</h2>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{newOrders.length}</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-blue-50/30 p-2 space-y-3 border border-t-0 border-blue-100 rounded-b-lg">
              <AnimatePresence>
                {newOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg shadow-sm border border-blue-100"
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center">
                          Table {order.tableNumber}
                          <Badge className="ml-2 bg-blue-100 text-blue-800">{order.id}</Badge>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getTimeAgo(order.orderTime)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <ul className="space-y-1 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between">
                            <span>
                              <span className="font-semibold">{item.quantity}x</span> {item.name}
                              {item.notes && <span className="text-xs text-gray-500 block">{item.notes}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {order.customerNotes && (
                        <div className="mt-2 p-1.5 bg-blue-50 rounded text-xs">
                          <span className="font-medium">Note: </span>
                          {order.customerNotes}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button
                        className="bg-yellow-500 hover:bg-yellow-600 w-full"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                      >
                        Start Preparing
                      </Button>
                    </CardFooter>
                  </motion.div>
                ))}
                {newOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No new orders</div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Preparing Orders Column */}
          <div className="flex flex-col h-full">
            <div className="bg-yellow-50 p-3 rounded-t-lg border border-yellow-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <h2 className="font-bold text-yellow-800">Preparing</h2>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{preparingOrders.length}</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-yellow-50/30 p-2 space-y-3 border border-t-0 border-yellow-100 rounded-b-lg">
              <AnimatePresence>
                {preparingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg shadow-sm border border-yellow-100"
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center">
                          Table {order.tableNumber}
                          <Badge className="ml-2 bg-yellow-100 text-yellow-800">{order.id}</Badge>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getTimeAgo(order.orderTime)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <ul className="space-y-1 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between">
                            <span>
                              <span className="font-semibold">{item.quantity}x</span> {item.name}
                              {item.notes && <span className="text-xs text-gray-500 block">{item.notes}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {order.customerNotes && (
                        <div className="mt-2 p-1.5 bg-yellow-50 rounded text-xs">
                          <span className="font-medium">Note: </span>
                          {order.customerNotes}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button
                        className="bg-green-500 hover:bg-green-600 w-full"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                      >
                        Mark Ready
                      </Button>
                    </CardFooter>
                  </motion.div>
                ))}
                {preparingOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    No orders in preparation
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Ready Orders Column */}
          <div className="flex flex-col h-full">
            <div className="bg-green-50 p-3 rounded-t-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="font-bold text-green-800">Ready to Serve</h2>
                </div>
                <Badge className="bg-green-100 text-green-800">{readyOrders.length}</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-green-50/30 p-2 space-y-3 border border-t-0 border-green-100 rounded-b-lg">
              <AnimatePresence>
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg shadow-sm border border-green-100"
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center">
                          Table {order.tableNumber}
                          <Badge className="ml-2 bg-green-100 text-green-800">{order.id}</Badge>
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getTimeAgo(order.orderTime)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <ul className="space-y-1 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between">
                            <span>
                              <span className="font-semibold">{item.quantity}x</span> {item.name}
                              {item.notes && <span className="text-xs text-gray-500 block">{item.notes}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button
                        className="bg-gray-500 hover:bg-gray-600 w-full"
                        onClick={() => updateOrderStatus(order.id, "completed")}
                      >
                        Complete Order
                      </Button>
                    </CardFooter>
                  </motion.div>
                ))}
                {readyOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    No orders ready to serve
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular Orders View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage incoming orders and kitchen workflow</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/orders/history")}>
            <Clock className="w-4 h-4 mr-2" />
            View History
          </Button>
          <Button variant="outline" onClick={handleKitchenModeToggle}>
            <ChefHat className="w-4 h-4 mr-2" />
            Kitchen View
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders by ID, table, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Orders</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Today Only</DropdownMenuItem>
                <DropdownMenuItem>Paid Orders</DropdownMenuItem>
                <DropdownMenuItem>Unpaid Orders</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Clear Filters</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="grid w-full grid-cols-5">
          {orderStatuses.map((status) => (
            <TabsTrigger key={status.id} value={status.id} className="text-xs sm:text-sm">
              {status.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {status.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeStatus} className="mt-6">
          {/* Orders List */}
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-1">
                                <AvatarFallback className="bg-gray-100 text-gray-800 text-xs">
                                  {order.tableNumber}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-500">Table {order.tableNumber}</span>
                            </div>
                            <span className="text-sm text-gray-500">{getTimeAgo(order.orderTime)}</span>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            {order.items.map((item, i) => (
                              <span key={i}>
                                {item.quantity}x {item.name}
                                {i < order.items.length - 1 && ", "}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">CHF {order.total.toFixed(2)}</span>
                            <Badge
                              variant="outline"
                              className={order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}
                            >
                              {order.paymentStatus.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.paymentMethod.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Dialog
                            open={selectedOrder?.id === order.id}
                            onOpenChange={(open) => !open && setSelectedOrder(null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                            </DialogTrigger>
                            {selectedOrder?.id === order.id && <OrderDetailsDialog order={selectedOrder} />}
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.log("Print receipt")}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log("Send notification")}>
                                <Bell className="mr-2 h-4 w-4" />
                                Notify Customer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {order.status === "new" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "preparing")}
                              className="bg-yellow-500 hover:bg-yellow-600"
                            >
                              Start Preparing
                            </Button>
                          )}

                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "ready")}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Mark Ready
                            </Button>
                          )}

                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              className="bg-gray-500 hover:bg-gray-600"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>

                      {order.customerNotes && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-800">Note: </span>
                          <span className="text-blue-700">{order.customerNotes}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No orders found</div>
                <p className="text-sm text-gray-500">
                  {activeStatus === "all" ? "No orders match your search" : `No ${activeStatus} orders`}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

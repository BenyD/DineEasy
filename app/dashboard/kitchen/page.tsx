"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle, AlertCircle, ChefHat, Timer, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    tableNumber: 5,
    customerName: "John D.",
    items: [
      { name: "Margherita Pizza", quantity: 1, modifiers: ["Extra cheese", "Thin crust"] },
      { name: "Caesar Salad", quantity: 1, modifiers: ["No croutons"] },
      { name: "House Wine", quantity: 2, modifiers: [] },
    ],
    status: "new",
    orderTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    estimatedTime: 15,
    notes: "Please bring extra napkins",
    priority: "normal",
  },
  {
    id: "ORD-002",
    tableNumber: 3,
    customerName: "Sarah M.",
    items: [
      { name: "Grilled Salmon", quantity: 1, modifiers: ["Medium rare", "No vegetables"] },
      { name: "Risotto", quantity: 1, modifiers: ["Extra parmesan"] },
    ],
    status: "preparing",
    orderTime: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    estimatedTime: 20,
    notes: "",
    priority: "high",
  },
  {
    id: "ORD-003",
    tableNumber: 8,
    customerName: "Mike R.",
    items: [
      { name: "Beef Burger", quantity: 2, modifiers: ["Medium", "Extra bacon"] },
      { name: "French Fries", quantity: 2, modifiers: ["Extra crispy"] },
      { name: "Coca Cola", quantity: 2, modifiers: [] },
    ],
    status: "new",
    orderTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    estimatedTime: 12,
    notes: "Table is in a hurry",
    priority: "high",
  },
  {
    id: "ORD-004",
    tableNumber: 12,
    customerName: "Anna K.",
    items: [
      { name: "Vegetarian Pasta", quantity: 1, modifiers: ["Gluten-free"] },
      { name: "Green Salad", quantity: 1, modifiers: ["Olive oil dressing"] },
    ],
    status: "preparing",
    orderTime: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
    estimatedTime: 25,
    notes: "Customer has allergies - please be careful",
    priority: "normal",
  },
]

export default function KitchenPage() {
  const [orders, setOrders] = useState(mockOrders)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const getTimeSinceOrder = (orderTime: Date) => {
    const diffInMinutes = Math.floor((currentTime.getTime() - orderTime.getTime()) / (1000 * 60))
    return diffInMinutes
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-100 text-red-800 border-red-200"
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "ready":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "normal":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const newOrders = orders.filter((order) => order.status === "new")
  const preparingOrders = orders.filter((order) => order.status === "preparing")
  const readyOrders = orders.filter((order) => order.status === "ready")

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <ChefHat className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
            <p className="text-gray-500">Real-time order management for kitchen staff</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">New Orders</p>
                <p className="text-2xl font-bold text-red-900">{newOrders.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Preparing</p>
                <p className="text-2xl font-bold text-amber-900">{preparingOrders.length}</p>
              </div>
              <Timer className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Ready</p>
                <p className="text-2xl font-bold text-green-900">{readyOrders.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Active</p>
                <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-red-800">New Orders</h2>
            <Badge className="bg-red-100 text-red-800">{newOrders.length}</Badge>
          </div>
          <AnimatePresence>
            {newOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-l-4 border-l-red-500 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`} />
                        <CardTitle className="text-lg">Table {order.tableNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{order.id}</p>
                        <p className="text-xs text-gray-400">{getTimeSinceOrder(order.orderTime)} min ago</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.name}
                              </p>
                              {item.modifiers.length > 0 && (
                                <div className="mt-1">
                                  {item.modifiers.map((modifier, modIndex) => (
                                    <span
                                      key={modIndex}
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                    >
                                      {modifier}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <>
                        <Separator />
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Note:</strong> {order.notes}
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                      >
                        Start Preparing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {newOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ChefHat className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No new orders</p>
            </div>
          )}
        </div>

        {/* Preparing Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-amber-800">Preparing</h2>
            <Badge className="bg-amber-100 text-amber-800">{preparingOrders.length}</Badge>
          </div>
          <AnimatePresence>
            {preparingOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-l-4 border-l-amber-500 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`} />
                        <CardTitle className="text-lg">Table {order.tableNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{order.id}</p>
                        <p className="text-xs text-gray-400">{getTimeSinceOrder(order.orderTime)} min ago</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.name}
                              </p>
                              {item.modifiers.length > 0 && (
                                <div className="mt-1">
                                  {item.modifiers.map((modifier, modIndex) => (
                                    <span
                                      key={modIndex}
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                    >
                                      {modifier}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <>
                        <Separator />
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Note:</strong> {order.notes}
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Mark Ready
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {preparingOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Timer className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No orders in preparation</p>
            </div>
          )}
        </div>

        {/* Ready Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-green-800">Ready for Pickup</h2>
            <Badge className="bg-green-100 text-green-800">{readyOrders.length}</Badge>
          </div>
          <AnimatePresence>
            {readyOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-l-4 border-l-green-500 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`} />
                        <CardTitle className="text-lg">Table {order.tableNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{order.id}</p>
                        <p className="text-xs text-gray-400">{getTimeSinceOrder(order.orderTime)} min ago</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.name}
                              </p>
                              {item.modifiers.length > 0 && (
                                <div className="mt-1">
                                  {item.modifiers.map((modifier, modIndex) => (
                                    <span
                                      key={modIndex}
                                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                    >
                                      {modifier}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateOrderStatus(order.id, "completed")}
                        variant="outline"
                        className="flex-1"
                      >
                        Mark Delivered
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {readyOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No orders ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

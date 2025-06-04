"use client"

import { format } from "date-fns"
import { Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

interface OrderDetailsPanelProps {
  order: any
  onClose: () => void
}

export function OrderDetailsPanel({ order, onClose }: OrderDetailsPanelProps) {
  if (!order) return null

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Date & Time</p>
          <p className="font-medium">{format(new Date(order.orderTime), "MMM d, yyyy")}</p>
          <p className="text-sm">{format(new Date(order.orderTime), "h:mm a")}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Table</p>
          <p className="font-medium">Table {order.tableNumber}</p>
        </div>
      </div>

      <Separator />

      {/* Customer Info */}
      {order.customer && (
        <>
          <div>
            <h3 className="font-medium mb-2">Customer</h3>
            <p>{order.customer.name || "Anonymous"}</p>
            {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
          </div>
          <Separator />
        </>
      )}

      {/* Order Items */}
      <div>
        <h3 className="font-medium mb-2">Items</h3>
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

      <Separator />

      {/* Payment Details */}
      <div>
        <h3 className="font-medium mb-2">Payment Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Method</p>
            <Badge variant="outline" className={getPaymentMethodColor(order.paymentMethod)}>
              {order.paymentMethod.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge variant="outline" className={getPaymentStatusColor(order.paymentStatus)}>
              {order.paymentStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        {order.transactionId && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Transaction ID</p>
            <p className="font-mono text-xs">{order.transactionId}</p>
          </div>
        )}

        {order.refundId && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Refund ID</p>
            <p className="font-mono text-xs">{order.refundId}</p>
          </div>
        )}
      </div>

      {/* Customer Notes */}
      {order.customerNotes && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-2">Customer Notes</h3>
            <p className="text-sm bg-gray-50 p-2 rounded">{order.customerNotes}</p>
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
              <p className="text-sm text-gray-500">{format(new Date(order.orderTime), "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>

          {order.completedTime && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-green-500" />
              <div>
                <p className="font-medium">Order Completed</p>
                <p className="text-sm text-gray-500">{format(new Date(order.completedTime), "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>
          )}

          {order.refundedTime && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-amber-500" />
              <div>
                <p className="font-medium">Payment Refunded</p>
                <p className="text-sm text-gray-500">{format(new Date(order.refundedTime), "MMM d, yyyy h:mm a")}</p>
                {order.refundReason && <p className="text-sm bg-amber-50 p-1 rounded mt-1">{order.refundReason}</p>}
              </div>
            </div>
          )}

          {order.cancelledTime && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Order Cancelled</p>
                <p className="text-sm text-gray-500">{format(new Date(order.cancelledTime), "MMM d, yyyy h:mm a")}</p>
                {order.cancellationReason && (
                  <p className="text-sm bg-red-50 p-1 rounded mt-1">{order.cancellationReason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => console.log("Print receipt for", order.id)}>
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

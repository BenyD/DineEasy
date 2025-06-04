"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CreditCard, Smartphone, Banknote, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"
import Link from "next/link"

const paymentMethods = [
  {
    id: "stripe",
    name: "Credit Card",
    description: "Pay with Visa, Mastercard, or American Express",
    icon: CreditCard,
    color: "blue",
  },
  {
    id: "twint",
    name: "TWINT",
    description: "Swiss mobile payment app",
    icon: Smartphone,
    color: "blue",
  },
  {
    id: "cash",
    name: "Pay at Counter",
    description: "Pay with cash when you leave",
    icon: Banknote,
    color: "green",
  },
]

export default function CheckoutPage({ params }: { params: { tableId: string } }) {
  const { cart, getTotalPrice, clearCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("")
  const [email, setEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.077
  const total = subtotal + tax

  const handleConfirmOrder = async () => {
    if (!selectedPayment) return

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Clear cart and redirect to confirmation
    clearCart()
    window.location.href = `/qr/${params.tableId}/confirmation?payment=${selectedPayment}&total=${total.toFixed(2)}`
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No items in cart</h2>
          <p className="text-gray-500 mb-6">Add some items before proceeding to checkout</p>
          <Link href={`/qr/${params.tableId}`}>
            <Button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${params.tableId}/cart`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Payment</h1>
            <p className="text-sm text-gray-500">Table {params.tableId}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-32">
        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gray-50 rounded-xl p-4 mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-900">CHF {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">CHF {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (7.7%)</span>
              <span className="text-gray-900">CHF {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span className="text-green-700">CHF {total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon
              const isSelected = selectedPayment === method.id

              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? "text-green-600" : "text-gray-600"}`} />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Email Input for Digital Receipt */}
        {(selectedPayment === "stripe" || selectedPayment === "twint") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
              Email Address (for receipt)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </motion.div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-white via-white to-transparent">
        <Button
          onClick={handleConfirmOrder}
          disabled={!selectedPayment || isProcessing}
          size="lg"
          className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Order...
            </div>
          ) : (
            <span className="font-medium text-lg">Confirm Order • CHF {total.toFixed(2)}</span>
          )}
        </Button>
      </div>
    </div>
  )
}

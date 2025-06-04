"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"
import Link from "next/link"

export default function CartPage({ params }: { params: { tableId: string } }) {
  const { cart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart()

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.077 // 7.7% Swiss VAT
  const total = subtotal + tax

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4 px-4 py-4">
            <Link href={`/qr/${params.tableId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Your Cart</h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some delicious items from our menu</p>
            <Link href={`/qr/${params.tableId}`}>
              <Button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Browse Menu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${params.tableId}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Your Cart</h1>
            <p className="text-sm text-gray-500">Table {params.tableId}</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-6 space-y-4">
        {cart.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs"
          >
            <div className="flex gap-4">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                  <Button
                    onClick={() => removeFromCart(item.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-gray-600 text-xs mb-3 line-clamp-1">{item.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 border-green-200 hover:bg-green-50"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>

                    <span className="font-semibold text-green-700 min-w-6 text-center">{item.quantity}</span>

                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0 border-green-200 hover:bg-green-50"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <span className="font-bold text-gray-900">CHF {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">CHF {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (7.7%)</span>
              <span className="text-gray-900">CHF {tax.toFixed(2)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-700">CHF {total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-white via-white to-transparent">
        <Link href={`/qr/${params.tableId}/checkout`}>
          <Button
            size="lg"
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14"
          >
            <span className="font-medium text-lg">Proceed to Payment</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

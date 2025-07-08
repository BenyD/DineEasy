"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Banknote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TipSelector } from "@/components/qr/TipSelector";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { useRouter } from "next/navigation";

const paymentMethods = [
  {
    id: "stripe",
    name: "Credit Card",
    description: "Pay with Visa, Mastercard, or American Express",
    icon: CreditCard,
    color: "blue",
  },
  {
    id: "cash",
    name: "Pay at Counter",
    description: "Pay with cash when you leave",
    icon: Banknote,
    color: "green",
  },
];

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [email, setEmail] = useState("");
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.077;
  const total = subtotal + tax + tip;

  const handleConfirmOrder = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    setIsRedirecting(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Store cart items in memory before clearing
    const paymentMethod = selectedPayment;
    const totalAmount = total;
    const tipAmount = tip;

    // Clear cart and redirect to confirmation
    clearCart();

    router.push(
      `/qr/${
        resolvedParams.tableId
      }/confirmation?payment=${paymentMethod}&total=${totalAmount.toFixed(
        2
      )}&tip=${tipAmount.toFixed(2)}`
    );
  };

  // Show empty cart state only if cart is empty and we're not in the process of redirecting
  if (cart.length === 0 && !isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No items in cart
          </h2>
          <p className="text-gray-500 mb-8">
            Add some items before proceeding to checkout
          </p>
          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 rounded-full">
              Browse Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${resolvedParams.tableId}/cart`}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Payment</h1>
            <p className="text-sm text-gray-500">
              Table {resolvedParams.tableId} • Final step
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        {/* Enhanced Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-gray-900 font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  {item.tags?.includes("Popular") && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <span className="text-gray-900 font-medium">
                  CHF {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-medium">
                CHF {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Tax (7.7%)</span>
              <span className="text-gray-900 font-medium">
                CHF {tax.toFixed(2)}
              </span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Tip</span>
                <span className="text-gray-900 font-medium">
                  CHF {tip.toFixed(2)}
                </span>
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-green-700">CHF {total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Tip Selector */}
        <TipSelector subtotal={subtotal} onTipChange={setTip} />

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            Choose Payment Method
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.id;

              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {method.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {method.description}
                      </p>
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
              );
            })}
          </div>
        </motion.div>

        {/* Email Input */}
        {selectedPayment === "stripe" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <Label htmlFor="email" className="text-gray-700 font-medium mb-2">
              Email for Receipt
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
          </motion.div>
        )}
      </div>

      {/* Enhanced Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent">
        <Button
          disabled={!selectedPayment || isProcessing}
          onClick={handleConfirmOrder}
          size="lg"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-16 rounded-2xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              />
              <span>Processing...</span>
            </div>
          ) : (
            <>
              Confirm Order • CHF {total.toFixed(2)}
              <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

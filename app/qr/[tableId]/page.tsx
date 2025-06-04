"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenuItemCard } from "@/components/qr/MenuItemCard"
import { CartButton } from "@/components/qr/CartButton"
import { useCart } from "@/hooks/useCart"

// Mock data - in real app this would come from API
const mockRestaurant = {
  id: "1",
  name: "Bella Vista",
  logo: "/placeholder.svg?height=60&width=60",
  address: "123 Main Street, Zurich",
}

const mockMenu = {
  starters: [
    {
      id: "1",
      name: "Bruschetta Classica",
      description: "Toasted bread with fresh tomatoes, basil, and garlic",
      price: 12.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "starters",
      available: true,
    },
    {
      id: "2",
      name: "Antipasto Misto",
      description: "Selection of Italian cured meats and cheeses",
      price: 18.9,
      image: "/placeholder.svg?height=200&width=300",
      category: "starters",
      available: true,
    },
  ],
  mains: [
    {
      id: "3",
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, and basil",
      price: 22.0,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: true,
    },
    {
      id: "4",
      name: "Spaghetti Carbonara",
      description: "Pasta with eggs, cheese, pancetta, and black pepper",
      price: 24.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: true,
    },
    {
      id: "5",
      name: "Risotto ai Funghi",
      description: "Creamy risotto with mixed mushrooms and parmesan",
      price: 26.0,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: false,
    },
  ],
  drinks: [
    {
      id: "6",
      name: "House Wine Red",
      description: "Local Merlot, glass",
      price: 8.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "drinks",
      available: true,
    },
    {
      id: "7",
      name: "San Pellegrino",
      description: "Sparkling water, 500ml",
      price: 4.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "drinks",
      available: true,
    },
  ],
}

export default function MenuPage({ params }: { params: { tableId: string } }) {
  const { cart, addToCart, updateQuantity, getTotalItems, getTotalPrice } = useCart()
  const [activeCategory, setActiveCategory] = useState("starters")

  const categories = [
    { id: "starters", name: "Starters", items: mockMenu.starters },
    { id: "mains", name: "Mains", items: mockMenu.mains },
    { id: "drinks", name: "Drinks", items: mockMenu.drinks },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={mockRestaurant.logo || "/placeholder.svg"}
              alt={mockRestaurant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{mockRestaurant.name}</h1>
              <p className="text-sm text-gray-500">Table {params.tableId}</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline-solid"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "hover:bg-green-50 hover:border-green-200"
                }`}
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.items.filter((item) => item.available).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {categories
              .find((cat) => cat.id === activeCategory)
              ?.items.map((item, index) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  cartQuantity={cart.find((cartItem) => cartItem.id === item.id)?.quantity || 0}
                  onUpdateQuantity={updateQuantity}
                  index={index}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Cart Button */}
      <CartButton totalItems={getTotalItems()} totalPrice={getTotalPrice()} tableId={params.tableId} />
    </div>
  )
}

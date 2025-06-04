"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/qr/MenuItemCard";
import { CartButton } from "@/components/qr/CartButton";
import { useCart } from "@/hooks/useCart";
import { MenuItem } from "@/types";

// Mock data - in real app this would come from API
const mockRestaurant = {
  id: "1",
  name: "Bella Vista",
  logo: "/placeholder.svg?height=60&width=60",
  address: "123 Main Street, Zurich",
};

const mockMenu = {
  starters: [
    {
      id: "1",
      restaurantId: "1",
      name: "Bruschetta Classica",
      description: "Toasted bread with fresh tomatoes, basil, and garlic",
      price: 12.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "starters",
      available: true,
      tags: ["Popular", "Vegetarian"],
      allergens: ["gluten"],
      preparationTime: 10,
    },
    {
      id: "2",
      restaurantId: "1",
      name: "Antipasto Misto",
      description: "Selection of Italian cured meats and cheeses",
      price: 18.9,
      image: "/placeholder.svg?height=200&width=300",
      category: "starters",
      available: true,
      tags: [],
      allergens: ["dairy", "nuts"],
      preparationTime: 15,
    },
  ],
  mains: [
    {
      id: "3",
      restaurantId: "1",
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, and basil",
      price: 22.0,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: true,
      tags: ["Popular", "Vegetarian"],
      allergens: ["gluten", "dairy"],
      preparationTime: 20,
    },
    {
      id: "4",
      restaurantId: "1",
      name: "Spaghetti Carbonara",
      description: "Pasta with eggs, cheese, pancetta, and black pepper",
      price: 24.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: true,
      tags: [],
      allergens: ["gluten", "dairy", "eggs"],
      preparationTime: 15,
    },
    {
      id: "5",
      restaurantId: "1",
      name: "Risotto ai Funghi",
      description: "Creamy risotto with mixed mushrooms and parmesan",
      price: 26.0,
      image: "/placeholder.svg?height=200&width=300",
      category: "mains",
      available: false,
      tags: ["Vegetarian"],
      allergens: ["dairy"],
      preparationTime: 25,
    },
  ],
  drinks: [
    {
      id: "6",
      restaurantId: "1",
      name: "House Wine Red",
      description: "Local Merlot, glass",
      price: 8.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "drinks",
      available: true,
      tags: [],
      allergens: ["sulfites"],
      preparationTime: 2,
    },
    {
      id: "7",
      restaurantId: "1",
      name: "San Pellegrino",
      description: "Sparkling water, 500ml",
      price: 4.5,
      image: "/placeholder.svg?height=200&width=300",
      category: "drinks",
      available: true,
      tags: [],
      allergens: [],
      preparationTime: 1,
    },
  ],
};

export default function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const resolvedParams = use(params);
  const { cart, addToCart, updateQuantity, getTotalItems, getTotalPrice } =
    useCart();
  const [activeCategory, setActiveCategory] = useState("starters");

  const categories = [
    { id: "starters", name: "Starters", items: mockMenu.starters },
    { id: "mains", name: "Mains", items: mockMenu.mains },
    { id: "drinks", name: "Drinks", items: mockMenu.drinks },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="relative">
              <img
                src={mockRestaurant.logo || "/placeholder.svg"}
                alt={mockRestaurant.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-green-100"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {mockRestaurant.name}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  Table {resolvedParams.tableId}
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700"
                >
                  Active
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={`whitespace-nowrap transition-all duration-200 ${
                    activeCategory === category.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
                      : "hover:bg-green-50 hover:border-green-200 hover:shadow-sm"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.items.filter((item) => item.available).length}
                  </Badge>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Menu Items */}
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
                  item={item as MenuItem}
                  onAddToCart={addToCart}
                  cartQuantity={
                    cart.find((cartItem) => cartItem.id === item.id)
                      ?.quantity || 0
                  }
                  onUpdateQuantity={updateQuantity}
                  index={index}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Cart Button */}
      <CartButton
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        tableId={resolvedParams.tableId}
      />
    </div>
  );
}

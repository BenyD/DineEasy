"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/qr/MenuItemCard";
import { CartButton } from "@/components/qr/CartButton";
import { useCart } from "@/hooks/useCart";
import { MenuItem } from "@/types";
import { MapPin, Clock, Star, Info } from "lucide-react";

// Mock data - in real app this would come from API
const mockRestaurant = {
  id: "1",
  name: "Bella Vista",
  logo: "/placeholder.svg?height=60&width=60",
  address: "123 Main Street, Zurich",
  rating: 4.8,
  reviews: 243,
  cuisine: "Italian",
  openingHours: "11:30 - 23:00",
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
  const [showInfo, setShowInfo] = useState(false);

  const categories = [
    { id: "starters", name: "Starters", items: mockMenu.starters },
    { id: "mains", name: "Mains", items: mockMenu.mains },
    { id: "drinks", name: "Drinks", items: mockMenu.drinks },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-32">
      {/* Enhanced Restaurant Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            {/* Restaurant Logo */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={mockRestaurant.logo || "/placeholder.svg"}
                  alt={mockRestaurant.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {mockRestaurant.name}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1.5 hover:bg-gray-100 rounded-full transition-colors ${
                    showInfo ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info
                    className={`w-5 h-5 transition-transform ${
                      showInfo ? "text-green-600 rotate-180" : "text-gray-600"
                    }`}
                  />
                </Button>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{mockRestaurant.rating}</span>
                  <span className="text-gray-400">
                    ({mockRestaurant.reviews})
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <span>{mockRestaurant.cuisine}</span>
              </div>

              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="bg-white p-1.5 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm truncate">
                          {mockRestaurant.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="bg-white p-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm">
                          {mockRestaurant.openingHours}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className="text-sm border-green-200 text-green-700 bg-green-50"
                >
                  Table {resolvedParams.tableId}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-sm border-blue-200 text-blue-700 bg-blue-50"
                >
                  Order in Progress
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Category Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((category, index) => {
              const availableItems = category.items.filter(
                (item) => item.available
              ).length;
              const totalItems = category.items.length;

              return (
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
                    size="lg"
                    onClick={() => setActiveCategory(category.id)}
                    className={`relative group transition-all duration-200 ${
                      activeCategory === category.id
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
                        : "hover:bg-green-50 hover:border-green-200 hover:shadow-sm"
                    }`}
                  >
                    <span className="relative z-10">{category.name}</span>
                    {activeCategory === category.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <div className="relative z-10 ml-2 flex gap-1 items-center">
                      <Badge
                        variant="secondary"
                        className={`${
                          activeCategory === category.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {availableItems}/{totalItems}
                      </Badge>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
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

      {/* Cart Button */}
      <CartButton
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        tableId={resolvedParams.tableId}
      />
    </div>
  );
}

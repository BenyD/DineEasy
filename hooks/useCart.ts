"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "@/types";

interface CartItem extends MenuItem {
  quantity: number;
}

// Initialize cart outside the hook to maintain a single source of truth
let initialCart: CartItem[] = [];
try {
  if (typeof window !== "undefined") {
    const savedCart = localStorage.getItem("qr-cart");
    if (savedCart) {
      initialCart = JSON.parse(savedCart);
    }
  }
} catch (error) {
  console.error("Error loading initial cart:", error);
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving cart to localStorage:", cart);
    if (cart.length > 0 || initialCart.length === 0) {
      // Only save if cart has items or was initially empty
      localStorage.setItem("qr-cart", JSON.stringify(cart));
      initialCart = cart; // Update the shared initial cart
    }
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    console.log("Adding item to cart:", item);
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...currentCart, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    initialCart = []; // Clear the shared initial cart
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };
}

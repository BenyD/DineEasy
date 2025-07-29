"use client";

import { useState, useEffect } from "react";
import type { MenuItem } from "@/types";

interface CartItem extends MenuItem {
  quantity: number;
}

// Initialize cart outside the hook to maintain a single source of truth
let initialCart: CartItem[] = [];
let currentTableId: string | null = null;

try {
  if (typeof window !== "undefined") {
    const savedCart = localStorage.getItem("qr-cart");
    const savedTableId = localStorage.getItem("qr-cart-table-id");
    if (savedCart && savedTableId) {
      initialCart = JSON.parse(savedCart);
      currentTableId = savedTableId;
    }
  }
} catch (error) {
  console.error("Error loading initial cart:", error);
  // Clear corrupted data
  if (typeof window !== "undefined") {
    localStorage.removeItem("qr-cart");
    localStorage.removeItem("qr-cart-table-id");
  }
}

export function useCart(tableId?: string) {
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  // Reset cart if table ID changes
  useEffect(() => {
    if (tableId && tableId !== currentTableId) {
      console.log("Table ID changed, clearing cart:", {
        old: currentTableId,
        new: tableId,
      });
      setCart([]);
      initialCart = [];
      currentTableId = tableId;
      localStorage.removeItem("qr-cart");
      localStorage.removeItem("qr-cart-table-id");
    }
  }, [tableId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving cart to localStorage:", cart);
    try {
      if (cart.length > 0 || initialCart.length === 0) {
        // Only save if cart has items or was initially empty
        localStorage.setItem("qr-cart", JSON.stringify(cart));
        if (tableId) {
          localStorage.setItem("qr-cart-table-id", tableId);
        }
        initialCart = cart; // Update the shared initial cart
        currentTableId = tableId || null;
      }
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart, tableId]);

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
    try {
      localStorage.removeItem("qr-cart");
      localStorage.removeItem("qr-cart-table-id");
    } catch (error) {
      console.error("Error clearing cart from localStorage:", error);
    }
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

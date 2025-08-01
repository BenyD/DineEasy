"use client";

import { useState, useEffect, useCallback } from "react";
import type { MenuItem } from "@/types";
import { toast } from "sonner";

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isProcessing: boolean;
  lastError: string | null;
  retryCount: number;
  lastUpdated: number;
}

// Initialize cart outside the hook to maintain a single source of truth
let initialCart: CartItem[] = [];
let currentTableId: string | null = null;
let cartState: CartState = {
  items: [],
  isProcessing: false,
  lastError: null,
  retryCount: 0,
  lastUpdated: Date.now(),
};

// Cart recovery and validation
const loadCartFromStorage = () => {
  try {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("qr-cart");
      const savedTableId = localStorage.getItem("qr-cart-table-id");
      const savedCartState = localStorage.getItem("qr-cart-state");
      const savedTimestamp = localStorage.getItem("qr-cart-timestamp");

      // Check if cart data is not too old (24 hours)
      if (savedTimestamp) {
        const cartAge = Date.now() - parseInt(savedTimestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (cartAge > maxAge) {
          console.log("Cart data is too old, clearing");
          clearCartStorage();
          return { cart: [], tableId: null, state: cartState };
        }
      }

      if (savedCart && savedTableId) {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart structure
        if (
          Array.isArray(parsedCart) &&
          parsedCart.every(
            (item) =>
              item.id &&
              item.name &&
              typeof item.quantity === "number" &&
              item.quantity > 0
          )
        ) {
          initialCart = parsedCart;
          currentTableId = savedTableId;
        } else {
          console.error("Invalid cart structure, clearing");
          clearCartStorage();
        }
      }

      if (savedCartState) {
        const parsedState = JSON.parse(savedCartState);
        cartState = { ...cartState, ...parsedState };
      }
    }
  } catch (error) {
    console.error("Error loading initial cart:", error);
    // Clear corrupted data and notify user
    clearCartStorage();
    if (typeof window !== "undefined") {
      toast.error(
        "Your previous cart could not be loaded. Please add items again."
      );
    }
  }
};

const clearCartStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("qr-cart");
    localStorage.removeItem("qr-cart-table-id");
    localStorage.removeItem("qr-cart-state");
    localStorage.removeItem("qr-cart-timestamp");
  }
};

// Load cart on module initialization
loadCartFromStorage();

export function useCart(tableId?: string) {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [isProcessing, setIsProcessing] = useState(cartState.isProcessing);
  const [lastError, setLastError] = useState<string | null>(
    cartState.lastError
  );
  const [retryCount, setRetryCount] = useState(cartState.retryCount);
  const [showTableChangeWarning, setShowTableChangeWarning] = useState(false);
  const [pendingTableId, setPendingTableId] = useState<string | null>(null);

  const resetCartForNewTable = useCallback((newTableId: string) => {
    console.log("Table ID changed, clearing cart:", {
      old: currentTableId,
      new: newTableId,
    });

    setCart([]);
    setIsProcessing(false);
    setLastError(null);
    setRetryCount(0);
    initialCart = [];
    currentTableId = newTableId;
    cartState = {
      items: [],
      isProcessing: false,
      lastError: null,
      retryCount: 0,
      lastUpdated: Date.now(),
    };
    clearCartStorage();
  }, []);

  const confirmTableChange = useCallback(() => {
    if (pendingTableId) {
      resetCartForNewTable(pendingTableId);
      setShowTableChangeWarning(false);
      setPendingTableId(null);
      toast.info("Cart cleared for new table");
    }
  }, [pendingTableId, resetCartForNewTable]);

  const cancelTableChange = useCallback(() => {
    setShowTableChangeWarning(false);
    setPendingTableId(null);
  }, []);

  // Reset cart if table ID changes with warning
  useEffect(() => {
    if (tableId && tableId !== currentTableId) {
      if (cart.length > 0) {
        // Show warning before clearing cart
        setShowTableChangeWarning(true);
        setPendingTableId(tableId);
        return;
      } else {
        // No items in cart, safe to change table
        resetCartForNewTable(tableId);
      }
    }
  }, [tableId, cart.length, resetCartForNewTable]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving cart to localStorage:", cart);
    try {
      if (cart.length > 0 || initialCart.length === 0) {
        // Only save if cart has items or was initially empty
        localStorage.setItem("qr-cart", JSON.stringify(cart));
        if (currentTableId) {
          localStorage.setItem("qr-cart-table-id", currentTableId);
        }
        localStorage.setItem("qr-cart-timestamp", Date.now().toString());

        // Save cart state
        const stateToSave = {
          items: cart,
          isProcessing,
          lastError,
          retryCount,
          lastUpdated: Date.now(),
        };
        localStorage.setItem("qr-cart-state", JSON.stringify(stateToSave));
        cartState = stateToSave;
      }
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
      toast.error("Failed to save your cart. Please try again.");
    }
  }, [cart, isProcessing, lastError, retryCount]);

  // Enhanced add to cart with error handling
  const addToCart = useCallback((item: MenuItem) => {
    try {
      console.log("Adding item to cart:", item);
      setLastError(null); // Clear any previous errors

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
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setLastError("Failed to add item to cart");
    }
  }, []);

  // Enhanced remove from cart
  const removeFromCart = useCallback((id: string) => {
    try {
      setLastError(null);
      setCart((currentCart) => currentCart.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setLastError("Failed to remove item from cart");
    }
  }, []);

  // Enhanced update quantity with validation
  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      try {
        if (quantity < 0) {
          setLastError("Invalid quantity");
          return;
        }

        if (quantity === 0) {
          removeFromCart(id);
          return;
        }

        setLastError(null);
        setCart((currentCart) =>
          currentCart.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      } catch (error) {
        console.error("Error updating quantity:", error);
        setLastError("Failed to update quantity");
      }
    },
    [removeFromCart]
  );

  // Enhanced clear cart with state reset
  const clearCart = useCallback(() => {
    try {
      setCart([]);
      setIsProcessing(false);
      setLastError(null);
      setRetryCount(0);
      initialCart = []; // Clear the shared initial cart
      cartState = {
        items: [],
        isProcessing: false,
        lastError: null,
        retryCount: 0,
        lastUpdated: Date.now(),
      };
      localStorage.removeItem("qr-cart");
      localStorage.removeItem("qr-cart-table-id");
      localStorage.removeItem("qr-cart-state");
      localStorage.removeItem("qr-cart-timestamp");
    } catch (error) {
      console.error("Error clearing cart from localStorage:", error);
      setLastError("Failed to clear cart");
    }
  }, []);

  // Set processing state
  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessing(processing);
    if (!processing) {
      setRetryCount(0); // Reset retry count when processing completes
    }
  }, []);

  // Increment retry count
  const incrementRetryCount = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Get total items
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Get total price
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // Check if cart is empty
  const isEmpty = useCallback(() => {
    return cart.length === 0;
  }, [cart]);

  // Get cart item by ID
  const getCartItem = useCallback(
    (id: string) => {
      return cart.find((item) => item.id === id);
    },
    [cart]
  );

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isEmpty,
    getCartItem,
    isProcessing,
    setProcessing,
    lastError,
    setLastError,
    retryCount,
    incrementRetryCount,
    showTableChangeWarning,
    confirmTableChange,
    cancelTableChange,
  };
}

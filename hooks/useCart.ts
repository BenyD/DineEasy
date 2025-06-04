"use client"

import { useState, useEffect } from "react"
import type { MenuItem } from "@/types"

interface CartItem extends MenuItem {
  quantity: number
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("qr-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("qr-cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: MenuItem) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...currentCart, { ...item, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart((currentCart) => currentCart.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const removeFromCart = (id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }
}

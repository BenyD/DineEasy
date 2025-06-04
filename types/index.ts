export interface Restaurant {
  id: string
  name: string
  slug: string
  logo?: string
  address: string
  phone: string
  email: string
  plan: "starter" | "pro" | "elite"
  trialEndsAt?: Date
  createdAt: Date
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string
  price: number
  image?: string
  category: string
  allergens: string[]
  available: boolean
  preparationTime: number
}

export interface Order {
  id: string
  restaurantId: string
  tableId: string
  items: OrderItem[]
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  total: number
  paymentStatus: "pending" | "paid" | "failed"
  paymentMethod?: "stripe" | "twint"
  customerNotes?: string
  createdAt: Date
}

export interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  modifications?: string[]
  notes?: string
}

export interface Table {
  id: string
  restaurantId: string
  number: string
  qrCode: string
  capacity: number
  status: "available" | "occupied" | "reserved"
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "kitchen"
  restaurantId: string
}

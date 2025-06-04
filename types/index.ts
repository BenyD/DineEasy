export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  plan: "starter" | "pro" | "elite";
  trialEndsAt?: Date;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  allergens: string[];
  available: boolean;
  preparationTime: number;
  tags: string[];
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed";
  createdAt: Date;
  estimatedTime?: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  modifications?: string[];
  notes?: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: string;
  qrCode: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "kitchen";
  restaurantId: string;
}

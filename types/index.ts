export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type SubscriptionPlan = "starter" | "pro" | "elite";
export type SubscriptionInterval = "monthly" | "yearly";

export type RestaurantType = "restaurant" | "cafe" | "bar" | "food-truck";
export type Currency = "CHF";
// | "USD"
// | "EUR"
// | "GBP"
// | "INR"
// | "AUD"
// | "AED"
// | "SEK"
// | "CAD"
// | "NZD"
// | "LKR"
// | "SGD"
// | "MYR"
// | "THB"
// | "JPY"
// | "HKD"
// | "KRW";
export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "other";
export type TableStatus = "available" | "occupied" | "reserved" | "unavailable";

export type StaffRole = "owner" | "manager" | "chef" | "server" | "cashier";
export type StaffPermission =
  | "orders.view"
  | "orders.manage"
  | "kitchen.view"
  | "kitchen.manage"
  | "menu.view"
  | "menu.manage"
  | "menu.categories"
  | "menu.pricing"
  | "tables.view"
  | "tables.manage"
  | "qr.view"
  | "qr.manage"
  | "analytics.view"
  | "analytics.detailed"
  | "analytics.export"
  | "staff.view"
  | "staff.manage"
  | "staff.permissions"
  | "payments.view"
  | "payments.manage"
  | "billing.view"
  | "billing.manage"
  | "settings.view"
  | "settings.manage"
  | "settings.branding";

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  type: RestaurantType;
  cuisine?: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  currency: Currency;
  taxRate: number;
  vatNumber?: string;
  priceRange?: PriceRange;
  seatingCapacity?: number;
  acceptsReservations: boolean;
  deliveryAvailable: boolean;
  takeoutAvailable: boolean;
  openingHours?: Record<string, any>;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeAccountId?: string;
  stripeAccountEnabled: boolean;
  stripeAccountRequirements?: Record<string, any>;
  stripeAccountCreatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  restaurantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  restaurantId: string;
  userId: string;
  role: StaffRole;
  permissions: StaffPermission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  allergens?: string[];
  preparationTime?: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: string;
  capacity: number;
  status: TableStatus;
  qrCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId?: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  tipAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  restaurantId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentId?: string;
  refundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
  staff?: Staff[];
  createdAt: Date;
}

export interface Feedback {
  id: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  sentiment: "positive" | "neutral" | "negative";
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  restaurantId: string;
  userId?: string;
  type: "order" | "menu" | "staff" | "table" | "payment" | "settings";
  action: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  restaurantId: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

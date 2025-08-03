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
  priceRange?: string;
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

export interface MenuItemAllergen {
  id: string;
  name: string;
  icon: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  preparationTime: number;
  available: boolean;
  popular: boolean;
  allergens: MenuItemAllergen[];
  tags?: string[]; // Dietary and flavor tags
  categoryId: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  // Advanced options
  sizes?: MenuItemSize[];
  modifiers?: MenuItemModifier[];
  hasAdvancedOptions?: boolean;
}

export interface MenuItemSize {
  id: string;
  menuItemId: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemModifier {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  type: "addon" | "substitution" | "preparation" | "sauce" | "topping";
  priceModifier: number;
  isRequired: boolean;
  maxSelections: number;
  sortOrder: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComboMeal {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  basePrice: number;
  discountPercentage: number;
  isAvailable: boolean;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items?: ComboMealItem[];
}

export interface ComboMealItem {
  id: string;
  comboMealId: string;
  menuItemId: string;
  itemType: "main" | "side" | "drink" | "dessert";
  isRequired: boolean;
  isCustomizable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  menuItem?: MenuItem;
  options?: ComboMealOption[];
}

export interface ComboMealOption {
  id: string;
  comboMealItemId: string;
  menuItemId: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  menuItem?: MenuItem;
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
  orderNumber?: string; // Human-readable order number (e.g., "ORD-2025-001")
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
  // Advanced options support
  comboMealId?: string;
  comboMealName?: string;
  selectedSize?: string;
  sizePriceModifier?: number;
  selectedModifiers?: Array<{
    id: string;
    name: string;
    type: string;
    priceModifier: number;
  }>;
  modifiersTotalPrice?: number;
  totalPrice?: number;
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

export interface RestaurantElement {
  id: string;
  type: "entrance" | "kitchen" | "bar" | "bathroom" | "counter" | "storage";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  icon: string;
  locked: boolean;
  visible: boolean;
}

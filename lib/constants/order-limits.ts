// Order limits and business logic validation for QR ordering

export interface OrderLimits {
  maxItemsPerOrder: number;
  maxQuantityPerItem: number;
  maxOrderAmount: number;
  minOrderAmount: number;
  maxTipPercentage: number;
  orderTimeoutMinutes: number;
  maxOrdersPerTable: number;
  maxOrdersPerHour: number;
}

export const DEFAULT_ORDER_LIMITS: OrderLimits = {
  maxItemsPerOrder: 20,
  maxQuantityPerItem: 10,
  maxOrderAmount: 1000, // CHF
  minOrderAmount: 5, // CHF
  maxTipPercentage: 50, // 50% of subtotal
  orderTimeoutMinutes: 30,
  maxOrdersPerTable: 5,
  maxOrdersPerHour: 10,
};

export class OrderValidator {
  private limits: OrderLimits;

  constructor(limits: Partial<OrderLimits> = {}) {
    this.limits = { ...DEFAULT_ORDER_LIMITS, ...limits };
  }

  /**
   * Validate order items and quantities
   */
  validateOrderItems(
    items: Array<{ quantity: number; price: number; name: string }>
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check total number of items
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > this.limits.maxItemsPerOrder) {
      errors.push(
        `Order cannot exceed ${this.limits.maxItemsPerOrder} total items`
      );
    }

    // Check individual item quantities
    items.forEach((item, index) => {
      if (item.quantity > this.limits.maxQuantityPerItem) {
        errors.push(
          `${item.name} quantity cannot exceed ${this.limits.maxQuantityPerItem}`
        );
      }
      if (item.quantity <= 0) {
        errors.push(`${item.name} quantity must be greater than 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate order amount
   */
  validateOrderAmount(subtotal: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (subtotal < this.limits.minOrderAmount) {
      errors.push(`Order minimum is ${this.limits.minOrderAmount} CHF`);
    }

    if (subtotal > this.limits.maxOrderAmount) {
      errors.push(`Order maximum is ${this.limits.maxOrderAmount} CHF`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate tip amount
   */
  validateTipAmount(
    tip: number,
    subtotal: number
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (tip < 0) {
      errors.push("Tip cannot be negative");
    }

    const tipPercentage = (tip / subtotal) * 100;
    if (tipPercentage > this.limits.maxTipPercentage) {
      errors.push(
        `Tip cannot exceed ${this.limits.maxTipPercentage}% of order total`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate order frequency (to be called from server)
   */
  validateOrderFrequency(
    tableId: string,
    recentOrders: Array<{ created_at: string }>
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const now = new Date();

    // Check orders per table
    const tableOrders = recentOrders.filter(
      (order) =>
        new Date(order.created_at) >
        new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (tableOrders.length >= this.limits.maxOrdersPerTable) {
      errors.push(
        `Maximum ${this.limits.maxOrdersPerTable} orders per table per day`
      );
    }

    // Check orders per hour
    const hourlyOrders = recentOrders.filter(
      (order) =>
        new Date(order.created_at) > new Date(now.getTime() - 60 * 60 * 1000) // Last hour
    );

    if (hourlyOrders.length >= this.limits.maxOrdersPerHour) {
      errors.push(`Maximum ${this.limits.maxOrdersPerHour} orders per hour`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Comprehensive order validation
   */
  validateCompleteOrder(data: {
    items: Array<{ quantity: number; price: number; name: string }>;
    subtotal: number;
    tip: number;
    tableId?: string;
    recentOrders?: Array<{ created_at: string }>;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate items
    const itemValidation = this.validateOrderItems(data.items);
    if (!itemValidation.isValid) {
      errors.push(...itemValidation.errors);
    }

    // Validate amount
    const amountValidation = this.validateOrderAmount(data.subtotal);
    if (!amountValidation.isValid) {
      errors.push(...amountValidation.errors);
    }

    // Validate tip
    const tipValidation = this.validateTipAmount(data.tip, data.subtotal);
    if (!tipValidation.isValid) {
      errors.push(...tipValidation.errors);
    }

    // Validate frequency if data provided
    if (data.tableId && data.recentOrders) {
      const frequencyValidation = this.validateOrderFrequency(
        data.tableId,
        data.recentOrders
      );
      if (!frequencyValidation.isValid) {
        errors.push(...frequencyValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if order has timed out
   */
  isOrderTimedOut(createdAt: string): boolean {
    const orderTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const timeoutMs = this.limits.orderTimeoutMinutes * 60 * 1000;
    return currentTime - orderTime > timeoutMs;
  }

  /**
   * Get remaining time for order
   */
  getRemainingTime(createdAt: string): number {
    const orderTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const timeoutMs = this.limits.orderTimeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - (currentTime - orderTime));
  }
}

// Restaurant-specific order limits
export const RESTAURANT_ORDER_LIMITS: Record<string, Partial<OrderLimits>> = {
  // Example: Different limits for different restaurant types
  "fast-food": {
    maxItemsPerOrder: 15,
    maxOrderAmount: 200,
    orderTimeoutMinutes: 20,
  },
  "fine-dining": {
    maxItemsPerOrder: 25,
    maxOrderAmount: 2000,
    orderTimeoutMinutes: 45,
  },
  cafe: {
    maxItemsPerOrder: 12,
    maxOrderAmount: 150,
    orderTimeoutMinutes: 25,
  },
};

// Helper function to get restaurant-specific limits
export function getRestaurantOrderLimits(restaurantType?: string): OrderLimits {
  if (restaurantType && RESTAURANT_ORDER_LIMITS[restaurantType]) {
    return {
      ...DEFAULT_ORDER_LIMITS,
      ...RESTAURANT_ORDER_LIMITS[restaurantType],
    };
  }
  return DEFAULT_ORDER_LIMITS;
}

// Rate limiting utilities
export class RateLimiter {
  private static orderCounts: Map<
    string,
    { count: number; resetTime: number }
  > = new Map();

  static checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.orderCounts.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.orderCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }

  static getRemainingAttempts(
    key: string,
    limit: number,
    windowMs: number
  ): number {
    const now = Date.now();
    const record = this.orderCounts.get(key);

    if (!record || now > record.resetTime) {
      return limit;
    }

    return Math.max(0, limit - record.count);
  }

  static getResetTime(key: string): number | null {
    const record = this.orderCounts.get(key);
    return record ? record.resetTime : null;
  }

  static clearRateLimit(key: string): void {
    this.orderCounts.delete(key);
  }
}

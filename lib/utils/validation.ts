// Input sanitization and validation utilities for QR system

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "")
    .trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate customer name (letters, spaces, hyphens, apostrophes only)
 */
export function validateCustomerName(name: string): boolean {
  if (!name || typeof name !== "string") {
    return false;
  }

  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return (
    nameRegex.test(name.trim()) &&
    name.trim().length >= 2 &&
    name.trim().length <= 50
  );
}

/**
 * Validate special instructions (prevent excessive length and dangerous content)
 */
export function validateSpecialInstructions(instructions: string): boolean {
  if (!instructions || typeof instructions !== "string") {
    return true; // Empty instructions are valid
  }

  const sanitized = sanitizeInput(instructions);
  return sanitized.length <= 500; // Max 500 characters
}

/**
 * Validate table ID format
 */
export function validateTableId(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") {
    return false;
  }

  // UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(tableId);
}

/**
 * Validate restaurant ID format
 */
export function validateRestaurantId(restaurantId: string): boolean {
  if (!restaurantId || typeof restaurantId !== "string") {
    return false;
  }

  // UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(restaurantId);
}

/**
 * Validate order amount (prevent excessive amounts)
 */
export function validateOrderAmount(amount: number): boolean {
  if (typeof amount !== "number" || isNaN(amount)) {
    return false;
  }

  return amount >= 0 && amount <= 10000; // Max 10,000 CHF
}

/**
 * Validate item quantity
 */
export function validateItemQuantity(quantity: number): boolean {
  if (typeof quantity !== "number" || isNaN(quantity)) {
    return false;
  }

  return quantity >= 0 && quantity <= 100; // Max 100 items per order
}

/**
 * Validate tip amount
 */
export function validateTipAmount(tip: number, subtotal: number): boolean {
  if (typeof tip !== "number" || isNaN(tip)) {
    return false;
  }

  // Tip should be reasonable (0-50% of subtotal)
  return tip >= 0 && tip <= subtotal * 0.5;
}

/**
 * Comprehensive order validation
 */
export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateOrderData(data: {
  email?: string;
  customerName?: string;
  specialInstructions?: string;
  items: Array<{ quantity: number; price: number }>;
  subtotal: number;
  tip: number;
}): OrderValidationResult {
  const errors: string[] = [];

  // Validate email
  if (data.email && !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Validate customer name
  if (data.customerName && !validateCustomerName(data.customerName)) {
    errors.push(
      "Invalid customer name (letters, spaces, hyphens, apostrophes only)"
    );
  }

  // Validate special instructions
  if (
    data.specialInstructions &&
    !validateSpecialInstructions(data.specialInstructions)
  ) {
    errors.push("Special instructions too long (max 500 characters)");
  }

  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("Order must contain at least one item");
  } else {
    data.items.forEach((item, index) => {
      if (!validateItemQuantity(item.quantity)) {
        errors.push(`Invalid quantity for item ${index + 1}`);
      }
      if (!validateOrderAmount(item.price)) {
        errors.push(`Invalid price for item ${index + 1}`);
      }
    });
  }

  // Validate subtotal
  if (!validateOrderAmount(data.subtotal)) {
    errors.push("Invalid order amount");
  }

  // Validate tip
  if (!validateTipAmount(data.tip, data.subtotal)) {
    errors.push("Invalid tip amount");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize order data before processing
 */
export function sanitizeOrderData(data: {
  email?: string;
  customerName?: string;
  specialInstructions?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  tip: number;
}) {
  return {
    ...data,
    email: data.email ? sanitizeInput(data.email).toLowerCase() : undefined,
    customerName: data.customerName
      ? sanitizeInput(data.customerName)
      : undefined,
    specialInstructions: data.specialInstructions
      ? sanitizeInput(data.specialInstructions)
      : undefined,
    items: data.items.map((item) => ({
      ...item,
      name: sanitizeInput(item.name),
    })),
  };
}

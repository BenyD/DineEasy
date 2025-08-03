/**
 * Centralized order number utilities for consistent display across the application
 */

/**
 * Formats an order number for display
 * @param orderNumber - The order number from database (e.g., "ORD-2025-001")
 * @param orderId - The order UUID as fallback
 * @returns Formatted order number for display
 */
export function formatOrderNumber(
  orderNumber?: string | null,
  orderId?: string
): string {
  if (orderNumber) {
    return orderNumber; // Return as-is if we have a proper order number
  }

  if (orderId) {
    return `#${orderId.slice(-8).toUpperCase()}`; // Fallback to formatted UUID
  }

  return "Unknown"; // Fallback for missing data
}

/**
 * Gets the display order number from an order object
 * @param order - Order object with orderNumber and id properties
 * @returns Formatted order number for display
 */
export function getDisplayOrderNumber(order: {
  orderNumber?: string | null;
  order_number?: string | null;
  id: string;
}): string {
  const orderNumber = order.orderNumber || order.order_number;
  return formatOrderNumber(orderNumber, order.id);
}

/**
 * Validates if an order number is properly formatted
 * @param orderNumber - The order number to validate
 * @returns True if the order number follows the expected format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  // Check if it matches the pattern ORD-YYYY-NNNNNN
  const orderNumberPattern = /^ORD-\d{4}-\d{6}$/;
  return orderNumberPattern.test(orderNumber);
}

/**
 * Extracts the sequence number from an order number
 * @param orderNumber - The order number (e.g., "ORD-2025-000001")
 * @returns The sequence number as a number
 */
export function getOrderSequenceNumber(orderNumber: string): number {
  const match = orderNumber.match(/^ORD-\d{4}-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

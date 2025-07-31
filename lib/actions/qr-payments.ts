"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Add order timeout configuration at the top
const ORDER_TIMEOUT_MINUTES = 30; // Orders are considered abandoned after 30 minutes

// Helper function to check if an order has timed out
function isOrderTimedOut(createdAt: string): boolean {
  const orderTime = new Date(createdAt).getTime();
  const currentTime = Date.now();
  const timeoutMs = ORDER_TIMEOUT_MINUTES * 60 * 1000;
  return currentTime - orderTime > timeoutMs;
}

export interface QRPaymentData {
  tableId: string;
  restaurantId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  email?: string;
  customerName?: string;
  specialInstructions?: string;
}

// Enhanced error categorization
interface PaymentError {
  type:
    | "card_error"
    | "validation_error"
    | "api_error"
    | "authentication_error"
    | "rate_limit_error"
    | "idempotency_error"
    | "invalid_request_error";
  code?: string;
  decline_code?: string;
  message: string;
  retryable: boolean;
  userMessage: string;
}

// Function to categorize and handle payment errors
function categorizePaymentError(stripeError: any): PaymentError {
  const baseError: PaymentError = {
    type: "api_error",
    message: stripeError.message || "Unknown payment error",
    retryable: false,
    userMessage: "Payment processing failed. Please try again.",
  };

  // Handle different error types
  switch (stripeError.type) {
    case "card_error":
      return handleCardError(stripeError);
    case "validation_error":
      return {
        ...baseError,
        type: "validation_error",
        retryable: false,
        userMessage:
          "Invalid payment information. Please check your details and try again.",
      };
    case "authentication_error":
      return {
        ...baseError,
        type: "authentication_error",
        retryable: true,
        userMessage:
          "Payment authentication required. Please complete the verification.",
      };
    case "rate_limit_error":
      return {
        ...baseError,
        type: "rate_limit_error",
        retryable: true,
        userMessage:
          "Too many payment attempts. Please wait a moment and try again.",
      };
    case "idempotency_error":
      return {
        ...baseError,
        type: "idempotency_error",
        retryable: false,
        userMessage:
          "Duplicate payment detected. Please check if your payment was already processed.",
      };
    case "invalid_request_error":
      return {
        ...baseError,
        type: "invalid_request_error",
        retryable: false,
        userMessage: "Invalid payment request. Please contact support.",
      };
    default:
      return baseError;
  }
}

// Handle specific card errors
function handleCardError(stripeError: any): PaymentError {
  const declineCode = stripeError.decline_code;
  const code = stripeError.code;

  switch (declineCode) {
    case "insufficient_funds":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: false,
        userMessage:
          "Insufficient funds. Please use a different payment method.",
      };
    case "card_declined":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: false,
        userMessage: "Card was declined. Please try a different card.",
      };
    case "expired_card":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: false,
        userMessage: "Card has expired. Please use a different card.",
      };
    case "incorrect_cvc":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: true,
        userMessage: "Incorrect CVC. Please check and try again.",
      };
    case "processing_error":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: true,
        userMessage: "Payment processing error. Please try again.",
      };
    case "authentication_required":
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: true,
        userMessage:
          "3D Secure authentication required. Please complete the verification.",
      };
    default:
      return {
        type: "card_error",
        code,
        decline_code: declineCode,
        message: stripeError.message,
        retryable: false,
        userMessage:
          "Card error occurred. Please try a different payment method.",
      };
  }
}

/**
 * Comprehensive validation for order creation data
 * Handles edge cases and ensures data integrity
 */
function validateOrderData(paymentData: QRPaymentData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic required field validation
  if (!paymentData.restaurantId) {
    errors.push("Restaurant ID is required");
  }

  if (!paymentData.tableId) {
    errors.push("Table ID is required");
  }

  if (!paymentData.items || paymentData.items.length === 0) {
    errors.push("Order must contain at least one item");
  }

  if (paymentData.total <= 0) {
    errors.push("Order total must be greater than 0");
  }

  if (paymentData.subtotal <= 0) {
    errors.push("Order subtotal must be greater than 0");
  }

  if (paymentData.tax < 0) {
    errors.push("Tax amount cannot be negative");
  }

  if (paymentData.tip < 0) {
    errors.push("Tip amount cannot be negative");
  }

  // Validate item data
  if (paymentData.items) {
    paymentData.items.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item ${index + 1}: ID is required`);
      }

      if (!item.name || item.name.trim() === "") {
        errors.push(`Item ${index + 1}: Name is required`);
      }

      if (item.price <= 0) {
        errors.push(`Item ${index + 1}: Price must be greater than 0`);
      }

      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      if (item.quantity > 100) {
        errors.push(`Item ${index + 1}: Quantity cannot exceed 100`);
      }

      // Check for reasonable price limits
      if (item.price > 10000) {
        errors.push(`Item ${index + 1}: Price seems unreasonably high`);
      }
    });
  }

  // Validate total calculation
  const calculatedSubtotal =
    paymentData.items?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) || 0;
  const calculatedTotal =
    calculatedSubtotal + paymentData.tax + paymentData.tip;

  if (Math.abs(calculatedSubtotal - paymentData.subtotal) > 0.01) {
    errors.push("Subtotal calculation mismatch");
  }

  if (Math.abs(calculatedTotal - paymentData.total) > 0.01) {
    errors.push("Total calculation mismatch");
  }

  // Validate email format if provided
  if (
    paymentData.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email)
  ) {
    errors.push("Invalid email format");
  }

  // Validate customer name length
  if (paymentData.customerName && paymentData.customerName.length > 100) {
    errors.push("Customer name is too long (max 100 characters)");
  }

  // Validate special instructions length
  if (
    paymentData.specialInstructions &&
    paymentData.specialInstructions.length > 500
  ) {
    errors.push("Special instructions are too long (max 500 characters)");
  }

  // Check for reasonable order limits
  if (paymentData.total > 10000) {
    errors.push("Order total exceeds maximum limit");
  }

  if (paymentData.items && paymentData.items.length > 50) {
    errors.push("Order contains too many items (max 50)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive Stripe Connect validation for Express accounts
 * Handles all edge cases and requirements for card payments
 */
async function validateStripeConnectForPayment(
  restaurantId: string,
  paymentAmount: number
): Promise<{ isValid: boolean; restaurant?: any; error?: string }> {
  const supabase = createClient();

  try {
    // Get restaurant with full Stripe Connect details
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        `
        id, 
        name, 
        stripe_account_id, 
        currency, 
        stripe_account_enabled,
        stripe_account_requirements,
        stripe_account_charges_enabled,
        stripe_account_payouts_enabled,
        stripe_account_details_submitted
      `
      )
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { isValid: false, error: "Restaurant not found" };
    }

    // Check if Stripe Connect account exists
    if (!restaurant.stripe_account_id) {
      return {
        isValid: false,
        error:
          "Restaurant payment processing is not available. Please pay at the counter.",
      };
    }

    // Check if Stripe Connect account is enabled
    if (!restaurant.stripe_account_enabled) {
      return {
        isValid: false,
        error:
          "Restaurant payment processing is temporarily disabled. Please pay at the counter.",
      };
    }

    // Check if charges are enabled
    if (!restaurant.stripe_account_charges_enabled) {
      return {
        isValid: false,
        error:
          "Restaurant payment processing is not ready. Please pay at the counter.",
      };
    }

    // Check if payouts are enabled (important for Express accounts)
    if (!restaurant.stripe_account_payouts_enabled) {
      return {
        isValid: false,
        error:
          "Restaurant payment processing is not fully configured. Please pay at the counter.",
      };
    }

    // Check if account details are submitted
    if (!restaurant.stripe_account_details_submitted) {
      return {
        isValid: false,
        error:
          "Restaurant payment processing requires additional setup. Please pay at the counter.",
      };
    }

    // Validate Stripe Connect requirements
    if (restaurant.stripe_account_requirements) {
      const requirements = restaurant.stripe_account_requirements;

      // Check for currently due requirements
      if (
        requirements.currently_due &&
        Object.keys(requirements.currently_due).length > 0
      ) {
        return {
          isValid: false,
          error:
            "Restaurant payment processing requires additional verification. Please pay at the counter.",
        };
      }

      // Check for past due requirements
      if (
        requirements.past_due &&
        Object.keys(requirements.past_due).length > 0
      ) {
        return {
          isValid: false,
          error:
            "Restaurant payment processing has pending requirements. Please pay at the counter.",
        };
      }

      // Check for eventually due requirements (warnings)
      if (
        requirements.eventually_due &&
        Object.keys(requirements.eventually_due).length > 0
      ) {
        console.warn("Restaurant has eventually due requirements:", {
          restaurantId,
          requirements: requirements.eventually_due,
        });
      }
    }

    // Validate payment amount limits
    const minimumAmount = 0.5; // 50 cents minimum
    const maximumAmount = 1000; // 1000 currency units maximum

    if (paymentAmount < minimumAmount) {
      return {
        isValid: false,
        error: `Minimum payment amount is ${minimumAmount} ${restaurant.currency || "CHF"}`,
      };
    }

    if (paymentAmount > maximumAmount) {
      return {
        isValid: false,
        error: `Maximum payment amount is ${maximumAmount} ${restaurant.currency || "CHF"}. Please contact staff for large orders.`,
      };
    }

    // Validate currency compatibility
    const supportedCurrencies = ["chf", "eur", "usd", "gbp"];
    const restaurantCurrency = restaurant.currency?.toLowerCase();

    if (
      restaurantCurrency &&
      !supportedCurrencies.includes(restaurantCurrency)
    ) {
      return {
        isValid: false,
        error: `Currency ${restaurant.currency} is not supported for online payments. Please pay at the counter.`,
      };
    }

    return { isValid: true, restaurant };
  } catch (error) {
    console.error("Error validating Stripe Connect setup:", error);
    return {
      isValid: false,
      error:
        "Unable to verify restaurant payment setup. Please pay at the counter.",
    };
  }
}

/**
 * Create Stripe payment intent with comprehensive error handling
 * Handles all edge cases for Stripe Connect Express accounts
 */
async function createStripePaymentIntent(
  paymentData: QRPaymentData,
  restaurant: any,
  orderId: string,
  idempotencyKey: string
): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
  try {
    // Calculate platform fee (2% of total)
    const platformFee = Math.round(paymentData.total * 0.02 * 100);

    // Prepare payment intent data
    const paymentIntentData = {
      amount: Math.round(paymentData.total * 100), // Convert to cents
      currency: restaurant.currency?.toLowerCase() || "chf",
      metadata: {
        restaurantId: paymentData.restaurantId,
        orderId: orderId,
        tableId: paymentData.tableId,
        customerEmail: paymentData.email || "",
        customerName: paymentData.customerName || "",
        isQRPayment: "true",
        restaurantName: restaurant.name,
        platformFee: platformFee.toString(),
        idempotencyKey: idempotencyKey,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/qr/${paymentData.tableId}/confirmation?order_id=${orderId}`,
      transfer_data: {
        destination: restaurant.stripe_account_id,
      },
      application_fee_amount: platformFee,
    };

    // Create payment intent with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const paymentIntent = await stripe.paymentIntents.create(
          paymentIntentData,
          {
            idempotencyKey: idempotencyKey,
          }
        );

        console.log("Stripe payment intent created successfully:", {
          paymentIntentId: paymentIntent.id,
          orderId,
          amount: paymentData.total,
          platformFee: platformFee / 100,
          restaurantId: paymentData.restaurantId,
          restaurantName: restaurant.name,
        });

        return { success: true, paymentIntent };
      } catch (stripeError: any) {
        retryCount++;

        // Handle specific Stripe errors
        if (stripeError.type === "StripeInvalidRequestError") {
          if (stripeError.message.includes("transfer_data")) {
            return {
              success: false,
              error:
                "Restaurant payment processing is not properly configured. Please pay at the counter.",
            };
          }
        }

        if (stripeError.type === "StripeCardError") {
          return {
            success: false,
            error:
              "Card payment is not available for this restaurant. Please pay at the counter.",
          };
        }

        if (stripeError.type === "StripeRateLimitError") {
          if (retryCount < maxRetries) {
            console.log(
              `Stripe rate limit hit, retrying (${retryCount}/${maxRetries})`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
            continue;
          }
          return {
            success: false,
            error:
              "Payment service is temporarily unavailable. Please try again in a moment.",
          };
        }

        // For other errors, log and return generic message
        console.error("Stripe payment intent creation failed:", {
          error: stripeError,
          retryCount,
          orderId,
        });

        if (retryCount >= maxRetries) {
          return {
            success: false,
            error:
              "Payment processing failed. Please try again or pay at the counter.",
          };
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    return {
      success: false,
      error:
        "Payment processing failed after multiple attempts. Please pay at the counter.",
    };
  } catch (error) {
    console.error("Unexpected error creating Stripe payment intent:", error);
    return {
      success: false,
      error: "Payment processing failed. Please pay at the counter.",
    };
  }
}

export async function createQRPaymentIntent(paymentData: QRPaymentData) {
  const supabase = createClient();

  try {
    console.log("Creating QR payment intent:", {
      tableId: paymentData.tableId,
      restaurantId: paymentData.restaurantId,
      total: paymentData.total,
      itemCount: paymentData.items.length,
    });

    // Generate idempotency key to prevent duplicate payments
    const idempotencyKey = `qr_payment_${paymentData.tableId}_${Date.now()}`;

    // Check if this idempotency key was already used
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("metadata->>idempotencyKey", idempotencyKey)
      .single();

    if (existingPayment) {
      console.log(
        "Duplicate payment attempt detected, returning existing payment:",
        {
          paymentId: existingPayment.id,
          status: existingPayment.status,
          idempotencyKey,
        }
      );

      return {
        error: "Payment already processed",
        existingPaymentId: existingPayment.id,
      };
    }

    // Comprehensive Stripe Connect validation
    const stripeValidation = await validateStripeConnectForPayment(
      paymentData.restaurantId,
      paymentData.total
    );

    if (!stripeValidation.isValid) {
      return { error: stripeValidation.error };
    }

    const restaurant = stripeValidation.restaurant!;

    // Use unified order creation function
    const unifiedOrderResult = await createOrder(paymentData, "card");
    if (!unifiedOrderResult.success) {
      return { error: unifiedOrderResult.error };
    }

    const orderId = unifiedOrderResult.orderId!;

    // Create Stripe payment intent with comprehensive error handling
    const paymentIntentResult = await createStripePaymentIntent(
      paymentData,
      restaurant,
      orderId,
      idempotencyKey
    );

    if (!paymentIntentResult.success) {
      // Clean up the order if payment intent creation fails
      await handleFailedPayment(
        orderId,
        paymentIntentResult.error || "Payment intent creation failed"
      );
      return { error: paymentIntentResult.error };
    }

    const paymentIntent = paymentIntentResult.paymentIntent!;

    // Update order with payment intent ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with payment intent:", updateError);
      // Don't fail the payment creation for this error
    }

    console.log("Created QR payment intent successfully:", {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentData.total,
      restaurantId: paymentData.restaurantId,
      restaurantName: restaurant.name,
      idempotencyKey,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error creating QR payment intent:", error);

    // Enhanced error categorization
    const paymentError = categorizePaymentError(error);

    const errorDetails = {
      error: paymentError.userMessage,
      type: paymentError.type,
      code: paymentError.code,
      declineCode: paymentError.decline_code,
      retryable: paymentError.retryable,
      originalError: error,
    };

    console.error("Error creating QR payment intent:", errorDetails);
    return { error: "Failed to create payment intent" };
  }
}

export async function handleFailedPayment(
  orderId: string,
  errorMessage: string
) {
  const supabase = createClient();

  try {
    console.log("Handling failed payment for order:", orderId);

    // Get the order to check its current status with retry mechanism
    let order = null;
    let orderError = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, status, stripe_payment_intent_id, created_at")
          .eq("id", orderId)
          .single();

        order = data;
        orderError = error;
        break;
      } catch (error) {
        retryCount++;
        console.log(`Retry ${retryCount} for order lookup:`, orderId);
        if (retryCount < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          ); // Exponential backoff
        }
      }
    }

    if (orderError || !order) {
      console.error("Order not found for failed payment cleanup:", orderId);
      return { error: "Order not found" };
    }

    // Check if order has timed out
    if (isOrderTimedOut(order.created_at)) {
      console.log("Order has timed out, performing cleanup:", {
        orderId,
        createdAt: order.created_at,
        timeoutMinutes: ORDER_TIMEOUT_MINUTES,
      });

      // Force cleanup for timed out orders regardless of status
      return await performOrderCleanup(orderId, "Order timeout");
    }

    // Only clean up if the order is still pending
    if (order.status === "pending") {
      // Check if this is a definitive failure that warrants deletion
      // vs a temporary failure that should just be marked as cancelled
      const isDefinitiveFailure =
        errorMessage.includes("insufficient_funds") ||
        errorMessage.includes("card_declined") ||
        errorMessage.includes("expired_card") ||
        errorMessage.includes("incorrect_cvc") ||
        errorMessage.includes("processing_error") ||
        errorMessage.includes("invalid_request_error") ||
        errorMessage.includes("timeout");

      if (isDefinitiveFailure) {
        console.log("Definitive failure detected, deleting order:", {
          orderId,
          errorMessage,
        });

        return await performOrderCleanup(orderId, errorMessage);
      } else {
        console.log("Temporary failure detected, marking order as cancelled:", {
          orderId,
          errorMessage,
        });

        // Just mark the order as cancelled instead of deleting it
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateError) {
          console.error(
            "Error updating order status to cancelled:",
            updateError
          );
          return { error: "Failed to update order status" };
        }

        console.log("Successfully marked order as cancelled:", orderId);
      }
    } else {
      console.log("Order is not in pending status, skipping cleanup:", {
        orderId,
        status: order.status,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling failed payment:", error);
    return { error: "Failed to handle payment failure" };
  }
}

// Helper function to perform order cleanup with retry mechanism
async function performOrderCleanup(orderId: string, reason: string) {
  const supabase = createClient();
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Delete order items first (due to foreign key constraints)
      const { error: itemsDeleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsDeleteError) {
        console.error("Error deleting order items:", itemsDeleteError);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          continue;
        }
        return { error: "Failed to delete order items" };
      }

      // Delete the order
      const { error: orderDeleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderDeleteError) {
        console.error("Error deleting failed order:", orderDeleteError);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          continue;
        }
        return { error: "Failed to clean up order" };
      }

      console.log("Successfully cleaned up failed payment order:", orderId);
      return { success: true };
    } catch (error) {
      console.error("Error in performOrderCleanup:", error);
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  return { error: "Failed to clean up order after multiple attempts" };
}

export async function confirmQRPayment(orderId: string) {
  const supabase = createClient();

  try {
    // Get the order to verify it exists and get payment intent ID
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, stripe_payment_intent_id, status, restaurant_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { error: "Order not found" };
    }

    // Check if payment record already exists to prevent duplicates
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("order_id", orderId)
      .single();

    if (paymentCheckError && paymentCheckError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("Error checking for existing payment:", paymentCheckError);
      return { error: "Failed to verify payment status" };
    }

    if (existingPayment) {
      console.log("Payment record already exists:", {
        orderId,
        paymentId: existingPayment.id,
        paymentStatus: existingPayment.status,
      });

      if (existingPayment.status === "completed") {
        return { success: true, message: "Payment already confirmed" };
      } else {
        return {
          error: "Payment is in an invalid state. Please contact support.",
        };
      }
    }

    // Verify payment with Stripe if we have a payment intent ID
    if (order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripe_payment_intent_id
        );

        if (paymentIntent.status === "succeeded") {
          console.log("Payment verified with Stripe:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          });

          // Create payment record
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              restaurant_id: order.restaurant_id,
              order_id: orderId,
              amount: paymentIntent.amount / 100, // Convert from cents
              status: "completed",
              method: "card",
              stripe_payment_id: paymentIntent.id,
            });

          if (paymentError) {
            console.error("Error creating payment record:", paymentError);
            return { error: "Failed to record payment" };
          }

          // Update order status to "preparing"
          const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({ status: "preparing" })
            .eq("id", orderId);

          if (orderUpdateError) {
            console.error("Error updating order status:", orderUpdateError);
            return { error: "Failed to update order status" };
          }

          console.log("Payment confirmed successfully:", {
            orderId,
            paymentIntentId: paymentIntent.id,
          });

          return { success: true, message: "Payment confirmed" };
        } else if (paymentIntent.status === "canceled") {
          console.log("Payment was canceled:", {
            orderId,
            paymentIntentId: paymentIntent.id,
          });

          // Clean up the failed order
          await handleFailedPayment(orderId, "Payment was canceled");

          return { error: "Payment was canceled" };
        } else if (paymentIntent.status === "requires_payment_method") {
          console.log("Payment requires payment method:", {
            orderId,
            paymentIntentId: paymentIntent.id,
          });

          // Clean up the failed order
          await handleFailedPayment(orderId, "Payment method required");

          return { error: "Payment method is required" };
        } else {
          console.log("Payment is in unexpected status:", {
            orderId,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          });

          // Clean up the failed order
          await handleFailedPayment(
            orderId,
            `Payment status: ${paymentIntent.status}`
          );

          return { error: `Payment is in ${paymentIntent.status} status` };
        }
      } catch (stripeError: any) {
        console.error("Error verifying payment with Stripe:", stripeError);

        // Clean up the failed order
        await handleFailedPayment(
          orderId,
          stripeError.message || "Stripe verification failed"
        );

        return { error: "Failed to verify payment with Stripe" };
      }
    } else {
      console.error("No payment intent ID found for order:", orderId);
      return { error: "No payment information found" };
    }
  } catch (error) {
    console.error("Error confirming QR payment:", error);
    return { error: "Failed to confirm payment" };
  }
}

export async function getQROrderDetails(orderId: string) {
  const supabase = createClient();

  try {
    console.log("Fetching order details for:", orderId);

    // First, let's check if the order exists with a simple query
    const { data: simpleOrder, error: simpleError } = await supabase
      .from("orders")
      .select("id, status, created_at, updated_at")
      .eq("id", orderId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

    console.log("Simple order check:", {
      orderId,
      hasOrder: !!simpleOrder,
      orderStatus: simpleOrder?.status,
      createdAt: simpleOrder?.created_at,
      updatedAt: simpleOrder?.updated_at,
      error: simpleError?.message,
      errorCode: simpleError?.code,
    });

    if (simpleError) {
      // Handle specific error codes
      if (simpleError.code === "PGRST116") {
        console.log("Order not found in database (PGRST116):", orderId);
        return { error: "Order not found" };
      } else {
        console.error("Database error checking order:", {
          orderId,
          error: simpleError.message,
          code: simpleError.code,
        });
        return { error: "Database error" };
      }
    }

    if (!simpleOrder) {
      console.log("Order not found in database:", orderId);
      return { error: "Order not found" };
    }

    // Now get the full order details with related data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          menu_item:menu_items (
            id,
            name,
            description,
            price
          )
        ),
        restaurant:restaurants (
          id,
          name,
          address,
          phone
        )
      `
      )
      .eq("id", orderId)
      .maybeSingle(); // Use maybeSingle here too

    if (orderError) {
      console.error("Error fetching full order details:", {
        orderId,
        orderError: orderError?.message || "No error details",
        orderErrorCode: orderError?.code || "unknown",
      });
      return { error: "Failed to fetch order details" };
    }

    if (!order) {
      console.error("Order not found when fetching full details:", orderId);
      return { error: "Order not found" };
    }

    console.log("Order found successfully:", {
      orderId,
      orderStatus: order.status,
      hasOrderItems: order.order_items?.length > 0,
      orderItemsCount: order.order_items?.length || 0,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    });

    return { order };
  } catch (error: any) {
    console.error("Error fetching QR order details:", {
      orderId,
      error: error?.message || "Unknown error",
      errorName: error?.name || "UnknownError",
      stack: error?.stack ? error.stack.split("\n")[0] : undefined,
    });
    return { error: "Failed to fetch order details" };
  }
}

/**
 * Unified order creation function used by both cash and card orders
 * Ensures consistent order creation logic and data integrity
 */
async function createOrder(
  paymentData: QRPaymentData,
  paymentMethod: "card" | "cash",
  stripePaymentIntentId?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const supabase = createClient();

  try {
    console.log(`Creating ${paymentMethod} order:`, {
      tableId: paymentData.tableId,
      restaurantId: paymentData.restaurantId,
      total: paymentData.total,
      itemCount: paymentData.items.length,
      paymentMethod,
    });

    // Comprehensive validation
    const validation = validateOrderData(paymentData);
    if (!validation.isValid) {
      console.error("Order validation failed:", validation.errors);
      return {
        success: false,
        error: `Order validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Check for existing pending orders for this table to prevent duplicates
    const { data: existingOrders, error: existingError } = await supabase
      .from("orders")
      .select("id, status, created_at")
      .eq("table_id", paymentData.tableId)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      console.error("Error checking for existing orders:", existingError);
      return { success: false, error: "Failed to verify existing orders" };
    }

    if (existingOrders && existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      const timeDiff =
        Date.now() - new Date(existingOrder.created_at).getTime();

      if (timeDiff < 5 * 60 * 1000) {
        // Less than 5 minutes
        console.log("Duplicate order prevention: Found recent pending order:", {
          existingOrderId: existingOrder.id,
          timeDiff: Math.round(timeDiff / 1000) + " seconds ago",
        });
        return {
          success: false,
          error:
            "You already have a pending order. Please wait for it to be processed.",
        };
      }
    }

    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, currency")
      .eq("id", paymentData.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Generate UUID for order ID and order number separately
    const orderId = crypto.randomUUID();
    let orderNumber: string;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const { data: orderNumberResult, error: orderNumberError } =
          await supabase.rpc("generate_order_number", {
            restaurant_id: paymentData.restaurantId,
          });

        if (orderNumberError) {
          console.error("Error generating order number:", orderNumberError);
          // Fallback to timestamp-based order number
          orderNumber = `ORD-${new Date().getFullYear()}-${Date.now()}`;
        } else {
          orderNumber = orderNumberResult;
        }

        // Use the atomic order creation function if available, otherwise fallback to manual creation
        try {
          const { data: orderResult, error: orderFunctionError } =
            await supabase.rpc("create_order_with_items", {
              p_order_id: orderId,
              p_restaurant_id: paymentData.restaurantId,
              p_table_id: paymentData.tableId,
              p_order_number: orderNumber,
              p_total_amount: paymentData.total,
              p_tax_amount: paymentData.tax,
              p_tip_amount: paymentData.tip,
              p_customer_name: paymentData.customerName,
              p_customer_email: paymentData.email,
              p_notes: paymentData.specialInstructions,
              p_items: JSON.stringify(
                paymentData.items.map((item) => ({
                  menu_item_id: item.id,
                  quantity: item.quantity,
                  unit_price: item.price,
                  total_price: item.price * item.quantity,
                  notes: null,
                }))
              ),
            });

          if (orderFunctionError) {
            console.log(
              "Atomic order creation failed, falling back to manual creation:",
              orderFunctionError
            );
            throw orderFunctionError; // This will trigger the fallback below
          }

          if (orderResult && orderResult.success) {
            // Update order with payment method and stripe payment intent ID if provided
            const updateData: any = {
              payment_method: paymentMethod,
            };

            if (stripePaymentIntentId) {
              updateData.stripe_payment_intent_id = stripePaymentIntentId;
            }

            const { error: updateError } = await supabase
              .from("orders")
              .update(updateData)
              .eq("id", orderId);

            if (updateError) {
              console.error(
                "Error updating order with payment details:",
                updateError
              );
              // Don't fail the order creation, just log the error
            }

            console.log(
              `${paymentMethod} order created successfully using atomic function:`,
              {
                orderId,
                orderNumber: orderResult.order_number,
                paymentMethod,
                stripePaymentIntentId,
              }
            );
            return { success: true, orderId };
          }
        } catch (atomicError) {
          console.log("Falling back to manual order creation:", atomicError);
        }

        // Fallback: Manual order creation
        const orderData: any = {
          id: orderId,
          restaurant_id: paymentData.restaurantId,
          table_id: paymentData.tableId,
          order_number: orderNumber,
          total_amount: paymentData.total,
          tax_amount: paymentData.tax,
          tip_amount: paymentData.tip,
          status: "pending",
          customer_name: paymentData.customerName,
          customer_email: paymentData.email,
          notes: paymentData.specialInstructions,
          payment_method: paymentMethod,
        };

        if (stripePaymentIntentId) {
          orderData.stripe_payment_intent_id = stripePaymentIntentId;
        }

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert(orderData)
          .select("id")
          .single();

        if (orderError) {
          if (orderError.code === "23505") {
            // Duplicate key error
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(
                `Order ID collision, retrying (${retryCount}/${maxRetries})`
              );
              continue;
            }
          }
          throw orderError;
        }

        // Create order items (only if atomic function failed)
        const orderItems = paymentData.items.map((item) => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (orderItemsError) {
          console.error("Error creating order items:", orderItemsError);
          // Clean up the order if order items creation fails
          await supabase.from("orders").delete().eq("id", orderId);
          return { success: false, error: "Failed to create order items" };
        }

        console.log(`${paymentMethod} order created successfully:`, {
          orderId,
          orderNumber,
          paymentMethod,
          stripePaymentIntentId,
        });
        return { success: true, orderId };
      } catch (error) {
        console.error(`Error creating ${paymentMethod} order:`, error);
        retryCount++;
        if (retryCount >= maxRetries) {
          return {
            success: false,
            error: `Failed to create ${paymentMethod} order after multiple attempts`,
          };
        }
      }
    }

    return { success: false, error: `Failed to create ${paymentMethod} order` };
  } catch (error) {
    console.error(`Error creating ${paymentMethod} order:`, error);
    return { success: false, error: `Failed to create ${paymentMethod} order` };
  }
}

export async function createCashOrder(paymentData: QRPaymentData) {
  // Use unified order creation function
  const orderResult = await createOrder(paymentData, "cash");
  if (!orderResult.success) {
    return { error: orderResult.error };
  }

  return { success: true, orderId: orderResult.orderId };
}

export async function completeCashOrder(orderId: string) {
  try {
    const supabase = createClient();

    // First, check if the order exists and is a cash order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, payment_method, payment_status, total_amount")
      .eq("id", orderId)
      .single();

    if (fetchError) {
      console.error("Error fetching order:", fetchError);
      return { success: false, error: "Order not found" };
    }

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.payment_method !== "cash") {
      return { success: false, error: "This order is not a cash order" };
    }

    if (order.payment_status === "completed") {
      return { success: false, error: "Order is already marked as paid" };
    }

    // Update the order payment status to completed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order payment status:", updateError);
      return { success: false, error: "Failed to mark order as paid" };
    }

    // Create a payment record for the cash payment
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      amount: order.total_amount,
      payment_method: "cash",
      status: "completed",
      stripe_payment_intent_id: null,
      created_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      // Don't fail the entire operation if payment record creation fails
      // The order is already marked as paid
    }

    console.log(`Cash order ${orderId} marked as paid successfully`);
    return { success: true };
  } catch (error) {
    console.error("Error completing cash order:", error);
    return { success: false, error: "Failed to mark order as paid" };
  }
}

// Comprehensive error handling system for QR ordering

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: "low" | "medium" | "high" | "critical";
  retryable: boolean;
  recoveryAction?: string;
}

export class ErrorHandler {
  private static errorMap: Map<string, ErrorInfo> = new Map([
    // Network errors
    [
      "NETWORK_OFFLINE",
      {
        code: "NETWORK_OFFLINE",
        message: "Network connection is offline",
        userMessage:
          "You're currently offline. Please check your connection and try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Check internet connection",
      },
    ],
    [
      "NETWORK_TIMEOUT",
      {
        code: "NETWORK_TIMEOUT",
        message: "Request timed out",
        userMessage: "The request took too long. Please try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Retry the operation",
      },
    ],
    [
      "NETWORK_ERROR",
      {
        code: "NETWORK_ERROR",
        message: "Network request failed",
        userMessage: "Unable to connect to the server. Please try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Check connection and retry",
      },
    ],

    // Validation errors
    [
      "INVALID_EMAIL",
      {
        code: "INVALID_EMAIL",
        message: "Invalid email format",
        userMessage: "Please enter a valid email address.",
        severity: "low",
        retryable: false,
        recoveryAction: "Enter a valid email",
      },
    ],
    [
      "INVALID_NAME",
      {
        code: "INVALID_NAME",
        message: "Invalid customer name",
        userMessage:
          "Please enter a valid name (letters, spaces, hyphens, apostrophes only).",
        severity: "low",
        retryable: false,
        recoveryAction: "Enter a valid name",
      },
    ],
    [
      "INVALID_TABLE_ID",
      {
        code: "INVALID_TABLE_ID",
        message: "Invalid table ID format",
        userMessage: "Invalid table QR code. Please scan again.",
        severity: "high",
        retryable: false,
        recoveryAction: "Scan QR code again",
      },
    ],

    // Payment errors
    [
      "PAYMENT_FAILED",
      {
        code: "PAYMENT_FAILED",
        message: "Payment processing failed",
        userMessage:
          "Payment could not be processed. Please try again or use a different payment method.",
        severity: "high",
        retryable: true,
        recoveryAction: "Try different payment method",
      },
    ],
    [
      "PAYMENT_DECLINED",
      {
        code: "PAYMENT_DECLINED",
        message: "Payment was declined",
        userMessage:
          "Your payment was declined. Please check your payment details and try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Check payment details",
      },
    ],
    [
      "PAYMENT_TIMEOUT",
      {
        code: "PAYMENT_TIMEOUT",
        message: "Payment processing timed out",
        userMessage: "Payment processing took too long. Please try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Retry payment",
      },
    ],

    // Order errors
    [
      "ORDER_NOT_FOUND",
      {
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        userMessage: "Order could not be found. Please try again.",
        severity: "high",
        retryable: true,
        recoveryAction: "Refresh and retry",
      },
    ],
    [
      "ORDER_TIMEOUT",
      {
        code: "ORDER_TIMEOUT",
        message: "Order has timed out",
        userMessage: "Your order has expired. Please place a new order.",
        severity: "high",
        retryable: false,
        recoveryAction: "Place new order",
      },
    ],
    [
      "RESTAURANT_CLOSED",
      {
        code: "RESTAURANT_CLOSED",
        message: "Restaurant is closed",
        userMessage:
          "The restaurant is currently closed and not accepting orders.",
        severity: "medium",
        retryable: false,
        recoveryAction: "Check opening hours",
      },
    ],

    // Cart errors
    [
      "CART_EMPTY",
      {
        code: "CART_EMPTY",
        message: "Cart is empty",
        userMessage: "Your cart is empty. Please add items before proceeding.",
        severity: "low",
        retryable: false,
        recoveryAction: "Add items to cart",
      },
    ],
    [
      "CART_CORRUPTED",
      {
        code: "CART_CORRUPTED",
        message: "Cart data is corrupted",
        userMessage:
          "Your cart data could not be loaded. Please add items again.",
        severity: "medium",
        retryable: false,
        recoveryAction: "Add items again",
      },
    ],

    // Server errors
    [
      "SERVER_ERROR",
      {
        code: "SERVER_ERROR",
        message: "Internal server error",
        userMessage: "Something went wrong on our end. Please try again.",
        severity: "high",
        retryable: true,
        recoveryAction: "Try again later",
      },
    ],
    [
      "SERVICE_UNAVAILABLE",
      {
        code: "SERVICE_UNAVAILABLE",
        message: "Service temporarily unavailable",
        userMessage:
          "The service is temporarily unavailable. Please try again in a few minutes.",
        severity: "high",
        retryable: true,
        recoveryAction: "Wait and retry",
      },
    ],

    // Unknown errors
    [
      "UNKNOWN_ERROR",
      {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
        userMessage: "Something unexpected happened. Please try again.",
        severity: "medium",
        retryable: true,
        recoveryAction: "Try again",
      },
    ],
  ]);

  static getErrorInfo(error: any): ErrorInfo {
    // Try to extract error code from various error formats
    let errorCode = "UNKNOWN_ERROR";

    if (error?.code) {
      errorCode = error.code;
    } else if (error?.message) {
      // Try to match error message patterns
      const message = error.message.toLowerCase();
      if (message.includes("network") || message.includes("fetch")) {
        errorCode = "NETWORK_ERROR";
      } else if (message.includes("timeout")) {
        errorCode = "NETWORK_TIMEOUT";
      } else if (message.includes("payment")) {
        errorCode = "PAYMENT_FAILED";
      } else if (message.includes("order")) {
        errorCode = "ORDER_NOT_FOUND";
      } else if (message.includes("closed")) {
        errorCode = "RESTAURANT_CLOSED";
      }
    }

    return this.errorMap.get(errorCode) || this.errorMap.get("UNKNOWN_ERROR")!;
  }

  static handleError(error: any, context?: string): ErrorInfo {
    const errorInfo = this.getErrorInfo(error);

    // Log error with context
    console.error(`Error in ${context || "unknown context"}:`, {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
    });

    return errorInfo;
  }

  static isRetryable(error: any): boolean {
    const errorInfo = this.getErrorInfo(error);
    return errorInfo.retryable;
  }

  static getSeverity(error: any): "low" | "medium" | "high" | "critical" {
    const errorInfo = this.getErrorInfo(error);
    return errorInfo.severity;
  }

  static shouldShowToUser(error: any): boolean {
    const severity = this.getSeverity(error);
    return severity !== "low";
  }
}

// Error recovery strategies
export class ErrorRecovery {
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        if (!ErrorHandler.isRetryable(error)) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static async retryWithCondition<T>(
    operation: () => Promise<T>,
    condition: (error: any) => boolean,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !condition(error)) {
          break;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }

    throw lastError;
  }
}

// Error reporting
export class ErrorReporter {
  static reportError(error: any, context?: string, userInfo?: any): void {
    const errorInfo = ErrorHandler.handleError(error, context);

    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or your own error tracking system
    console.error("Error Report:", {
      errorInfo,
      context,
      userInfo,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    });
  }

  static reportUserAction(action: string, data?: any): void {
    // Track user actions for debugging
    console.log("User Action:", {
      action,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    });
  }
}

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

type RetryResult<T> =
  | {
      success: true;
      data: T;
      attempts: number;
    }
  | {
      success: false;
      error: any;
      attempts: number;
    };

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;
  let delay = baseDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;

      // Don't retry if we've reached max attempts or if we shouldn't retry this error
      if (attempt === maxAttempts || !shouldRetry(error)) {
        break;
      }

      // Wait before retrying (except on the last attempt)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
  };
}

/**
 * Retry with specific error conditions
 */
export async function retryWithConditions<T>(
  fn: () => Promise<T>,
  conditions: {
    networkErrors?: boolean;
    serverErrors?: boolean;
    timeoutErrors?: boolean;
    maxAttempts?: number;
  } = {}
): Promise<RetryResult<T>> {
  const {
    networkErrors = true,
    serverErrors = true,
    timeoutErrors = true,
    maxAttempts = 3,
  } = conditions;

  const shouldRetry = (error: any) => {
    // Network errors (fetch, axios, etc.)
    if (
      networkErrors &&
      (error.name === "TypeError" ||
        error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.code === "NETWORK_ERROR")
    ) {
      return true;
    }

    // Server errors (5xx)
    if (
      serverErrors &&
      (error.status >= 500 ||
        error.statusCode >= 500 ||
        error.response?.status >= 500)
    ) {
      return true;
    }

    // Timeout errors
    if (
      timeoutErrors &&
      (error.name === "TimeoutError" ||
        error.message?.includes("timeout") ||
        error.code === "TIMEOUT")
    ) {
      return true;
    }

    return false;
  };

  return retryWithBackoff(fn, {
    maxAttempts,
    shouldRetry,
  });
}

/**
 * Retry with custom delay strategy
 */
export async function retryWithCustomDelay<T>(
  fn: () => Promise<T>,
  delays: number[],
  shouldRetry?: (error: any) => boolean
): Promise<RetryResult<T>> {
  const maxAttempts = delays.length + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt,
      };
    } catch (error) {
      if (attempt === maxAttempts || (shouldRetry && !shouldRetry(error))) {
        return {
          success: false,
          error,
          attempts: attempt,
        };
      }

      // Wait before retrying
      if (attempt < maxAttempts) {
        const delay = delays[attempt - 1] || 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: new Error("Max attempts reached"),
    attempts: maxAttempts,
  };
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Operation timed out")), timeout);
  });

  const fnWithTimeout = async () => {
    return Promise.race([fn(), timeoutPromise]);
  };

  return retryWithBackoff(fnWithTimeout, options);
}

/**
 * Comprehensive retry utility with exponential backoff, circuit breaker, and different strategies
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  timeout?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delay: number) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (error: any, attempts: number) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxAttempts: number;
}

export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      halfOpenMaxAttempts: 3,
    }
  ) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = "HALF_OPEN";
        this.halfOpenAttempts = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.halfOpenAttempts = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.options.halfOpenMaxAttempts) {
        this.state = "OPEN";
      }
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

export class RetryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Retry with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...options,
    };

    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await this.executeWithTimeout(operation, config.timeout);

        if (config.onSuccess) {
          config.onSuccess(result, attempt);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (config.onRetry) {
          const delay = this.calculateDelay(attempt, config);
          config.onRetry(attempt, error, delay);
        }

        if (attempt === config.maxAttempts) {
          break;
        }

        if (config.retryCondition && !config.retryCondition(error)) {
          break;
        }

        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    if (config.onFailure) {
      config.onFailure(lastError, config.maxAttempts);
    }

    throw lastError;
  }

  /**
   * Retry with circuit breaker pattern
   */
  async retryWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    retryOptions: Partial<RetryOptions> = {},
    circuitBreakerOptions?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    if (!this.circuitBreakers.has(key)) {
      const defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxAttempts: 3,
      };
      const mergedOptions = { ...defaultOptions, ...circuitBreakerOptions };
      this.circuitBreakers.set(key, new CircuitBreaker(mergedOptions));
    }

    const circuitBreaker = this.circuitBreakers.get(key)!;

    return this.retry(() => circuitBreaker.execute(operation), retryOptions);
  }

  /**
   * Retry for network operations with specific error handling
   */
  async retryNetwork<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.retry(operation, {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 10000,
      retryCondition: (error) => this.isNetworkError(error),
      onRetry: (attempt, error, delay) => {
        console.log(`Network retry attempt ${attempt}:`, {
          error: error.message,
          delay: `${delay}ms`,
          type: error.code || "unknown",
        });
      },
      ...options,
    });
  }

  /**
   * Retry for database operations
   */
  async retryDatabase<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.retry(operation, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      retryCondition: (error) => this.isDatabaseError(error),
      onRetry: (attempt, error, delay) => {
        console.log(`Database retry attempt ${attempt}:`, {
          error: error.message,
          delay: `${delay}ms`,
          code: error.code,
        });
      },
      ...options,
    });
  }

  /**
   * Retry for Stripe API operations
   */
  async retryStripe<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.retry(operation, {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      retryCondition: (error) => this.isStripeRetryableError(error),
      onRetry: (attempt, error, delay) => {
        console.log(`Stripe retry attempt ${attempt}:`, {
          error: error.message,
          delay: `${delay}ms`,
          type: error.type,
          code: error.code,
        });
      },
      ...options,
    });
  }

  private calculateDelay(attempt: number, config: RetryOptions): number {
    let delay =
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    if (config.maxDelay) {
      delay = Math.min(delay, config.maxDelay);
    }

    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    if (!timeout) {
      return operation();
    }

    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timeout")), timeout);
      }),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNetworkError(error: any): boolean {
    return (
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("network") ||
      error.message?.includes("connection") ||
      error.message?.includes("timeout")
    );
  }

  private isDatabaseError(error: any): boolean {
    return (
      error.code === "23505" || // Unique violation
      error.code === "23503" || // Foreign key violation
      error.code === "23514" || // Check violation
      error.message?.includes("connection") ||
      error.message?.includes("timeout") ||
      error.message?.includes("deadlock")
    );
  }

  private isStripeRetryableError(error: any): boolean {
    return (
      error.type === "api_error" ||
      error.type === "rate_limit_error" ||
      error.code === "idempotency_error" ||
      (error.type === "card_error" &&
        ["processing_error", "card_declined"].includes(error.code || ""))
    );
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): Record<
    string,
    { state: string; failureCount: number }
  > {
    const stats: Record<string, { state: string; failureCount: number }> = {};

    for (const [key, circuitBreaker] of this.circuitBreakers) {
      stats[key] = {
        state: circuitBreaker.getState(),
        failureCount: circuitBreaker.getFailureCount(),
      };
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
  }
}

// Global retry manager instance
export const retryManager = new RetryManager();

// Convenience functions
export const retry = retryManager.retry.bind(retryManager);
export const retryNetwork = retryManager.retryNetwork.bind(retryManager);
export const retryDatabase = retryManager.retryDatabase.bind(retryManager);
export const retryStripe = retryManager.retryStripe.bind(retryManager);
export const retryWithCircuitBreaker =
  retryManager.retryWithCircuitBreaker.bind(retryManager);

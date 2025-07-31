"use server";

import { createClient } from "@/lib/supabase/server";

// Configuration
const DEFAULT_TIMEOUT_MINUTES = 30;
const BATCH_SIZE = 50; // Process orders in batches to avoid timeouts

export interface CleanupResult {
  success: boolean;
  cleanedCount: number;
  errors: string[];
  duration: number;
}

export async function cleanupAbandonedOrders(
  timeoutMinutes: number = DEFAULT_TIMEOUT_MINUTES
): Promise<CleanupResult> {
  const supabase = createClient();
  const startTime = Date.now();
  const errors: string[] = [];
  let cleanedCount = 0;

  try {
    console.log(
      `Starting cleanup of abandoned orders (timeout: ${timeoutMinutes} minutes)`
    );

    // Use the database function for cleanup
    const { data: result, error } = await supabase.rpc(
      "cleanup_abandoned_orders",
      { timeout_minutes: timeoutMinutes }
    );

    if (error) {
      console.error("Error calling cleanup function:", error);
      errors.push(`Database cleanup error: ${error.message}`);
      return {
        success: false,
        cleanedCount: 0,
        errors,
        duration: Date.now() - startTime,
      };
    }

    cleanedCount = result || 0;
    console.log(`Cleanup completed: ${cleanedCount} orders cleaned`);

    return {
      success: true,
      cleanedCount,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("Error in cleanupAbandonedOrders:", error);
    errors.push(`Unexpected error: ${error.message}`);

    return {
      success: false,
      cleanedCount,
      errors,
      duration: Date.now() - startTime,
    };
  }
}

export async function getAbandonedOrdersCount(
  timeoutMinutes: number = DEFAULT_TIMEOUT_MINUTES
): Promise<number> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_abandoned_orders", {
      timeout_minutes: timeoutMinutes,
    });

    if (error) {
      console.error("Error getting abandoned orders count:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error in getAbandonedOrdersCount:", error);
    return 0;
  }
}

export async function getOrderTimeoutStatus(orderId: string): Promise<{
  isTimedOut: boolean;
  ageMinutes: number;
  timeUntilTimeout: number;
} | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_order_timeout_status", {
      order_uuid: orderId,
      timeout_minutes: DEFAULT_TIMEOUT_MINUTES,
    });

    if (error || !data || data.length === 0) {
      console.error("Error getting order timeout status:", error);
      return null;
    }

    const status = data[0];
    return {
      isTimedOut: status.is_timed_out,
      ageMinutes: Math.round(status.age_minutes),
      timeUntilTimeout: Math.round(status.time_until_timeout),
    };
  } catch (error) {
    console.error("Error in getOrderTimeoutStatus:", error);
    return null;
  }
}

// Function to get timeout statistics for monitoring
export async function getTimeoutStatistics(): Promise<{
  totalPending: number;
  abandonedCount: number;
  warningCount: number;
  activeCount: number;
} | null> {
  const supabase = createClient();

  try {
    // Get all pending orders with their timeout status
    const { data, error } = await supabase
      .from("order_timeout_monitor")
      .select("timeout_status");

    if (error) {
      console.error("Error getting timeout statistics:", error);
      return null;
    }

    const stats = {
      totalPending: data.length,
      abandonedCount: data.filter(
        (order: any) => order.timeout_status === "ABANDONED"
      ).length,
      warningCount: data.filter(
        (order: any) => order.timeout_status === "TIMEOUT_WARNING"
      ).length,
      activeCount: data.filter(
        (order: any) => order.timeout_status === "ACTIVE"
      ).length,
    };

    return stats;
  } catch (error) {
    console.error("Error in getTimeoutStatistics:", error);
    return null;
  }
}

// Health check function for the cleanup system
export async function cleanupHealthCheck(): Promise<{
  healthy: boolean;
  message: string;
  stats?: any;
}> {
  try {
    const stats = await getTimeoutStatistics();

    if (!stats) {
      return {
        healthy: false,
        message: "Failed to get timeout statistics",
      };
    }

    // Consider system healthy if abandoned orders are less than 10% of total pending
    const abandonedPercentage =
      stats.totalPending > 0
        ? (stats.abandonedCount / stats.totalPending) * 100
        : 0;

    const healthy = abandonedPercentage < 10;

    return {
      healthy,
      message: healthy
        ? "Cleanup system is healthy"
        : `High abandoned order rate: ${abandonedPercentage.toFixed(1)}%`,
      stats,
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `Health check failed: ${error.message}`,
    };
  }
}

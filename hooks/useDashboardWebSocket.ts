"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardWebSocketOptions {
  enabled?: boolean;
  restaurantId?: string;
}

interface DashboardWebSocketState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastUpdate: Date | null;
  newOrders: number;
  newPayments: number;
  error: string | null;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

export function useDashboardWebSocket({
  enabled = true,
  restaurantId,
}: DashboardWebSocketOptions = {}) {
  const [state, setState] = useState<DashboardWebSocketState>({
    isConnected: false,
    reconnectAttempts: 0,
    lastUpdate: null,
    newOrders: 0,
    newPayments: 0,
    error: null,
    connectionStatus: "disconnected",
  });

  const supabase = createClient();
  const router = useRouter();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  const connect = useCallback(async () => {
    if (!enabled || !restaurantId) {
      setState((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        isConnected: false,
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        error: null,
        connectionStatus: "connecting",
      }));

      // Subscribe to orders table
      const ordersSubscription = supabase
        .channel(`dashboard-orders-${restaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            console.log("Dashboard orders update:", payload);
            setState((prev) => ({
              ...prev,
              lastUpdate: new Date(),
              newOrders: prev.newOrders + 1,
            }));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          (payload) => {
            console.log("Dashboard payments update:", payload);
            setState((prev) => ({
              ...prev,
              lastUpdate: new Date(),
              newPayments: prev.newPayments + 1,
            }));
          }
        )
        .subscribe((status) => {
          console.log("Dashboard WebSocket status:", status);

          if (status === "SUBSCRIBED") {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              connectionStatus: "connected",
              reconnectAttempts: 0,
              error: null,
            }));
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setState((prev) => ({
              ...prev,
              isConnected: false,
              connectionStatus: "error",
              error: `Connection failed: ${status}`,
            }));

            // Attempt to reconnect
            if (state.reconnectAttempts < maxReconnectAttempts) {
              const delay =
                reconnectDelay * Math.pow(2, state.reconnectAttempts);
              reconnectTimeoutRef.current = setTimeout(() => {
                setState((prev) => ({
                  ...prev,
                  reconnectAttempts: prev.reconnectAttempts + 1,
                  connectionStatus: "connecting",
                }));
                connect();
              }, delay);
            } else {
              setState((prev) => ({
                ...prev,
                connectionStatus: "error",
                error: "Max reconnection attempts reached",
              }));
            }
          } else if (status === "CLOSED") {
            setState((prev) => ({
              ...prev,
              isConnected: false,
              connectionStatus: "disconnected",
            }));
          }
        });

      return () => {
        ordersSubscription.unsubscribe();
      };
    } catch (error) {
      console.error("Dashboard WebSocket connection error:", error);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: "error",
        error: error instanceof Error ? error.message : "Connection failed",
      }));
    }
  }, [enabled, restaurantId, supabase, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionStatus: "disconnected",
    }));
  }, []);

  const resetCounters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      newOrders: 0,
      newPayments: 0,
    }));
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && restaurantId) {
      connect();
    } else {
      setState((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        isConnected: false,
      }));
    }

    return () => {
      disconnect();
    };
  }, [enabled, restaurantId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    resetCounters,
  };
}

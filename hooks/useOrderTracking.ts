"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderTrackingOptions {
  enabled?: boolean;
  orderId?: string;
  onStatusUpdate?: (status: string) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

interface OrderTrackingState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastUpdate: Date | null;
  orderStatus: string | null;
  error: string | null;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

export function useOrderTracking({
  enabled = true,
  orderId,
  onStatusUpdate,
  onConnectionChange,
  onError,
}: OrderTrackingOptions = {}) {
  const [state, setState] = useState<OrderTrackingState>({
    isConnected: false,
    reconnectAttempts: 0,
    lastUpdate: null,
    orderStatus: null,
    error: null,
    connectionStatus: "disconnected",
  });

  const supabase = createClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Store current callback values to avoid stale closure issues
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
    onConnectionChangeRef.current = onConnectionChange;
    onErrorRef.current = onError;
  }, [onStatusUpdate, onConnectionChange, onError]);

  const connect = useCallback(async () => {
    if (!enabled || !orderId) {
      console.log("Order tracking disabled or no orderId:", {
        enabled,
        orderId,
      });
      return;
    }

    console.log(
      "Attempting to connect to order tracking WebSocket for orderId:",
      orderId
    );

    try {
      setState((prev) => ({
        ...prev,
        error: null,
        connectionStatus: "connecting",
      }));

      // Clean up existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      // Subscribe to specific order updates
      const orderSubscription = supabase
        .channel(`order-tracking-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            console.log("Order status update received:", payload);
            const newStatus = payload.new?.status;
            if (newStatus) {
              setState((prev) => ({
                ...prev,
                lastUpdate: new Date(),
                orderStatus: newStatus,
              }));

              // Call the callback if provided
              onStatusUpdateRef.current?.(newStatus);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            console.log("Order deleted:", payload);
            setState((prev) => ({
              ...prev,
              error: "Order was cancelled or deleted",
              connectionStatus: "error",
            }));
            onErrorRef.current?.("Order was cancelled or deleted");
          }
        )
        .subscribe((status) => {
          console.log("Order tracking WebSocket status:", status);

          if (status === "SUBSCRIBED") {
            console.log("Successfully connected to order tracking WebSocket");
            reconnectAttemptsRef.current = 0;
            setState((prev) => ({
              ...prev,
              isConnected: true,
              reconnectAttempts: 0,
              connectionStatus: "connected",
            }));
            onConnectionChangeRef.current?.(true);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(
              "Order tracking WebSocket connection failed:",
              status
            );
            setState((prev) => ({
              ...prev,
              isConnected: false,
              error: `Connection failed: ${status}`,
              connectionStatus: "error",
            }));
            onConnectionChangeRef.current?.(false);
            onErrorRef.current?.(`Connection failed: ${status}`);

            // Attempt to reconnect
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              const delay =
                reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
              console.log(
                `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
              );

              reconnectAttemptsRef.current += 1;
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);
            } else {
              console.error("Max reconnection attempts reached");
              onErrorRef.current?.("Failed to connect after multiple attempts");
            }
          } else if (status === "CLOSED") {
            console.log("Order tracking WebSocket connection closed");
            setState((prev) => ({
              ...prev,
              isConnected: false,
              connectionStatus: "disconnected",
            }));
            onConnectionChangeRef.current?.(false);
          }
        });

      subscriptionRef.current = orderSubscription;

      return () => {
        console.log("Cleaning up order tracking WebSocket connection");
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    } catch (error) {
      console.error("Order tracking WebSocket connection error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: errorMessage,
        connectionStatus: "error",
      }));
      onConnectionChangeRef.current?.(false);
      onErrorRef.current?.(errorMessage);
    }
  }, [enabled, orderId, supabase]);

  const disconnect = useCallback(() => {
    console.log("Disconnecting order tracking WebSocket");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionStatus: "disconnected",
    }));
    onConnectionChangeRef.current?.(false);
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    console.log("Order tracking useEffect triggered:", { enabled, orderId });
    if (enabled && orderId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, orderId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}

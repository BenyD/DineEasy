import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getMenuWebSocket, disconnectMenuWebSocket } from "@/lib/websocket";
import type { Database } from "@/types/supabase";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

interface WebSocketPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: MenuItem;
  oldRecord?: MenuItem;
}

interface UseMenuWebSocketOptions {
  onItemAdded?: (item: MenuItem) => void;
  onItemUpdated?: (item: MenuItem, oldItem?: MenuItem) => void;
  onItemDeleted?: (item: MenuItem) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseMenuWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useMenuWebSocket({
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseMenuWebSocketOptions = {}): UseMenuWebSocketReturn {
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (!enabled || isConnectedRef.current) return;

    try {
      const webSocket = getMenuWebSocket();

      // Subscribe to all menu item updates
      const unsubscribe = webSocket.subscribeToAll(
        (payload: WebSocketPayload) => {
          const { eventType, newRecord, oldRecord } = payload;

          // Only process updates if we have data
          if (!newRecord && !oldRecord) return;

          switch (eventType) {
            case "INSERT":
              if (newRecord) {
                onItemAdded?.(newRecord);
                toast.success(`Menu item ${newRecord.name} added`);
              }
              break;

            case "UPDATE":
              if (newRecord) {
                onItemUpdated?.(newRecord, oldRecord);

                // Show toast for availability changes
                if (
                  oldRecord &&
                  oldRecord.is_available !== newRecord.is_available
                ) {
                  toast.success(
                    `Menu item ${newRecord.name} ${newRecord.is_available ? "made available" : "made unavailable"}`
                  );
                }
              }
              break;

            case "DELETE":
              if (oldRecord) {
                onItemDeleted?.(oldRecord);
                toast.success(`Menu item ${oldRecord.name} deleted`);
              }
              break;
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;

      // Update presence
      webSocket.updatePresence({
        user_id: "current_user",
        page: "menu",
        timestamp: new Date().toISOString(),
      });

      console.log("Menu WebSocket connected");
    } catch (error) {
      console.error("Failed to connect to Menu WebSocket:", error);
      handleReconnect();
    }
  }, [enabled, onItemAdded, onItemUpdated, onItemDeleted]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    isConnectedRef.current = false;
    console.log("Menu WebSocket disconnected");
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      toast.error("Lost connection to real-time updates");
      return;
    }

    reconnectAttemptsRef.current++;

    console.log(
      `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  // Setup WebSocket error handling
  useEffect(() => {
    if (!enabled) return;

    // The MenuWebSocket class handles reconnection internally
    // No need for additional error handling methods
    return () => {
      // Cleanup handled by disconnect
    };
  }, [enabled]);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      disconnectMenuWebSocket();
    };
  }, [disconnect]);

  return {
    isConnected: isConnectedRef.current,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
}

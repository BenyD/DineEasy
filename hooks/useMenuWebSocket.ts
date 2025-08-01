import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { getMenuWebSocket, disconnectMenuWebSocket } from "@/lib/websocket";

// Define MenuItem type based on database schema
type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  allergens: string[] | null;
  tags: string[] | null;
  preparation_time: number | null;
  calories: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

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
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || isConnectedRef.current) return;

    const handleReconnect = () => {
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
    };

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
      setIsConnected(true);
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
  }, [
    enabled,
    onItemAdded,
    onItemUpdated,
    onItemDeleted,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

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
    setIsConnected(false);
    console.log("Menu WebSocket disconnected");
  }, []);

  // Handle enabled state changes
  useEffect(() => {
    if (enabled && !isConnectedRef.current) {
      connect();
    } else if (!enabled && isConnectedRef.current) {
      disconnect();
    }
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      disconnectMenuWebSocket();
    };
  }, [disconnect]);

  return {
    isConnected,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
}

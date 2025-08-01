import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getTableWebSocket, disconnectTableWebSocket } from "@/lib/websocket";

// Define Table type based on database schema
type Table = {
  id: string;
  restaurant_id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  qr_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  layout_x: number;
  layout_y: number;
  layout_rotation: number;
  layout_width: number;
  layout_height: number;
};

interface WebSocketPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: Table;
  oldRecord?: Table;
}

interface UseTablesWebSocketOptions {
  onTableAdded?: (table: Table) => void;
  onTableUpdated?: (table: Table, oldTable?: Table) => void;
  onTableDeleted?: (table: Table) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseTablesWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useTablesWebSocket({
  onTableAdded,
  onTableUpdated,
  onTableDeleted,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseTablesWebSocketOptions = {}): UseTablesWebSocketReturn {
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

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
      const webSocket = getTableWebSocket();

      // Subscribe to all table updates
      const unsubscribe = webSocket.subscribeToAll(
        (payload: WebSocketPayload) => {
          const { eventType, newRecord, oldRecord } = payload;

          // Only process updates if we have data
          if (!newRecord && !oldRecord) return;

          switch (eventType) {
            case "INSERT":
              if (newRecord) {
                onTableAdded?.(newRecord);
                toast.success(`Table ${newRecord.number} added`);
              }
              break;

            case "UPDATE":
              if (newRecord) {
                onTableUpdated?.(newRecord, oldRecord);

                // Show toast for status changes
                if (oldRecord && oldRecord.status !== newRecord.status) {
                  toast.success(
                    `Table ${newRecord.number} status updated to ${newRecord.status}`
                  );
                }
              }
              break;

            case "DELETE":
              if (oldRecord) {
                onTableDeleted?.(oldRecord);
                toast.success(`Table ${oldRecord.number} deleted`);
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
        page: "tables",
        timestamp: new Date().toISOString(),
      });

      console.log("Tables WebSocket connected");
    } catch (error) {
      console.error("Failed to connect to Tables WebSocket:", error);
      handleReconnect();
    }
  }, [
    enabled,
    onTableAdded,
    onTableUpdated,
    onTableDeleted,
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
    console.log("Tables WebSocket disconnected");
  }, []);

  // Setup WebSocket error handling
  useEffect(() => {
    if (!enabled) return;

    // The TableWebSocket class handles reconnection internally
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
      disconnectTableWebSocket();
    };
  }, [disconnect]);

  return {
    isConnected: isConnectedRef.current,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
}

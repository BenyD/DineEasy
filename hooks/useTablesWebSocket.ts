import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getTableWebSocket, disconnectTableWebSocket } from "@/lib/websocket";
import type { Database } from "@/types/supabase";

type Table = Database["public"]["Tables"]["tables"]["Row"];

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
  }, [enabled, onTableAdded, onTableUpdated, onTableDeleted]);

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

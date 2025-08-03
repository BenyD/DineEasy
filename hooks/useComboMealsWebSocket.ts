import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { getMenuWebSocket, disconnectMenuWebSocket } from "@/lib/websocket";

import { type ComboMeal } from "@/types";

interface WebSocketPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: ComboMeal;
  oldRecord?: ComboMeal;
}

interface UseComboMealsWebSocketOptions {
  onComboAdded?: (combo: ComboMeal) => void;
  onComboUpdated?: (combo: ComboMeal, oldCombo?: ComboMeal) => void;
  onComboDeleted?: (combo: ComboMeal) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseComboMealsWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useComboMealsWebSocket({
  onComboAdded,
  onComboUpdated,
  onComboDeleted,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseComboMealsWebSocketOptions = {}): UseComboMealsWebSocketReturn {
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

      // Subscribe to combo meals updates
      const unsubscribe = webSocket.subscribeToComboMeals(
        (payload: WebSocketPayload) => {
          const { eventType, newRecord, oldRecord } = payload;

          // Only process updates if we have data
          if (!newRecord && !oldRecord) return;

          switch (eventType) {
            case "INSERT":
              if (newRecord) {
                onComboAdded?.(newRecord);
                toast.success(`Combo meal ${newRecord.name} added`);
              }
              break;

            case "UPDATE":
              if (newRecord) {
                onComboUpdated?.(newRecord, oldRecord);

                // Show toast for availability changes
                if (
                  oldRecord &&
                  oldRecord.is_available !== newRecord.is_available
                ) {
                  toast.success(
                    `Combo meal ${newRecord.name} ${newRecord.is_available ? "made available" : "made unavailable"}`
                  );
                }
              }
              break;

            case "DELETE":
              if (oldRecord) {
                onComboDeleted?.(oldRecord);
                toast.success(`Combo meal ${oldRecord.name} deleted`);
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
        page: "combo-meals",
        timestamp: new Date().toISOString(),
      });

      console.log("Combo Meals WebSocket connected");
    } catch (error) {
      console.error("Failed to connect to Combo Meals WebSocket:", error);
      handleReconnect();
    }
  }, [
    enabled,
    onComboAdded,
    onComboUpdated,
    onComboDeleted,
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
    console.log("Combo Meals WebSocket disconnected");
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

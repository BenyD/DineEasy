import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import {
  getRestaurantWebSocket,
  disconnectRestaurantWebSocket,
} from "@/lib/websocket/restaurant";
import type { Database } from "@/types/supabase";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];

interface WebSocketPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: Restaurant;
  oldRecord?: Restaurant;
}

interface UseRestaurantWebSocketOptions {
  onRestaurantUpdated?: (
    restaurant: Restaurant,
    oldRestaurant?: Restaurant
  ) => void;
  onRestaurantStatusChanged?: (isOpen: boolean, wasOpen: boolean) => void;
  restaurantId?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseRestaurantWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useRestaurantWebSocket({
  onRestaurantUpdated,
  onRestaurantStatusChanged,
  restaurantId,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseRestaurantWebSocketOptions = {}): UseRestaurantWebSocketReturn {
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || isConnectedRef.current) return;

    try {
      const webSocket = getRestaurantWebSocket();

      // Subscribe to restaurant updates
      const unsubscribe = restaurantId
        ? webSocket.subscribeToRestaurantStatus(
            restaurantId,
            (payload: WebSocketPayload) => {
              const { eventType, newRecord, oldRecord } = payload;

              if (eventType === "UPDATE" && newRecord) {
                const restaurant = newRecord as Restaurant;
                const oldRestaurant = oldRecord as Restaurant;

                // Check if restaurant status changed
                if (
                  oldRestaurant &&
                  restaurant.is_open !== oldRestaurant.is_open
                ) {
                  onRestaurantStatusChanged?.(
                    restaurant.is_open,
                    oldRestaurant.is_open
                  );

                  // Show toast notification for status change
                  if (restaurant.is_open) {
                    toast.success("Restaurant is now open for business");
                  } else {
                    toast.info("Restaurant is now closed");
                  }
                }

                onRestaurantUpdated?.(restaurant, oldRestaurant);
              }
            }
          )
        : webSocket.subscribeToRestaurantUpdates(
            (payload: WebSocketPayload) => {
              const { eventType, newRecord, oldRecord } = payload;

              if (eventType === "UPDATE" && newRecord) {
                const restaurant = newRecord as Restaurant;
                const oldRestaurant = oldRecord as Restaurant;

                // Check if restaurant status changed
                if (
                  oldRestaurant &&
                  restaurant.is_open !== oldRestaurant.is_open
                ) {
                  onRestaurantStatusChanged?.(
                    restaurant.is_open,
                    oldRestaurant.is_open
                  );
                }

                onRestaurantUpdated?.(restaurant, oldRestaurant);
              }
            }
          );

      unsubscribeRef.current = unsubscribe;
      isConnectedRef.current = true;
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;

      console.log("Restaurant WebSocket connected");
    } catch (error) {
      console.error("Error connecting to Restaurant WebSocket:", error);
      handleReconnect();
    }
  }, [enabled, restaurantId, onRestaurantUpdated, onRestaurantStatusChanged]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    isConnectedRef.current = false;
    setIsConnected(false);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    console.log("Restaurant WebSocket disconnected");
  }, []);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error(
        "Max reconnection attempts reached for Restaurant WebSocket"
      );
      return;
    }

    reconnectAttemptsRef.current++;
    console.log(
      `Restaurant WebSocket reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
    );

    disconnect();

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [disconnect, connect, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
}

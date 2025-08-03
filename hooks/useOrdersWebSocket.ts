import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import {
  getOrdersWebSocket,
  disconnectOrdersWebSocket,
} from "@/lib/websocket/orders";

// Define types based on database schema
type Order = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status:
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "completed"
    | "cancelled";
  total_amount: number;
  currency: string;
  order_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

interface WebSocketPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord?: Order | OrderItem | Payment;
  oldRecord?: Order | OrderItem | Payment;
  table: string;
}

interface UseOrdersWebSocketOptions {
  onOrderAdded?: (order: Order) => void;
  onOrderUpdated?: (order: Order, oldOrder?: Order) => void;
  onOrderDeleted?: (order: Order) => void;
  onOrderItemAdded?: (orderItem: OrderItem) => void;
  onOrderItemUpdated?: (orderItem: OrderItem, oldOrderItem?: OrderItem) => void;
  onOrderItemDeleted?: (orderItem: OrderItem) => void;
  onPaymentAdded?: (payment: Payment) => void;
  onPaymentUpdated?: (payment: Payment, oldPayment?: Payment) => void;
  onPaymentDeleted?: (payment: Payment) => void;
  restaurantId?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseOrdersWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

export function useOrdersWebSocket({
  onOrderAdded,
  onOrderUpdated,
  onOrderDeleted,
  onOrderItemAdded,
  onOrderItemUpdated,
  onOrderItemDeleted,
  onPaymentAdded,
  onPaymentUpdated,
  onPaymentDeleted,
  restaurantId,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseOrdersWebSocketOptions = {}): UseOrdersWebSocketReturn {
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || isConnectedRef.current) return;

    try {
      const webSocket = getOrdersWebSocket();

      // Subscribe to all orders updates
      const unsubscribe = webSocket.subscribeToAll(
        (payload: WebSocketPayload) => {
          const { eventType, newRecord, oldRecord, table } = payload;

          // Only process updates if we have data
          if (!newRecord && !oldRecord) return;

          switch (table) {
            case "orders":
              const order = newRecord as Order;
              const oldOrder = oldRecord as Order;

              // Filter by restaurant if specified
              if (
                restaurantId &&
                order &&
                order.restaurant_id !== restaurantId
              ) {
                return;
              }

              switch (eventType) {
                case "INSERT":
                  if (order) {
                    onOrderAdded?.(order);
                    toast.success(
                      `New order #${order.id.slice(-6).toUpperCase()} received`
                    );
                  }
                  break;

                case "UPDATE":
                  if (order) {
                    onOrderUpdated?.(order, oldOrder);

                    // Show toast for status changes
                    if (oldOrder && oldOrder.status !== order.status) {
                      toast.success(
                        `Order #${order.id.slice(-6).toUpperCase()} status updated to ${order.status}`
                      );
                    }
                  }
                  break;

                case "DELETE":
                  if (oldOrder) {
                    onOrderDeleted?.(oldOrder);
                    toast.success(
                      `Order #${oldOrder.id.slice(-6).toUpperCase()} deleted`
                    );
                  }
                  break;
              }
              break;

            case "order_items":
              const orderItem = newRecord as OrderItem;
              const oldOrderItem = oldRecord as OrderItem;

              switch (eventType) {
                case "INSERT":
                  if (orderItem) {
                    onOrderItemAdded?.(orderItem);
                  }
                  break;

                case "UPDATE":
                  if (orderItem) {
                    onOrderItemUpdated?.(orderItem, oldOrderItem);
                  }
                  break;

                case "DELETE":
                  if (oldOrderItem) {
                    onOrderItemDeleted?.(oldOrderItem);
                  }
                  break;
              }
              break;

            case "payments":
              const payment = newRecord as Payment;
              const oldPayment = oldRecord as Payment;

              switch (eventType) {
                case "INSERT":
                  if (payment) {
                    onPaymentAdded?.(payment);
                    toast.success(`Payment received for order`);
                  }
                  break;

                case "UPDATE":
                  if (payment) {
                    onPaymentUpdated?.(payment, oldPayment);

                    // Show toast for status changes
                    if (oldPayment && oldPayment.status !== payment.status) {
                      toast.success(
                        `Payment status updated to ${payment.status}`
                      );
                    }
                  }
                  break;

                case "DELETE":
                  if (oldPayment) {
                    onPaymentDeleted?.(oldPayment);
                  }
                  break;
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
        page: "orders",
        restaurant_id: restaurantId,
        timestamp: new Date().toISOString(),
      });

      console.log("Orders WebSocket connected");
    } catch (error) {
      console.error("Failed to connect to Orders WebSocket:", error);
      // Use setTimeout to avoid dependency issues
      setTimeout(() => {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isConnectedRef.current && connectRef.current) {
              connectRef.current();
            }
          }, reconnectInterval);
        } else {
          console.error("Max reconnection attempts reached");
          toast.error("Lost connection to real-time order updates");
        }
      }, 0);
    }
  }, [
    enabled,
    restaurantId,
    onOrderAdded,
    onOrderUpdated,
    onOrderDeleted,
    onOrderItemAdded,
    onOrderItemUpdated,
    onOrderItemDeleted,
    onPaymentAdded,
    onPaymentUpdated,
    onPaymentDeleted,
    maxReconnectAttempts,
    reconnectInterval,
  ]);

  // Store connect function in ref
  connectRef.current = connect;

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
    console.log("Orders WebSocket disconnected");
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
      disconnectOrdersWebSocket();
    };
  }, [disconnect]);

  return {
    isConnected,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
  };
}

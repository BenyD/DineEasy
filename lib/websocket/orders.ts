import { createClient } from "@/lib/supabase/client";

export class OrdersWebSocket {
  private supabase = createClient();
  private channel: any = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initializeChannel();
  }

  private initializeChannel() {
    try {
      this.channel = this.supabase
        .channel("orders-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            this.handleOrdersUpdate(payload, "orders");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "order_items",
          },
          (payload) => {
            this.handleOrdersUpdate(payload, "order_items");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
          },
          (payload) => {
            this.handleOrdersUpdate(payload, "payments");
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("Orders WebSocket presence sync");
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("Orders WebSocket user joined:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("Orders WebSocket user left:", key, leftPresences);
        })
        .subscribe((status) => {
          console.log("Orders WebSocket subscription status:", status);
          if (status === "SUBSCRIBED") {
            this.reconnectAttempts = 0;
          } else if (
            status === "CHANNEL_ERROR" &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.handleReconnect();
          }
        });
    } catch (error) {
      console.error("Error initializing Orders WebSocket channel:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    console.log(
      `Orders WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
      }
      this.initializeChannel();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleOrdersUpdate(payload: any, table: string) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log(`Orders update received for ${table}:`, {
      eventType,
      newRecord,
      oldRecord,
    });

    // Notify all listeners
    this.listeners.forEach((callbacks, event) => {
      if (event === "*" || event === eventType || event === table) {
        callbacks.forEach((callback) => {
          try {
            callback({ eventType, newRecord, oldRecord, table });
          } catch (error) {
            console.error("Error in Orders WebSocket listener:", error);
          }
        });
      }
    });
  }

  // Subscribe to all orders updates
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Subscribe to all orders events
  subscribeToAll(callback: Function) {
    return this.subscribe("*", callback);
  }

  // Subscribe to specific table events
  subscribeToTable(tableName: string, callback: Function) {
    return this.subscribe(tableName, callback);
  }

  // Subscribe to orders only
  subscribeToOrders(callback: Function) {
    return this.subscribe("orders", callback);
  }

  // Subscribe to order items only
  subscribeToOrderItems(callback: Function) {
    return this.subscribe("order_items", callback);
  }

  // Subscribe to payments only
  subscribeToPayments(callback: Function) {
    return this.subscribe("payments", callback);
  }

  // Subscribe to specific restaurant orders
  subscribeToRestaurantOrders(restaurantId: string, callback: Function) {
    return this.subscribe("orders", (payload: any) => {
      if (
        payload.newRecord &&
        payload.newRecord.restaurant_id === restaurantId
      ) {
        callback(payload);
      }
    });
  }

  // Send presence update
  async updatePresence(data: any) {
    try {
      await this.channel?.track(data);
    } catch (error) {
      console.error("Error updating orders presence:", error);
    }
  }

  // Disconnect
  disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
let ordersWebSocket: OrdersWebSocket | null = null;

export function getOrdersWebSocket(): OrdersWebSocket {
  if (!ordersWebSocket) {
    ordersWebSocket = new OrdersWebSocket();
  }
  return ordersWebSocket;
}

export function disconnectOrdersWebSocket() {
  if (ordersWebSocket) {
    ordersWebSocket.disconnect();
    ordersWebSocket = null;
  }
}

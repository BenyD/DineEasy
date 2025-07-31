import { createClient } from "@/lib/supabase/client";

export class RestaurantWebSocket {
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
        .channel("restaurant-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "restaurants",
          },
          (payload) => {
            this.handleRestaurantUpdate(payload);
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("Restaurant WebSocket presence sync");
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("Restaurant WebSocket user joined:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("Restaurant WebSocket user left:", key, leftPresences);
        })
        .subscribe((status) => {
          console.log("Restaurant WebSocket subscription status:", status);
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
      console.error("Error initializing Restaurant WebSocket channel:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    console.log(
      `Restaurant WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
      }
      this.initializeChannel();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleRestaurantUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log("Restaurant update received:", {
      eventType,
      newRecord,
      oldRecord,
    });

    // Notify all listeners
    this.notifyListeners("restaurant_update", {
      eventType,
      newRecord,
      oldRecord,
    });
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in restaurant WebSocket listener:", error);
        }
      });
    }
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  subscribeToRestaurantUpdates(callback: Function) {
    return this.subscribe("restaurant_update", callback);
  }

  subscribeToRestaurantStatus(restaurantId: string, callback: Function) {
    return this.subscribe("restaurant_update", (data: any) => {
      if (data.newRecord && data.newRecord.id === restaurantId) {
        callback(data);
      }
    });
  }

  async updatePresence(data: any) {
    if (this.channel) {
      await this.channel.track(data);
    }
  }

  disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.listeners.clear();
  }

  isConnected() {
    return this.channel && this.channel.subscribe().state === "SUBSCRIBED";
  }
}

// Singleton instance
let restaurantWebSocketInstance: RestaurantWebSocket | null = null;

export function getRestaurantWebSocket(): RestaurantWebSocket {
  if (!restaurantWebSocketInstance) {
    restaurantWebSocketInstance = new RestaurantWebSocket();
  }
  return restaurantWebSocketInstance;
}

export function disconnectRestaurantWebSocket() {
  if (restaurantWebSocketInstance) {
    restaurantWebSocketInstance.disconnect();
    restaurantWebSocketInstance = null;
  }
} 
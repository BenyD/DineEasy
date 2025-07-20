import { createClient } from "@/lib/supabase/client";

export class MenuWebSocket {
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
        .channel("menu-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "menu_items",
          },
          (payload) => {
            this.handleMenuUpdate(payload, "menu_items");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "menu_categories",
          },
          (payload) => {
            this.handleMenuUpdate(payload, "menu_categories");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "allergens",
          },
          (payload) => {
            this.handleMenuUpdate(payload, "allergens");
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("Menu WebSocket presence sync");
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("Menu WebSocket user joined:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("Menu WebSocket user left:", key, leftPresences);
        })
        .subscribe((status) => {
          console.log("Menu WebSocket subscription status:", status);
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
      console.error("Error initializing Menu WebSocket channel:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    console.log(
      `Menu WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
      }
      this.initializeChannel();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleMenuUpdate(payload: any, table: string) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log(`Menu update received for ${table}:`, {
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
            console.error("Error in Menu WebSocket listener:", error);
          }
        });
      }
    });
  }

  // Subscribe to all menu updates
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

  // Subscribe to all menu events
  subscribeToAll(callback: Function) {
    return this.subscribe("*", callback);
  }

  // Subscribe to specific table events
  subscribeToTable(tableName: string, callback: Function) {
    return this.subscribe(tableName, callback);
  }

  // Subscribe to menu items only
  subscribeToMenuItems(callback: Function) {
    return this.subscribe("menu_items", callback);
  }

  // Subscribe to categories only
  subscribeToCategories(callback: Function) {
    return this.subscribe("menu_categories", callback);
  }

  // Subscribe to allergens only
  subscribeToAllergens(callback: Function) {
    return this.subscribe("allergens", callback);
  }

  // Send presence update
  async updatePresence(data: any) {
    try {
      await this.channel?.track(data);
    } catch (error) {
      console.error("Error updating menu presence:", error);
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
let menuWebSocket: MenuWebSocket | null = null;

export function getMenuWebSocket(): MenuWebSocket {
  if (!menuWebSocket) {
    menuWebSocket = new MenuWebSocket();
  }
  return menuWebSocket;
}

export function disconnectMenuWebSocket() {
  if (menuWebSocket) {
    menuWebSocket.disconnect();
    menuWebSocket = null;
  }
}

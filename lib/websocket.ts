import { createClient } from "@/lib/supabase/client";

export class TableWebSocket {
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
        .channel("table-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tables",
          },
          (payload) => {
            this.handleTableUpdate(payload);
          }
        )
        .on("presence", { event: "sync" }, () => {
          console.log("WebSocket presence sync");
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("WebSocket user joined:", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("WebSocket user left:", key, leftPresences);
        })
        .subscribe((status) => {
          console.log("WebSocket subscription status:", status);
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
      console.error("Error initializing WebSocket channel:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    console.log(
      `WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
      }
      this.initializeChannel();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleTableUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log("Table update received:", { eventType, newRecord, oldRecord });

    // Notify all listeners
    this.listeners.forEach((callbacks, event) => {
      if (event === "*" || event === eventType) {
        callbacks.forEach((callback) => {
          try {
            callback({ eventType, newRecord, oldRecord });
          } catch (error) {
            console.error("Error in WebSocket listener:", error);
          }
        });
      }
    });
  }

  // Subscribe to table updates
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

  // Subscribe to all table events
  subscribeToAll(callback: Function) {
    return this.subscribe("*", callback);
  }

  // Subscribe to specific table updates
  subscribeToTable(tableId: string, callback: Function) {
    return this.subscribe("UPDATE", (payload: any) => {
      if (payload.newRecord && payload.newRecord.id === tableId) {
        callback(payload);
      }
    });
  }

  // Update presence
  async updatePresence(data: any) {
    if (this.channel) {
      await this.channel.track(data);
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
            this.handleMenuUpdate(payload);
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

  private handleMenuUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    console.log("Menu update received:", { eventType, newRecord, oldRecord });

    // Notify all listeners
    this.listeners.forEach((callbacks, event) => {
      if (event === "*" || event === eventType) {
        callbacks.forEach((callback) => {
          try {
            callback({ eventType, newRecord, oldRecord });
          } catch (error) {
            console.error("Error in Menu WebSocket listener:", error);
          }
        });
      }
    });
  }

  // Subscribe to menu updates
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

  // Subscribe to specific menu item updates
  subscribeToMenuItem(itemId: string, callback: Function) {
    return this.subscribe("UPDATE", (payload: any) => {
      if (payload.newRecord && payload.newRecord.id === itemId) {
        callback(payload);
      }
    });
  }

  // Update presence
  async updatePresence(data: any) {
    if (this.channel) {
      await this.channel.track(data);
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

// Singleton instances
let tableWebSocketInstance: TableWebSocket | null = null;
let menuWebSocketInstance: MenuWebSocket | null = null;

export function getTableWebSocket(): TableWebSocket {
  if (!tableWebSocketInstance) {
    tableWebSocketInstance = new TableWebSocket();
  }
  return tableWebSocketInstance;
}

export function getMenuWebSocket(): MenuWebSocket {
  if (!menuWebSocketInstance) {
    menuWebSocketInstance = new MenuWebSocket();
  }
  return menuWebSocketInstance;
}

export function disconnectTableWebSocket() {
  if (tableWebSocketInstance) {
    tableWebSocketInstance.disconnect();
    tableWebSocketInstance = null;
  }
}

export function disconnectMenuWebSocket() {
  if (menuWebSocketInstance) {
    menuWebSocketInstance.disconnect();
    menuWebSocketInstance = null;
  }
}

// Re-export Orders WebSocket functions
export {
  getOrdersWebSocket,
  disconnectOrdersWebSocket,
} from "./websocket/orders";

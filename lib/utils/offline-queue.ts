// Offline request queue system for QR ordering

interface QueuedRequest {
  id: string;
  type: "add_to_cart" | "update_quantity" | "remove_from_cart" | "submit_order";
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface QueueConfig {
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private config: QueueConfig;
  private storageKey = "qr-offline-queue";

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 2000,
      maxQueueSize: 50,
      ...config,
    };
    this.loadQueue();
  }

  private loadQueue(): void {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          this.queue = JSON.parse(saved);
        }
      }
    } catch (error) {
      console.error("Error loading offline queue:", error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
      }
    } catch (error) {
      console.error("Error saving offline queue:", error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addRequest(type: QueuedRequest["type"], data: any): string {
    const request: QueuedRequest = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    // Prevent queue from growing too large
    if (this.queue.length >= this.config.maxQueueSize) {
      this.queue.shift(); // Remove oldest request
    }

    this.queue.push(request);
    this.saveQueue();
    return request.id;
  }

  removeRequest(id: string): boolean {
    const index = this.queue.findIndex((req) => req.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      return true;
    }
    return false;
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const requests = [...this.queue];

      for (const request of requests) {
        try {
          await this.processRequest(request);
          this.removeRequest(request.id);
        } catch (error) {
          console.error(
            `Error processing queued request ${request.id}:`,
            error
          );

          request.retryCount++;
          if (request.retryCount >= request.maxRetries) {
            console.log(
              `Request ${request.id} exceeded max retries, removing from queue`
            );
            this.removeRequest(request.id);
          } else {
            // Update the request in the queue
            const index = this.queue.findIndex((req) => req.id === request.id);
            if (index !== -1) {
              this.queue[index] = request;
              this.saveQueue();
            }
          }
        }

        // Add delay between requests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    switch (request.type) {
      case "add_to_cart":
        // This would typically call a server action to sync cart state
        console.log("Processing add_to_cart request:", request.data);
        break;

      case "update_quantity":
        console.log("Processing update_quantity request:", request.data);
        break;

      case "remove_from_cart":
        console.log("Processing remove_from_cart request:", request.data);
        break;

      case "submit_order":
        console.log("Processing submit_order request:", request.data);
        break;

      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  hasPendingRequests(): boolean {
    return this.queue.length > 0;
  }
}

// Create a singleton instance
let offlineQueueInstance: OfflineQueue | null = null;

export function getOfflineQueue(): OfflineQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueue();
  }
  return offlineQueueInstance;
}

// Network status monitoring
export class NetworkMonitor {
  private queue: OfflineQueue;
  private isOnline = navigator.onLine;

  constructor() {
    this.queue = getOfflineQueue();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    console.log("Network connection restored, processing queued requests");
    this.queue.processQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log("Network connection lost, requests will be queued");
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }
  }
}

// Hook for React components
export function useOfflineQueue() {
  const queue = getOfflineQueue();

  const addToQueue = (type: QueuedRequest["type"], data: any) => {
    return queue.addRequest(type, data);
  };

  const processQueue = () => queue.processQueue();
  const getQueueSize = () => queue.getQueueSize();
  const hasPendingRequests = () => queue.hasPendingRequests();
  const clearQueue = () => queue.clearQueue();

  return {
    addToQueue,
    processQueue,
    getQueueSize,
    hasPendingRequests,
    clearQueue,
  };
}

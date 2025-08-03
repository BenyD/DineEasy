import { useState, useEffect } from "react";
import { useOrdersWebSocket } from "./useOrdersWebSocket";
import { getRestaurantOrders } from "@/lib/actions/orders";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";

interface OrderCounts {
  active: number;
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  completed: number;
  total: number;
}

export function useOrderCounts() {
  const { restaurant } = useRestaurantSettings();
  const [counts, setCounts] = useState<OrderCounts>({
    active: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get live order counts for active orders only (not history)
  const { isConnected } = useOrdersWebSocket({
    restaurantId: restaurant?.id,
    onOrderAdded: (newOrder) => {
      // Only count as active if it's not completed/cancelled
      if (newOrder.status !== "completed" && newOrder.status !== "cancelled") {
        setCounts((prev) => {
          const newCounts = { ...prev };
          newCounts.total += 1;
          newCounts.active += 1;

          switch (newOrder.status) {
            case "pending":
              newCounts.pending += 1;
              break;
            case "preparing":
              newCounts.preparing += 1;
              break;
            case "ready":
              newCounts.ready += 1;
              break;
            case "served":
              newCounts.served += 1;
              break;
          }

          return newCounts;
        });
      }
    },
    onOrderUpdated: (updatedOrder, oldOrder) => {
      setCounts((prev) => {
        const newCounts = { ...prev };

        // Remove from old status
        if (oldOrder) {
          if (
            oldOrder.status !== "completed" &&
            oldOrder.status !== "cancelled"
          ) {
            switch (oldOrder.status) {
              case "pending":
                newCounts.pending = Math.max(0, newCounts.pending - 1);
                break;
              case "preparing":
                newCounts.preparing = Math.max(0, newCounts.preparing - 1);
                break;
              case "ready":
                newCounts.ready = Math.max(0, newCounts.ready - 1);
                break;
              case "served":
                newCounts.served = Math.max(0, newCounts.served - 1);
                break;
            }
          }
        }

        // Add to new status
        if (
          updatedOrder.status !== "completed" &&
          updatedOrder.status !== "cancelled"
        ) {
          switch (updatedOrder.status) {
            case "pending":
              newCounts.pending += 1;
              break;
            case "preparing":
              newCounts.preparing += 1;
              break;
            case "ready":
              newCounts.ready += 1;
              break;
            case "served":
              newCounts.served += 1;
              break;
          }
        } else {
          // Order moved to history (completed/cancelled)
          newCounts.active = Math.max(0, newCounts.active - 1);
          newCounts.completed += 1;
        }

        return newCounts;
      });
    },
    onOrderDeleted: (deletedOrder) => {
      setCounts((prev) => {
        const newCounts = { ...prev };
        newCounts.total = Math.max(0, newCounts.total - 1);

        if (
          deletedOrder.status !== "completed" &&
          deletedOrder.status !== "cancelled"
        ) {
          newCounts.active = Math.max(0, newCounts.active - 1);

          switch (deletedOrder.status) {
            case "pending":
              newCounts.pending = Math.max(0, newCounts.pending - 1);
              break;
            case "preparing":
              newCounts.preparing = Math.max(0, newCounts.preparing - 1);
              break;
            case "ready":
              newCounts.ready = Math.max(0, newCounts.ready - 1);
              break;
            case "served":
              newCounts.served = Math.max(0, newCounts.served - 1);
              break;
          }
        } else {
          newCounts.completed = Math.max(0, newCounts.completed - 1);
        }

        return newCounts;
      });
    },
  });

  // Initial fetch of order counts (active orders only)
  useEffect(() => {
    const fetchOrderCounts = async () => {
      if (!restaurant?.id) return;

      setLoading(true);
      try {
        // Only fetch active orders (not history)
        const result = await getRestaurantOrders(restaurant.id, {});

        if (result.success && result.data) {
          const orders = result.data;
          const newCounts: OrderCounts = {
            active: 0,
            pending: 0,
            preparing: 0,
            ready: 0,
            served: 0,
            completed: 0,
            total: 0,
          };

          orders.forEach((order) => {
            // Only count active orders (not completed/cancelled)
            if (order.status !== "completed" && order.status !== "cancelled") {
              newCounts.active += 1;
              newCounts.total += 1;

              switch (order.status) {
                case "pending":
                  newCounts.pending += 1;
                  break;
                case "preparing":
                  newCounts.preparing += 1;
                  break;
                case "ready":
                  newCounts.ready += 1;
                  break;
                case "served":
                  newCounts.served += 1;
                  break;
              }
            }
            // Don't count completed/cancelled orders in active counts
          });

          console.log("Order counts fetched:", newCounts);
          setCounts(newCounts);
        }
      } catch (error) {
        console.error("Error fetching order counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, [restaurant?.id]);

  return {
    counts,
    loading,
    isConnected,
  };
}

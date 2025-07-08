"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OrderCard } from "./OrderCard";
import { createPortal } from "react-dom";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  status: string;
  time: Date;
  estimatedTime: number;
  notes: string;
  priority: string;
  total: number;
}

interface KitchenDndContextProps {
  orders: Order[];
  onOrdersChange: (newOrders: Order[]) => void;
}

const COLUMN_TITLES: { [key: string]: string } = {
  new: "New Orders",
  preparing: "Preparing",
  ready: "Ready",
};

export function KitchenDndContext({
  orders,
  onOrdersChange,
}: KitchenDndContextProps) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeOrder = orders.find((order) => order.id === activeId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === "delivered") {
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      onOrdersChange(updatedOrders);
      return;
    }

    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });

    onOrdersChange(updatedOrders);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeOrder = orders.find((order) => order.id === active.id);
    const overOrder = orders.find((order) => order.id === over.id);

    if (!activeOrder) return;

    // If dropping over another order
    if (overOrder) {
      const activeStatus = activeOrder.status;
      const overStatus = overOrder.status;

      // Only allow dropping in adjacent status columns
      const validTransitions: { [key: string]: string[] } = {
        new: ["preparing"],
        preparing: ["new", "ready"],
        ready: ["preparing", "delivered"],
      };

      if (!validTransitions[activeStatus]?.includes(overStatus)) return;

      const updatedOrders = orders.map((order) => {
        if (order.id === activeOrder.id) {
          return { ...order, status: overStatus };
        }
        return order;
      });

      onOrdersChange(updatedOrders);
    }
    // If dropping directly in a status column
    else if (["new", "preparing", "ready"].includes(over.id as string)) {
      const newStatus = over.id as string;

      // Check if the status transition is valid
      const validTransitions: { [key: string]: string[] } = {
        new: ["preparing"],
        preparing: ["new", "ready"],
        ready: ["preparing", "delivered"],
      };

      if (!validTransitions[activeOrder.status]?.includes(newStatus)) return;

      const updatedOrders = orders.map((order) => {
        if (order.id === activeOrder.id) {
          return { ...order, status: newStatus };
        }
        return order;
      });

      onOrdersChange(updatedOrders);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeOrder = orders.find((order) => order.id === active.id);
    if (!activeOrder) {
      setActiveId(null);
      return;
    }

    // If the order was dropped on the "delivered" container, remove it
    if (over.id === "delivered") {
      const updatedOrders = orders.filter((order) => order.id !== active.id);
      onOrdersChange(updatedOrders);
    }

    setActiveId(null);
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["new", "preparing", "ready"].map((status) => (
          <div key={status} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {COLUMN_TITLES[status]}
            </h3>
            <div className="space-y-4">
              {getOrdersByStatus(status).map((order) => (
                <OrderCard
                  key={order.id}
                  {...order}
                  onStatusChange={handleStatusChange}
                />
              ))}
                </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["new", "preparing", "ready"].map((status) => (
          <div
            key={status}
            className="bg-gray-50 p-4 rounded-lg"
            data-status={status}
          >
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {COLUMN_TITLES[status]}
            </h3>
            <SortableContext
              items={getOrdersByStatus(status).map((order) => order.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {getOrdersByStatus(status).map((order) => (
                  <OrderCard
                    key={order.id}
                    {...order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      {mounted &&
        createPortal(
          <DragOverlay adjustScale={true}>
            {activeId && activeOrder ? (
              <div className="opacity-50">
                <OrderCard
                  {...activeOrder}
                  onStatusChange={handleStatusChange}
                />
          </div>
        ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

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
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OrderCard } from "./OrderCard";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { AlertCircle, Timer, CheckCircle, Clock } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

interface Order {
  id: string;
  orderNumber: string;
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

const COLUMN_CONFIG = [
  {
    id: "pending",
    title: "New Orders",
    icon: AlertCircle,
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
  },
  {
    id: "preparing",
    title: "Preparing",
    icon: Timer,
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
  },
  {
    id: "ready",
    title: "Ready",
    icon: CheckCircle,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
  {
    id: "served",
    title: "Served",
    icon: Clock,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
  },
];

export function KitchenDndContext({
  orders,
  onOrdersChange,
}: KitchenDndContextProps) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    if (newStatus === "completed") {
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
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This will be handled in handleDragEnd for better UX
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setIsDragging(false);
      return;
    }

    const activeOrder = orders.find((order) => order.id === active.id);
    if (!activeOrder) {
      setActiveId(null);
      setIsDragging(false);
      return;
    }

    // If the order was dropped on a status column, update the status
    if (COLUMN_CONFIG.some((col) => col.id === over.id)) {
      const newStatus = over.id as string;

      // Check if the status transition is valid
      const validTransitions: { [key: string]: string[] } = {
        pending: ["preparing"],
        preparing: ["ready"],
        ready: ["served"],
        served: ["completed"],
      };

      if (validTransitions[activeOrder.status]?.includes(newStatus)) {
        const updatedOrders = orders.map((order) => {
          if (order.id === activeOrder.id) {
            return { ...order, status: newStatus };
          }
          return order;
        });
        onOrdersChange(updatedOrders);
      }
    }

    setActiveId(null);
    setIsDragging(false);
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  // Droppable Column Component
  function DroppableColumn({ column }: { column: (typeof COLUMN_CONFIG)[0] }) {
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
    });

    const columnOrders = getOrdersByStatus(column.id);
    const Icon = column.icon;

    return (
      <motion.div
        ref={setNodeRef}
        className={`${column.bgColor} ${column.borderColor} p-4 rounded-lg border-2 transition-all duration-200 ${
          isDragging ? "ring-2 ring-blue-200" : ""
        } ${isOver ? "ring-2 ring-green-400 bg-opacity-80" : ""}`}
        data-status={column.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${column.iconColor}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              {column.title}
            </h3>
          </div>
          <Badge
            className={`bg-${column.color}-100 text-${column.color}-800 border-${column.color}-200`}
          >
            {columnOrders.length}
          </Badge>
        </div>

        <SortableContext
          items={columnOrders.map((order) => order.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 min-h-[200px]">
            {columnOrders.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No orders</p>
              </div>
            ) : (
              columnOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  {...order}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </SortableContext>
      </motion.div>
    );
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {COLUMN_CONFIG.map((column) => (
          <div
            key={column.id}
            className={`${column.bgColor} ${column.borderColor} p-4 rounded-lg border-2`}
          >
            <div className="flex items-center gap-2 mb-4">
              <column.icon className={`h-5 w-5 ${column.iconColor}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {column.title}
              </h3>
              <Badge
                className={`bg-${column.color}-100 text-${column.color}-800`}
              >
                {getOrdersByStatus(column.id).length}
              </Badge>
            </div>
            <div className="space-y-4">
              {getOrdersByStatus(column.id).map((order) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMN_CONFIG.map((column) => (
          <DroppableColumn key={column.id} column={column} />
        ))}
      </div>

      {mounted &&
        createPortal(
          <DragOverlay adjustScale={true} dropAnimation={null}>
            {activeId && activeOrder ? (
              <div className="opacity-90 transform rotate-2 scale-105">
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

"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Trash2,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: "order" | "payment" | "alert" | "system";
  actionUrl?: string;
}

// Move initial notifications to a function to prevent hydration issues
const getInitialNotifications = (): Notification[] => {
  const now = Date.now();
  return [
    {
      id: "1",
      title: "New Order #1234",
      message: "Table 5 placed a new order - 3 items ($45.90)",
      timestamp: now,
      read: false,
      type: "order",
      actionUrl: "/dashboard/orders",
    },
    {
      id: "2",
      title: "Payment Received",
      message: "Payment of $52.40 received from Table 3 via Credit Card",
      timestamp: now - 1000 * 60 * 30, // 30 mins ago
      read: false,
      type: "payment",
      actionUrl: "/dashboard/payments",
    },
    {
      id: "3",
      title: "System Update Available",
      message:
        "A new version of DineEasy is available. Update includes performance improvements and bug fixes.",
      timestamp: now - 1000 * 60 * 60, // 1 hour ago
      read: true,
      type: "system",
    },
    {
      id: "4",
      title: "Low Stock Alert",
      message:
        "Chicken Wings are running low (5 portions left). Consider updating your inventory soon.",
      timestamp: now - 1000 * 60 * 120, // 2 hours ago
      read: true,
      type: "alert",
      actionUrl: "/dashboard/menu",
    },
  ];
};

export function NotificationPopover() {
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setNotifications(getInitialNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getNotificationStyles = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return {
          dot: "bg-blue-500",
          bg: "bg-blue-50",
          text: "text-blue-700",
          hover: "hover:bg-blue-50/80",
        };
      case "payment":
        return {
          dot: "bg-green-500",
          bg: "bg-green-50",
          text: "text-green-700",
          hover: "hover:bg-green-50/80",
        };
      case "alert":
        return {
          dot: "bg-red-500",
          bg: "bg-red-50",
          text: "text-red-700",
          hover: "hover:bg-red-50/80",
        };
      case "system":
        return {
          dot: "bg-purple-500",
          bg: "bg-purple-50",
          text: "text-purple-700",
          hover: "hover:bg-purple-50/80",
        };
      default:
        return {
          dot: "bg-gray-500",
          bg: "bg-gray-50",
          text: "text-gray-700",
          hover: "hover:bg-gray-50/80",
        };
    }
  };

  // Render a consistent initial state
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", isOpen && "bg-muted")}
        >
          <Bell
            className={cn(
              "h-5 w-5 transition-colors",
              isOpen ? "text-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "No unread notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearNotifications}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-20rem)] max-h-[450px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="grid">
              {notifications.map((notification) => {
                const styles = getNotificationStyles(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-4 border-b p-4 transition-colors",
                      !notification.read && styles.bg,
                      notification.actionUrl && "cursor-pointer",
                      styles.hover
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        styles.dot
                      )}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <time className="text-[11px] text-muted-foreground tabular-nums">
                            {getTimeAgo(notification.timestamp)}
                          </time>
                          {!notification.read && (
                            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                                <span className="sr-only">Mark as read</span>
                              </Button>
                            </div>
                          )}
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                              <span className="sr-only">
                                Remove notification
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60">
                          <Clock className="h-3 w-3" />
                          View details
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="absolute inset-0"
                        onClick={() => {
                          setIsOpen(false);
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <span className="sr-only">
                          View {notification.title}
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

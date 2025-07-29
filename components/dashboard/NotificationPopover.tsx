"use client";

import * as React from "react";
import {
  Bell,
  Check,
  Trash2,
  Clock,
  ChevronRight,
  ShoppingCart,
  CreditCard,
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
import Link from "next/link";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { formatAmountWithCurrency } from "@/lib/utils/currency";

// Mock notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: "order" | "payment";
  actionUrl?: string;
}

// Move initial notifications to a function to prevent hydration issues
const getInitialNotifications = (currency: string): Notification[] => {
  const now = Date.now();
  return [
    {
      id: "1",
      title: "New Order #1234",
      message: `Table 5 placed a new order - 3 items (${formatAmountWithCurrency(45.9, currency)})`,
      timestamp: now,
      read: false,
      type: "order",
      actionUrl: "/dashboard/orders",
    },
    {
      id: "2",
      title: "Payment Received",
      message: `Payment of ${formatAmountWithCurrency(52.4, currency)} received from Table 3 via Credit Card`,
      timestamp: now - 1000 * 60 * 30, // 30 mins ago
      read: false,
      type: "payment",
      actionUrl: "/dashboard/payments",
    },
  ];
};

export function NotificationPopover() {
  const { currency } = useRestaurantSettings();
  const [mounted, setMounted] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setNotifications(getInitialNotifications(currency));
    audioRef.current = new Audio("/notification-sound.mp3");
  }, [currency]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    }
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
          bg: "bg-blue-50",
          text: "text-blue-700",
          hover: "hover:bg-blue-50/80",
          icon: <ShoppingCart className="h-4 w-4 text-blue-500" />,
        };
      case "payment":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          hover: "hover:bg-green-50/80",
          icon: <CreditCard className="h-4 w-4 text-green-500" />,
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          hover: "hover:bg-gray-50/80",
          icon: <Bell className="h-4 w-4 text-gray-500" />,
        };
    }
  };

  // Render a consistent initial state
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
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
          className={cn("relative", { "bg-muted": isOpen })}
        >
          <Bell
            className={cn("h-5 w-5 transition-colors", {
              "text-foreground": isOpen,
              "text-muted-foreground": !isOpen,
            })}
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
          <h4 className="font-semibold">Notifications</h4>
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
                Clear all
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
                  <Link
                    key={notification.id}
                    href={notification.actionUrl || "#"}
                    className={cn(
                      "group flex gap-4 border-b p-4 transition-colors",
                      !notification.read && styles.bg,
                      styles.hover
                    )}
                    onClick={() => {
                      setIsOpen(false);
                      if (!notification.read) {
                        markAllAsRead();
                      }
                    }}
                  >
                    {styles.icon}
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
                        <time className="text-[11px] text-muted-foreground tabular-nums">
                          {getTimeAgo(notification.timestamp)}
                        </time>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        View details
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

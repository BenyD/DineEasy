"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";
import { useTablesWebSocket } from "@/hooks/useTablesWebSocket";
import { useOrdersWebSocket } from "@/hooks/useOrdersWebSocket";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";

export function DashboardFooter() {
  const pathname = usePathname();

  // Determine which WebSocket hook to use based on the current page
  const isMenuPage = pathname.includes("/menu");
  const isTablesPage = pathname.includes("/tables");
  const isOrdersPage = pathname.includes("/orders");
  const isKitchenPage = pathname.includes("/kitchen");
  const isDashboardPage = pathname === "/dashboard";

  // Use appropriate WebSocket hook based on page
  const menuWebSocket = useMenuWebSocket({ enabled: isMenuPage });
  const tablesWebSocket = useTablesWebSocket({ enabled: isTablesPage });
  const ordersWebSocket = useOrdersWebSocket({
    enabled: isOrdersPage || isKitchenPage || isDashboardPage,
  });

  // Get the active WebSocket connection
  const activeWebSocket = isMenuPage
    ? menuWebSocket
    : isTablesPage
      ? tablesWebSocket
      : ordersWebSocket; // Use ordersWebSocket for orders, kitchen, and dashboard pages

  // Handle different WebSocket hook interfaces
  const isConnected =
    "isConnected" in activeWebSocket ? activeWebSocket.isConnected : false;
  const reconnectAttempts =
    "reconnectAttempts" in activeWebSocket
      ? activeWebSocket.reconnectAttempts
      : 0;
  const connectionStatus =
    "connectionStatus" in activeWebSocket
      ? activeWebSocket.connectionStatus
      : ((isConnected ? "connected" : "disconnected") as
          | "connected"
          | "disconnected"
          | "connecting"
          | "error");
  const error = "error" in activeWebSocket ? activeWebSocket.error : null;
  const lastUpdate =
    "lastUpdate" in activeWebSocket ? activeWebSocket.lastUpdate : null;

  // Get page-specific connection label
  const getConnectionLabel = () => {
    if (isMenuPage) return "Menu Live";
    if (isTablesPage) return "Tables Live";
    if (isOrdersPage) return "Orders Live";
    if (isKitchenPage) return "Kitchen Live";
    if (isDashboardPage) return "Dashboard Live";
    return "Live";
  };

  // Get connection status icon and color
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
          label: getConnectionLabel(),
        };
      case "connecting":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
          label: "Connecting...",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          label: "Connection Error",
        };
      default:
        return {
          icon: WifiOff,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          label: "Offline",
        };
    }
  };

  const connectionStatusInfo = getConnectionStatus();
  const StatusIcon = connectionStatusInfo.icon;

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {/* Left side - Copyright */}
          <div className="flex items-center">
            <span>
              © {new Date().getFullYear()} DineEasy. All rights reserved.
            </span>
          </div>

          {/* Center - Help Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/help"
              className="text-muted-foreground/70 hover:text-foreground transition-colors text-xs"
            >
              Help Center
            </Link>
            <Link
              href="/support"
              className="text-muted-foreground/70 hover:text-foreground transition-colors text-xs"
            >
              Support
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground/70 hover:text-foreground transition-colors text-xs"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground/70 hover:text-foreground transition-colors text-xs"
            >
              Terms
            </Link>
          </div>

          {/* Right side - Status Indicators */}
          <div className="flex items-center gap-2">
            {/* WebSocket Status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border backdrop-blur transition-all duration-200",
                      connectionStatusInfo.bgColor,
                      connectionStatusInfo.borderColor
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "w-3 h-3",
                        connectionStatusInfo.color,
                        connectionStatus === "connecting" && "animate-spin"
                      )}
                    />
                    <span
                      className={cn("font-medium", connectionStatusInfo.color)}
                    >
                      {connectionStatusInfo.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <p className="font-medium">Real-time Updates</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {connectionStatus === "connected"
                          ? `${getConnectionLabel()} - Updates will sync automatically`
                          : connectionStatus === "connecting"
                            ? "Establishing connection..."
                            : connectionStatus === "error"
                              ? "Connection failed - Manual refresh required"
                              : "Disconnected - Manual refresh required"}
                      </p>
                      {(() => {
                        if (
                          lastUpdate &&
                          connectionStatus === "connected" &&
                          lastUpdate instanceof Date
                        ) {
                          return (
                            <p className="text-xs text-green-600">
                              Last update: {lastUpdate.toLocaleTimeString()}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      {reconnectAttempts > 0 && (
                        <p className="text-xs text-orange-600">
                          Reconnection attempts: {String(reconnectAttempts)}
                        </p>
                      )}
                      {(() => {
                        if (error && typeof error === "string") {
                          return (
                            <p className="text-xs text-red-600">
                              Error: {error}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Mobile Help Links */}
        <div className="md:hidden mt-2 pt-2 border-t">
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link
              href="/help"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Help Center
            </Link>
            <Link
              href="/support"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Support
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

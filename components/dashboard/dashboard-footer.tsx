"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";
import { useTablesWebSocket } from "@/hooks/useTablesWebSocket";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DashboardFooter() {
  const pathname = usePathname();

  // Determine which WebSocket hook to use based on the current page
  const isMenuPage = pathname.includes("/menu");
  const isTablesPage = pathname.includes("/tables");

  // Use appropriate WebSocket hook based on page
  const menuWebSocket = useMenuWebSocket({ enabled: isMenuPage });
  const tablesWebSocket = useTablesWebSocket({ enabled: isTablesPage });

  // Get the active WebSocket connection
  const activeWebSocket = isMenuPage
    ? menuWebSocket
    : isTablesPage
      ? tablesWebSocket
      : menuWebSocket;
  const { isConnected, reconnectAttempts } = activeWebSocket;

  // Get page-specific connection label
  const getConnectionLabel = () => {
    if (isMenuPage) return "Menu Live";
    if (isTablesPage) return "Tables Live";
    return "Live";
  };

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

          {/* Right side - WebSocket Status */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border bg-background/50 backdrop-blur">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isConnected
                          ? "bg-green-500 animate-pulse"
                          : "bg-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isConnected ? "text-green-700" : "text-red-700"
                      )}
                    >
                      {isConnected ? getConnectionLabel() : "Offline"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Real-time Updates</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected
                        ? `${getConnectionLabel()} - Updates will sync automatically`
                        : "Disconnected - Manual refresh required"}
                    </p>
                    {reconnectAttempts > 0 && (
                      <p className="text-xs text-orange-600">
                        Reconnection attempts: {reconnectAttempts}
                      </p>
                    )}
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

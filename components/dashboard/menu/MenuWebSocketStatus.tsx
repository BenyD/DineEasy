import { Badge } from "@/components/ui/badge";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";

interface MenuWebSocketStatusProps {
  isAddDialogOpen?: boolean;
  editingItem?: any;
  isSubmitting?: boolean;
}

export function MenuWebSocketStatus({
  isAddDialogOpen = false,
  editingItem = null,
  isSubmitting = false,
}: MenuWebSocketStatusProps) {
  const { isConnected } = useMenuWebSocket();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <Badge
        variant={isConnected ? "default" : "secondary"}
        className="text-xs"
      >
        Real-time
      </Badge>
    </div>
  );
}

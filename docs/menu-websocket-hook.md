# Menu WebSocket Hook Documentation

## Overview

The `useMenuWebSocket` hook provides a reusable way to handle real-time menu updates across your application. It encapsulates all the WebSocket logic for menu items, categories, and allergens, making it easy to add real-time functionality to any component.

## Features

- **Real-time Updates**: Automatically syncs menu changes across all connected users
- **Form Protection**: Prevents form resets during active editing
- **Smart Filtering**: Allows category/allergen updates during dialogs while blocking menu item updates
- **Toast Notifications**: Provides user feedback for all changes
- **Connection Status**: Tracks WebSocket connection state
- **Automatic Cleanup**: Handles connection cleanup on unmount

## Basic Usage

```tsx
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";

function MyComponent() {
  const { disconnect, isConnected } = useMenuWebSocket();

  return (
    <div>
      <p>Connection Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## Advanced Usage with Form Protection

```tsx
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";

function MenuPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { disconnect, isConnected } = useMenuWebSocket({
    isAddDialogOpen,
    editingItem,
    isSubmitting,
  });

  return <div>{/* Your menu content */}</div>;
}
```

## Hook Options

| Option            | Type      | Default | Description                                                              |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------ |
| `isAddDialogOpen` | `boolean` | `false` | When true, blocks menu item updates but allows category/allergen updates |
| `editingItem`     | `any`     | `null`  | When set, blocks all WebSocket updates to prevent form interference      |
| `isSubmitting`    | `boolean` | `false` | When true, blocks all WebSocket updates during form submission           |

## Return Values

| Property      | Type         | Description                                   |
| ------------- | ------------ | --------------------------------------------- |
| `disconnect`  | `() => void` | Function to manually disconnect the WebSocket |
| `isConnected` | `boolean`    | Current connection status                     |

## Real-time Update Types

### Menu Items

- **INSERT**: New menu item added
- **UPDATE**: Menu item modified (with specific notifications for availability/price changes)
- **DELETE**: Menu item removed

### Categories

- **INSERT**: New category added
- **UPDATE**: Category modified
- **DELETE**: Category removed

### Allergens

- **INSERT**: New allergen added
- **UPDATE**: Allergen modified
- **DELETE**: Allergen removed

## Form Protection Logic

The hook intelligently manages when to apply WebSocket updates:

1. **During Form Submission**: All updates are blocked
2. **During Item Editing**: All updates are blocked
3. **During Add Dialog**:
   - Menu item updates are blocked
   - Category/allergen updates are allowed (for real-time form updates)

## Example Components

### Connection Status Component

```tsx
import { Badge } from "@/components/ui/badge";
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";

export function MenuWebSocketStatus() {
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
      <Badge variant={isConnected ? "default" : "secondary"}>Real-time</Badge>
    </div>
  );
}
```

### Kitchen Display Component

```tsx
import { useMenuWebSocket } from "@/hooks/useMenuWebSocket";

export function KitchenDisplay() {
  // Kitchen display can receive real-time menu updates
  const { isConnected } = useMenuWebSocket();

  return (
    <div>
      <h2>Kitchen Display</h2>
      {isConnected && <p>Receiving real-time updates</p>}
      {/* Kitchen display content */}
    </div>
  );
}
```

## Benefits of Using the Hook

### 1. **Reusability**

- Use the same WebSocket logic across multiple components
- Consistent behavior throughout the application

### 2. **Cleaner Components**

- Removes complex WebSocket logic from component files
- Focus on component-specific logic instead of WebSocket management

### 3. **Better Testing**

- Test WebSocket logic independently
- Mock the hook for component testing

### 4. **Easier Maintenance**

- Centralized WebSocket logic
- Single place to update WebSocket behavior

### 5. **Performance**

- Optimized re-renders with proper dependency management
- Automatic cleanup prevents memory leaks

## Migration from Inline WebSocket Logic

### Before (Inline Logic)

```tsx
useEffect(() => {
  const webSocket = getMenuWebSocket();
  const unsubscribe = webSocket.subscribeToAll((payload) => {
    // 200+ lines of WebSocket logic
  });
  return () => unsubscribe();
}, [dependencies]);
```

### After (Custom Hook)

```tsx
const { disconnect, isConnected } = useMenuWebSocket({
  isAddDialogOpen,
  editingItem,
  isSubmitting,
});
```

## Best Practices

1. **Always pass form state**: Provide `isAddDialogOpen`, `editingItem`, and `isSubmitting` to prevent form interference
2. **Use connection status**: Display connection status to users for better UX
3. **Handle disconnection**: Use the `disconnect` function when needed
4. **Multiple instances**: The hook can be used in multiple components simultaneously
5. **Error handling**: The hook includes built-in error handling and reconnection logic

## Troubleshooting

### Connection Issues

- Check if Supabase WebSocket is properly configured
- Verify RLS policies allow real-time subscriptions
- Check browser console for WebSocket errors

### Form Interference

- Ensure all form state variables are passed to the hook
- Check that `isSubmitting` is properly set during form submission
- Verify `editingItem` is set when editing existing items

### Performance Issues

- Avoid using the hook in components that don't need real-time updates
- Consider using `useMemo` for expensive operations in components using the hook
- Monitor WebSocket message frequency in browser dev tools

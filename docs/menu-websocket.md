# Menu WebSocket Implementation

## Overview

The Menu WebSocket implementation provides real-time updates for menu management, enabling collaborative menu editing across multiple users without requiring manual page refreshes.

## Features

### Real-Time Updates

- **Menu Items**: Instant updates when items are added, edited, or deleted
- **Categories**: Real-time category management
- **Allergens**: Live allergen updates

### User Notifications

- Toast notifications for all menu changes
- Specific notifications for important changes (availability, price updates)
- User-friendly messages with item names

### Multi-User Collaboration

- Multiple users can edit menu simultaneously
- Changes appear instantly for all connected users
- No conflicts or data loss

## Technical Implementation

### WebSocket Class

```typescript
// lib/websocket/menu.ts
export class MenuWebSocket {
  // Monitors: menu_items, menu_categories, allergens tables
  // Events: INSERT, UPDATE, DELETE
  // Features: Auto-reconnection, error handling, presence tracking
}
```

### Database Tables Monitored

1. **`menu_items`** - Menu item changes
2. **`menu_categories`** - Category management
3. **`allergens`** - Allergen information

### Event Types Handled

- **INSERT**: New items added
- **UPDATE**: Existing items modified
- **DELETE**: Items removed

## Usage

### Automatic Integration

The WebSocket is automatically integrated into the menu page and requires no additional setup.

### Manual Usage (if needed)

```typescript
import {
  getMenuWebSocket,
  disconnectMenuWebSocket,
} from "@/lib/websocket/menu";

// Get WebSocket instance
const webSocket = getMenuWebSocket();

// Subscribe to specific events
const unsubscribe = webSocket.subscribeToMenuItems((payload) => {
  console.log("Menu item update:", payload);
});

// Cleanup
unsubscribe();
disconnectMenuWebSocket();
```

## Benefits

### For Restaurant Staff

- **Instant Updates**: See menu changes immediately
- **Collaboration**: Multiple staff can work simultaneously
- **No Refresh Needed**: Automatic updates without manual intervention
- **Real-Time Notifications**: Immediate feedback on changes

### For Restaurant Operations

- **Efficiency**: Faster menu management
- **Accuracy**: Real-time data consistency
- **Coordination**: Better staff coordination
- **Customer Experience**: Faster menu updates

## Error Handling

### Automatic Reconnection

- Up to 5 reconnection attempts
- Exponential backoff strategy
- Graceful fallback on connection failures

### Error Recovery

- Automatic channel reinitialization
- State preservation during reconnection
- User notification for connection issues

## Performance Considerations

### Optimized Updates

- Only updates changed data
- Prevents duplicate notifications
- Efficient state management

### Memory Management

- Proper cleanup on component unmount
- Singleton pattern prevents multiple connections
- Automatic listener cleanup

## Future Enhancements

### Potential Additions

1. **Order WebSocket**: Real-time order updates
2. **Kitchen WebSocket**: Live kitchen notifications
3. **Payment WebSocket**: Payment status updates
4. **Dashboard WebSocket**: Real-time analytics

### Advanced Features

- User presence indicators
- Conflict resolution for simultaneous edits
- Offline support with sync
- Selective subscriptions based on user role

## Troubleshooting

### Common Issues

1. **Connection Lost**: Automatic reconnection handles this
2. **Duplicate Updates**: Built-in deduplication prevents this
3. **State Conflicts**: WebSocket updates take precedence

### Debug Information

- Console logs for connection status
- Toast notifications for all updates
- Error logging for troubleshooting

## Security

### Data Validation

- All incoming data is validated
- SQL injection protection via Supabase
- User authentication required

### Access Control

- Row Level Security (RLS) enforced
- User-specific data filtering
- Restaurant-specific data isolation

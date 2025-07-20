# Tables Management System

## Overview

The Tables Management System provides a comprehensive solution for restaurant owners to manage their tables, generate QR codes, and track table status in real-time. This system integrates with the DineEasy platform to provide a seamless dining experience.

## Features

### ✅ Implemented Features

1. **Table Management**
   - Create, edit, and delete tables
   - Set table capacity (1-20 people)
   - Unique table numbers per restaurant
   - Soft delete functionality (preserves data)

2. **Table Status Tracking**
   - Available: Ready for customers
   - Occupied: Currently serving customers
   - Reserved: Reserved for upcoming bookings
   - Unavailable: Temporarily out of service

3. **QR Code System**
   - Automatic QR code generation for each table
   - QR code download functionality
   - Customizable QR code styling
   - Direct link to table-specific ordering page

4. **Advanced Filtering & Search**
   - Search by table number
   - Filter by status (All, Available, Occupied, Reserved, Unavailable)
   - Filter by capacity (1-2, 3-4, 5-6, 7+ people)
   - Clear filters functionality

5. **Real-time Statistics**
   - Available tables count
   - Occupied tables count
   - Total tables count
   - Total seating capacity

6. **Activity Logging**
   - Track all table operations
   - Log table creation, updates, deletions
   - Log status changes and QR code generation
   - Metadata tracking for analytics

7. **Staff Permissions**
   - Role-based access control
   - Tables view permissions
   - Tables management permissions
   - QR code management permissions

## Database Schema

### Tables Table

```sql
CREATE TABLE tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status table_status DEFAULT 'available' NOT NULL,
  qr_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(restaurant_id, number)
);
```

### Table Status Enum

```sql
CREATE TYPE table_status AS ENUM (
  'available',
  'occupied',
  'reserved',
  'unavailable'
);
```

### RLS Policies

```sql
-- Staff can view tables
CREATE POLICY "Staff can view tables" ON tables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.restaurant_id = tables.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
      AND s.permissions && array['tables.view']::text[]
    )
  );

-- Staff can manage tables
CREATE POLICY "Staff can manage tables" ON tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = tables.restaurant_id
      AND r.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.restaurant_id = tables.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = true
      AND s.permissions && array['tables.manage']::text[]
    )
  );
```

## Server Actions

### Table Management

#### `getTables()`

Fetch all active tables for the current restaurant.

```typescript
const result = await getTables();
// Returns: { success: boolean, data?: Table[], error?: string }
```

#### `createTable(formData: FormData)`

Create a new table.

```typescript
const formData = new FormData();
formData.append("number", "1");
formData.append("capacity", "4");

const result = await createTable(formData);
// Returns: { success: boolean, data?: Table, error?: string }
```

#### `updateTable(id: string, formData: FormData)`

Update an existing table.

```typescript
const formData = new FormData();
formData.append("number", "1");
formData.append("capacity", "6");

const result = await updateTable(tableId, formData);
// Returns: { success: boolean, data?: Table, error?: string }
```

#### `deleteTable(id: string)`

Soft delete a table (sets is_active to false).

```typescript
const result = await deleteTable(tableId);
// Returns: { success: boolean, error?: string }
```

#### `updateTableStatus(id: string, status: TableStatus)`

Update table status.

```typescript
const result = await updateTableStatus(tableId, "occupied");
// Returns: { success: boolean, data?: Table, error?: string }
```

### QR Code Management

#### `generateTableQRCode(id: string)`

Generate a new QR code for a table.

```typescript
const result = await generateTableQRCode(tableId);
// Returns: { success: boolean, data?: Table, error?: string }
```

#### `downloadQRCode(tableId: string, tableNumber: string, restaurantId: string)`

Download QR code as PNG image.

```typescript
const result = await downloadQRCode(tableId, "1", restaurantId);
// Returns: { success: boolean, buffer?: Buffer, filename?: string, error?: string }
```

### Statistics

#### `getTableStats()`

Get table statistics for the current restaurant.

```typescript
const result = await getTableStats();
// Returns: {
//   success: boolean,
//   data?: {
//     total: number,
//     available: number,
//     occupied: number,
//     reserved: number,
//     unavailable: number,
//     totalCapacity: number
//   },
//   error?: string
// }
```

## UI Components

### Tables Dashboard (`/dashboard/tables`)

The main tables management interface includes:

1. **Header Section**
   - Page title and description
   - Refresh button with loading state
   - Add table button

2. **Statistics Cards**
   - Available tables count
   - Occupied tables count
   - Total tables count
   - Total seating capacity

3. **Filters & Search**
   - Search by table number
   - Filter by status
   - Filter by capacity
   - Clear filters button

4. **Tables Grid**
   - Responsive card layout
   - Table information display
   - Status badges with color coding
   - QR code placeholder
   - Action buttons (Edit, Get QR, Delete)

5. **Loading States**
   - Skeleton loading for initial load
   - Loading states for actions
   - Error handling with toast notifications

### Table Form Dialog

Modal dialog for creating/editing tables:

1. **Form Fields**
   - Table number (required)
   - Capacity (1-20 people, required)

2. **Validation**
   - Required field validation
   - Capacity range validation
   - Duplicate table number check

3. **Actions**
   - Submit button with loading state
   - Cancel button
   - Success/error feedback

## QR Code System

### QR Code Generation

QR codes are automatically generated for each table and contain:

- **URL Format**: `https://dineeasy.com/qr/{restaurantId}/{tableNumber}`
- **Content**: Direct link to table-specific ordering page
- **Format**: PNG image with customizable styling

### QR Code Features

1. **Automatic Generation**
   - Generated when table is created
   - Regenerated on demand
   - Stored in database

2. **Download Functionality**
   - Download as PNG file
   - Customizable filename
   - High-quality image output

3. **Styling Options**
   - Custom colors (dark/light)
   - Adjustable size
   - Error correction levels

## Integration Points

### Orders System

- Tables are linked to orders via `table_id`
- Table status updates based on order status
- Prevents deletion of tables with active orders

### Staff Management

- Role-based permissions for table management
- Staff can view/manage tables based on permissions
- Activity logging for all operations

### Restaurant Management

- Tables belong to specific restaurants
- Restaurant-specific QR codes
- Restaurant-specific statistics

## Security Features

### Row Level Security (RLS)

- Tables are protected by RLS policies
- Users can only access tables from their restaurants
- Staff access controlled by permissions

### Validation

- Input validation for all form fields
- Business logic validation (e.g., no duplicate table numbers)
- Capacity limits (1-20 people)

### Activity Logging

- All table operations are logged
- User tracking for audit trails
- Metadata storage for analytics

## Error Handling

### Common Errors

1. **Validation Errors**
   - Missing required fields
   - Invalid capacity values
   - Duplicate table numbers

2. **Permission Errors**
   - Insufficient permissions
   - Restaurant not found
   - Table not found

3. **Business Logic Errors**
   - Cannot delete table with active orders
   - Invalid status transitions

### Error Responses

All server actions return consistent error responses:

```typescript
{
  success: false,
  error: "Human-readable error message"
}
```

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- Efficient RLS policies
- Soft deletes to preserve data integrity

### UI Performance

- Lazy loading of table data
- Optimistic updates for better UX
- Debounced search functionality

### QR Code Generation

- Asynchronous QR code generation
- Caching of generated QR codes
- Efficient image processing

## Future Enhancements

### Planned Features

1. **Table Layout Management**
   - Visual table layout editor
   - Drag-and-drop table arrangement
   - Floor plan integration

2. **Advanced Analytics**
   - Table utilization metrics
   - Peak hour analysis
   - Revenue per table tracking

3. **Reservation Integration**
   - Table reservation system
   - Booking calendar integration
   - Waitlist management

4. **Real-time Updates**
   - WebSocket integration
   - Live status updates
   - Push notifications

5. **Bulk Operations**
   - Bulk table creation
   - Bulk status updates
   - Import/export functionality

### Technical Improvements

1. **Caching**
   - Redis caching for frequently accessed data
   - QR code image caching
   - Statistics caching

2. **Monitoring**
   - Performance monitoring
   - Error tracking
   - Usage analytics

3. **API Enhancements**
   - RESTful API endpoints
   - GraphQL integration
   - Webhook support

## Usage Examples

### Creating Tables

```typescript
// Create a new table
const formData = new FormData();
formData.append("number", "1");
formData.append("capacity", "4");

const result = await createTable(formData);
if (result.success) {
  console.log("Table created:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Updating Table Status

```typescript
// Mark table as occupied
const result = await updateTableStatus(tableId, "occupied");
if (result.success) {
  console.log("Status updated");
} else {
  console.error("Error:", result.error);
}
```

### Downloading QR Code

```typescript
// Download QR code for table
const result = await downloadQRCode(tableId, "1", restaurantId);
if (result.success && result.buffer) {
  // Handle file download
  const blob = new Blob([result.buffer], { type: "image/png" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

## Troubleshooting

### Common Issues

1. **Tables not loading**
   - Check authentication status
   - Verify restaurant ownership
   - Check RLS policies

2. **QR code generation fails**
   - Verify QR code library installation
   - Check storage permissions
   - Validate URL generation

3. **Permission errors**
   - Verify staff permissions
   - Check role assignments
   - Review RLS policies

### Debug Information

Enable debug logging for troubleshooting:

```typescript
// Enable debug mode
console.log("Tables data:", tables);
console.log("Stats data:", stats);
console.log("Error details:", error);
```

## Support

For technical support or feature requests:

1. Check the documentation
2. Review error logs
3. Contact the development team
4. Submit issues through the project repository

---

_This documentation covers the complete Tables Management System implementation in DineEasy._

# Storage Cleanup System

## Overview

The storage cleanup system automatically removes all storage objects (images, files) when a user is deleted from the `auth.users` table. This ensures that no orphaned files are left in the storage buckets, keeping the system clean and preventing unnecessary storage costs.

## How It Works

### Automatic Cleanup

1. **Database Trigger**: When a user is deleted from `auth.users`, a PostgreSQL trigger automatically fires
2. **Cleanup Function**: The `cleanup_user_storage()` function is executed
3. **File Removal**: All storage objects associated with the deleted user are removed from:
   - `avatars` bucket (user profile images)
   - `restaurant-images` bucket (restaurant logos and cover images)
   - `menu-images` bucket (menu item images)

### Storage Structure

Files are organized by user ID (restaurant ID) in the storage buckets:

```
avatars/
├── user-id-1/avatar.jpg
└── user-id-2/avatar.png

restaurant-images/
├── user-id-1/logo-restaurant-123.jpg
├── user-id-1/cover-restaurant-123.jpg
└── user-id-2/logo-cafe-456.png

menu-images/
├── user-id-1/menu-items/item-1.jpg
├── user-id-1/menu-items/item-2.png
└── user-id-2/menu-items/burger.jpg
```

## Database Functions

### `cleanup_user_storage()`

- **Purpose**: Automatically triggered when a user is deleted
- **Functionality**: Removes all storage objects for the deleted user
- **Trigger**: `AFTER DELETE ON auth.users`

### `manual_cleanup_user_storage(target_user_id UUID)`

- **Purpose**: Manual cleanup for testing or specific cases
- **Returns**: Summary of deleted files
- **Usage**: Can be called via RPC for manual cleanup

### `list_user_storage_objects(target_user_id UUID)`

- **Purpose**: List all storage objects for a user
- **Returns**: Table with bucket_id, object_name, file_size, created_at
- **Usage**: Useful for debugging and verification

## Server Actions

### `manualCleanupUserStorage(userId: string)`

- **Purpose**: Server action for manual cleanup
- **Returns**: `StorageCleanupResult` with success status and message

### `listUserStorageObjects(userId: string)`

- **Purpose**: Server action to list user's storage objects
- **Returns**: Array of `StorageObjectInfo`

### `getUserStorageStats(userId: string)`

- **Purpose**: Get storage usage statistics for a user
- **Returns**: Detailed stats including file counts and sizes per bucket

## Testing the System

### 1. List Current Storage Objects

```sql
SELECT * FROM list_user_storage_objects('user-uuid-here');
```

### 2. Manual Cleanup Test

```sql
SELECT manual_cleanup_user_storage('user-uuid-here');
```

### 3. Verify Cleanup

```sql
SELECT * FROM list_user_storage_objects('user-uuid-here');
-- Should return empty result
```

## Security Considerations

- **SECURITY DEFINER**: Functions run with elevated privileges to access storage
- **Owner-based Cleanup**: Only deletes files owned by the deleted user
- **Path-based Cleanup**: Deletes files with user ID in the path
- **Logging**: All cleanup operations are logged for audit purposes

## Error Handling

- **Graceful Degradation**: If cleanup fails, it logs the error but doesn't prevent user deletion
- **Partial Cleanup**: If some files can't be deleted, others will still be cleaned up
- **Manual Recovery**: Manual cleanup functions can be used to retry failed operations

## Monitoring

### Logs to Monitor

- `RAISE LOG 'Cleaning up storage for deleted user: %'`
- `RAISE LOG 'Storage cleanup completed for user: %'`
- `RAISE LOG 'Manual storage cleanup for user %: % files deleted'`

### Metrics to Track

- Number of files deleted per user
- Storage cleanup success rate
- Manual cleanup usage

## Migration Files

1. `20250729000010_cleanup_storage_on_user_delete.sql`
   - Creates automatic cleanup trigger and function

2. `20250729000011_manual_storage_cleanup_function.sql`
   - Creates manual cleanup and listing functions

## Usage Examples

### Manual Cleanup via Server Action

```typescript
import { manualCleanupUserStorage } from "@/lib/actions/storage-cleanup";

const result = await manualCleanupUserStorage("user-uuid-here");
if (result.success) {
  console.log(result.message);
} else {
  console.error(result.error);
}
```

### List Storage Objects

```typescript
import { listUserStorageObjects } from "@/lib/actions/storage-cleanup";

const result = await listUserStorageObjects("user-uuid-here");
if (result.success && result.data) {
  result.data.forEach((obj) => {
    console.log(
      `${obj.bucket_id}: ${obj.object_name} (${obj.file_size} bytes)`
    );
  });
}
```

### Get Storage Stats

```typescript
import { getUserStorageStats } from "@/lib/actions/storage-cleanup";

const result = await getUserStorageStats("user-uuid-here");
if (result.success && result.data) {
  console.log(`Total files: ${result.data.totalFiles}`);
  console.log(`Total size: ${result.data.totalSize} bytes`);
  console.log(`Menu images: ${result.data.buckets.menu_images.count} files`);
}
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure functions have proper SECURITY DEFINER privileges
2. **Missing Files**: Check if files exist before attempting cleanup
3. **Partial Cleanup**: Some files might be locked or in use

### Debugging Steps

1. List all storage objects for the user
2. Check database logs for cleanup errors
3. Verify trigger is properly installed
4. Test manual cleanup function

### Recovery

If automatic cleanup fails:

1. Use `manual_cleanup_user_storage()` to retry
2. Check logs for specific error messages
3. Verify storage bucket permissions
4. Contact support if issues persist

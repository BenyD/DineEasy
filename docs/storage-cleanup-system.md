# Storage Cleanup System

## Overview

The DineEasy platform includes an automated storage cleanup system that removes user files when accounts are deleted. This system prevents orphaned files from accumulating in storage buckets and helps maintain data hygiene.

## How It Works

1. **Trigger**: When a user is deleted from `auth.users`
2. **Cleanup Function**: The `cleanup_user_storage()` function is executed
3. **Storage Cleanup**: Removes files from all relevant storage buckets
4. **Logging**: All operations are logged for audit purposes

## Storage Buckets

The system cleans up files from the following buckets:

- **`avatars`**: User profile pictures
- **`restaurant-images`**: Restaurant logos and cover images
- **`menu-images`**: Menu item images

## Functions

### `cleanup_user_storage()`

**Purpose**: Automatically triggered when a user is deleted from `auth.users`

**What it does**:
- Deletes avatar files where `owner = user_id`
- Deletes restaurant images with path pattern `user_id/*`
- Deletes menu images with path pattern `user_id/*`

**Type Casting Fix**: 
- **Issue**: The `owner` field in `storage.objects` is of type `UUID`, but the function was comparing it with `TEXT`
- **Solution**: Cast `user_id` to `UUID` when comparing with the `owner` field: `owner = user_id::UUID`

### `manual_cleanup_user_storage(target_user_id UUID)`

**Purpose**: Manually clean up storage for a specific user

**Usage**:
```sql
SELECT manual_cleanup_user_storage('user-uuid-here');
```

**Returns**: A summary message with the number of files deleted

**Type Casting Fix**:
- Uses `UUID` directly for `owner` field comparison
- Converts to `TEXT` for path pattern matching

### `list_user_storage_objects(target_user_id UUID)`

**Purpose**: List all storage objects associated with a user (for debugging)

**Usage**:
```sql
SELECT * FROM list_user_storage_objects('user-uuid-here');
```

**Returns**: Table with bucket_id, object_name, file_size, and created_at

## Error Handling

### Common Issues

1. **Type Casting Errors**:
   - **Error**: `operator does not exist: uuid = text`
   - **Cause**: Comparing UUID fields with TEXT values
   - **Solution**: Use explicit type casting (`::UUID` or `::TEXT`)

2. **Permission Errors**:
   - **Error**: `permission denied for table storage.objects`
   - **Cause**: Function doesn't have proper permissions
   - **Solution**: Ensure `SECURITY DEFINER` and proper grants

3. **Missing User**:
   - **Warning**: `User does not exist in auth.users`
   - **Cause**: Trying to clean up storage for non-existent user
   - **Solution**: Check if user exists before cleanup

## Troubleshooting

### Check Storage Objects for a User

```sql
-- List all storage objects for a specific user
SELECT * FROM list_user_storage_objects('user-uuid-here');

-- Manual query to check storage objects
SELECT 
    bucket_id,
    name,
    owner,
    metadata->>'size' as file_size,
    created_at
FROM storage.objects 
WHERE owner = 'user-uuid-here'::UUID
   OR name LIKE 'user-uuid-here/%'
ORDER BY bucket_id, name;
```

### Manual Cleanup

If automatic cleanup fails:

1. Use `manual_cleanup_user_storage()` to retry
2. Check logs for specific error messages
3. Verify user exists in `auth.users`
4. Check storage bucket permissions

### Debug Function Execution

```sql
-- Enable detailed logging
SET log_statement = 'all';
SET log_min_messages = 'log';

-- Test manual cleanup
SELECT manual_cleanup_user_storage('user-uuid-here');

-- Check logs
SELECT * FROM pg_stat_activity WHERE query LIKE '%cleanup%';
```

## Recent Fixes

### Migration 20250729000018
- **Issue**: Type casting error in `cleanup_user_storage()`
- **Fix**: Added `user_id::UUID` cast for owner field comparison
- **Impact**: Resolves "operator does not exist: uuid = text" errors

### Migration 20250729000019
- **Issue**: Inconsistent type handling in manual functions
- **Fix**: Proper UUID/TEXT casting in all storage functions
- **Impact**: Ensures consistent behavior across all cleanup functions

## Best Practices

1. **Test Cleanup Functions**: Always test with a sample user before production
2. **Monitor Logs**: Check for cleanup errors in database logs
3. **Backup Important Data**: Ensure important files are backed up before cleanup
4. **Use Manual Functions**: For debugging, use manual functions instead of triggers
5. **Verify Permissions**: Ensure functions have proper `SECURITY DEFINER` and grants

## Security Considerations

- Functions use `SECURITY DEFINER` to run with elevated privileges
- Only authenticated users and service role can execute functions
- All operations are logged for audit purposes
- Functions only clean up files owned by the deleted user

## Performance Impact

- Cleanup operations are typically fast for most users
- Large numbers of files may take longer to process
- Operations are logged but don't block user deletion
- Consider batching for users with many files

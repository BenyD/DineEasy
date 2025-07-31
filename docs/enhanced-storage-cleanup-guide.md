# Enhanced Storage Cleanup System Guide

## Overview

The enhanced storage cleanup system automatically removes all storage files when a user is deleted from `auth.users` in Supabase. This prevents orphaned files from accumulating in storage buckets and helps maintain data hygiene.

## How It Works

### Automatic Cleanup
1. **Trigger**: When a user is deleted from `auth.users`
2. **Function**: `cleanup_user_storage()` is automatically executed
3. **Cleanup**: Removes files from all relevant storage buckets
4. **Logging**: All operations are logged for audit purposes

### Storage Buckets Covered

The system cleans up files from these buckets:

- **`avatars`**: User profile pictures (deleted by `owner` field)
- **`restaurant-images`**: Restaurant logos and cover images (deleted by path pattern)
- **`menu-images`**: Menu item images (deleted by path pattern)

## Functions

### 1. `cleanup_user_storage()` - Automatic Trigger Function

**Purpose**: Automatically triggered when a user is deleted from `auth.users`

**Features**:
- ✅ Handles all three storage buckets
- ✅ Proper error handling for each bucket
- ✅ Detailed logging of operations
- ✅ Type casting fixes for UUID comparisons
- ✅ Continues cleanup even if one bucket fails

**What it does**:
```sql
-- Deletes avatar files where owner = user_id
DELETE FROM storage.objects 
WHERE bucket_id = 'avatars' 
AND owner = user_id::UUID;

-- Deletes restaurant images with path pattern user_id/*
DELETE FROM storage.objects 
WHERE bucket_id = 'restaurant-images' 
AND name LIKE user_id || '/%';

-- Deletes menu images with path pattern user_id/*
DELETE FROM storage.objects 
WHERE bucket_id = 'menu-images' 
AND name LIKE user_id || '/%';
```

### 2. `manual_cleanup_user_storage(target_user_id UUID)` - Manual Cleanup

**Purpose**: Manually clean up storage for a specific user

**Usage**:
```sql
-- Clean up storage for a specific user
SELECT manual_cleanup_user_storage('user-uuid-here');

-- Example output:
-- "Deleted 5 storage objects for user 123e4567-e89b-12d3-a456-426614174000 (avatars: 1, restaurant: 2, menu: 2)"
```

**Features**:
- ✅ Safe to run multiple times
- ✅ Detailed error handling
- ✅ Returns summary of deleted files
- ✅ Logs all operations

### 3. `list_user_storage_objects(target_user_id UUID)` - List Files

**Purpose**: List all storage objects associated with a user (for debugging)

**Usage**:
```sql
-- List all storage objects for a user
SELECT * FROM list_user_storage_objects('user-uuid-here');
```

**Returns**:
- `bucket_id`: Storage bucket name
- `object_name`: File path/name
- `file_size`: File size in bytes
- `created_at`: File creation timestamp
- `owner`: File owner UUID

### 4. `check_storage_cleanup_status(target_user_id UUID)` - Status Check

**Purpose**: Check storage cleanup status for a user

**Usage**:
```sql
-- Check cleanup status
SELECT * FROM check_storage_cleanup_status('user-uuid-here');
```

**Returns**:
- `bucket_id`: Storage bucket name
- `file_count`: Number of files in bucket
- `total_size`: Total size of files in bytes
- `has_files`: Boolean indicating if bucket has files

## Testing the System

### 1. Test with a Sample User

```sql
-- Create a test user (if needed)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'test-user-123',
    'test@example.com',
    'encrypted_password_here',
    NOW(),
    NOW(),
    NOW()
);

-- Check if user has any storage objects
SELECT * FROM check_storage_cleanup_status('test-user-123');

-- List all storage objects for the user
SELECT * FROM list_user_storage_objects('test-user-123');

-- Test manual cleanup
SELECT manual_cleanup_user_storage('test-user-123');

-- Verify cleanup worked
SELECT * FROM check_storage_cleanup_status('test-user-123');
```

### 2. Test Automatic Cleanup

```sql
-- Delete the test user (this will trigger automatic cleanup)
DELETE FROM auth.users WHERE id = 'test-user-123';

-- Check logs for cleanup messages
-- (You can view logs in Supabase dashboard or via CLI)
```

### 3. Test with Real Data

```sql
-- Find a user with storage objects
SELECT 
    u.id,
    u.email,
    COUNT(so.id) as file_count
FROM auth.users u
LEFT JOIN storage.objects so ON (
    so.owner = u.id::UUID OR 
    so.name LIKE u.id || '/%'
)
GROUP BY u.id, u.email
HAVING COUNT(so.id) > 0
LIMIT 1;

-- Use the returned user ID to test cleanup
SELECT manual_cleanup_user_storage('actual-user-id-here');
```

## Troubleshooting

### Common Issues

#### 1. Type Casting Errors
**Error**: `operator does not exist: uuid = text`
**Solution**: The function now properly casts types:
```sql
-- For owner field (UUID)
AND owner = user_id::UUID

-- For path patterns (TEXT)
AND name LIKE user_id || '/%'
```

#### 2. Permission Errors
**Error**: `permission denied for table storage.objects`
**Solution**: Functions use `SECURITY DEFINER` and proper grants:
```sql
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO service_role;
```

#### 3. Missing User
**Warning**: `User does not exist in auth.users`
**Solution**: This is expected when cleaning up storage for deleted users

### Debugging Steps

#### 1. Check Function Exists
```sql
-- Verify function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%cleanup%';
```

#### 2. Check Trigger Exists
```sql
-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'cleanup_storage_on_user_delete';
```

#### 3. Check Storage Objects
```sql
-- List all storage objects for debugging
SELECT 
    bucket_id,
    name,
    owner,
    metadata->>'size' as file_size,
    created_at
FROM storage.objects 
ORDER BY bucket_id, name;
```

#### 4. Enable Detailed Logging
```sql
-- Enable detailed logging (temporary)
SET log_statement = 'all';
SET log_min_messages = 'log';

-- Test cleanup function
SELECT manual_cleanup_user_storage('test-user-id');

-- Check logs
SELECT * FROM pg_stat_activity WHERE query LIKE '%cleanup%';
```

## Best Practices

### 1. Testing
- Always test with a sample user before production
- Use manual functions for testing instead of triggers
- Verify cleanup worked by checking storage status

### 2. Monitoring
- Monitor database logs for cleanup errors
- Set up alerts for failed cleanup operations
- Regularly check for orphaned files

### 3. Backup
- Ensure important files are backed up before cleanup
- Consider implementing a "soft delete" option for critical data
- Test cleanup procedures in staging environment

### 4. Performance
- Cleanup operations are typically fast for most users
- Large numbers of files may take longer to process
- Operations are logged but don't block user deletion

## Security Considerations

- ✅ Functions use `SECURITY DEFINER` to run with elevated privileges
- ✅ Only authenticated users and service role can execute functions
- ✅ All operations are logged for audit purposes
- ✅ Functions only clean up files owned by the deleted user
- ✅ Proper error handling prevents information leakage

## Migration History

### Migration 20250729000020
- **Enhancement**: Improved error handling and logging
- **Feature**: Added comprehensive bucket coverage
- **Fix**: Proper type casting for UUID comparisons
- **Addition**: New utility functions for debugging and status checking

### Previous Migrations
- **20250729000010**: Initial storage cleanup implementation
- **20250729000011**: Manual cleanup functions
- **20250729000018**: Type casting fixes
- **20250729000019**: Enhanced manual functions

## Example Usage Scenarios

### Scenario 1: User Deletes Account
1. User requests account deletion
2. Admin deletes user from `auth.users`
3. Trigger automatically fires `cleanup_user_storage()`
4. All user files are removed from storage
5. Logs show cleanup completion

### Scenario 2: Manual Cleanup Needed
1. Discover orphaned files in storage
2. Identify user ID from file paths
3. Run `manual_cleanup_user_storage(user_id)`
4. Verify cleanup with `check_storage_cleanup_status(user_id)`

### Scenario 3: Debugging Storage Issues
1. User reports missing files
2. Check `list_user_storage_objects(user_id)`
3. Verify file ownership and paths
4. Use `check_storage_cleanup_status(user_id)` for overview

This enhanced system ensures that your storage buckets remain clean and organized, preventing the accumulation of orphaned files when users are deleted from your application. 
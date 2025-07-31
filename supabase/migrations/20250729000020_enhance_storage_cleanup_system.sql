-- Enhanced storage cleanup system with better error handling and comprehensive bucket coverage
-- This migration improves the existing storage cleanup functions and adds new utility functions

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS cleanup_user_storage() CASCADE;
DROP FUNCTION IF EXISTS manual_cleanup_user_storage(UUID) CASCADE;
DROP FUNCTION IF EXISTS list_user_storage_objects(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_storage_cleanup_status(UUID) CASCADE;

-- Enhanced storage cleanup function that handles all buckets and includes better error handling
CREATE OR REPLACE FUNCTION cleanup_user_storage()
RETURNS TRIGGER AS $$
DECLARE
    user_id TEXT;
    deleted_count INTEGER := 0;
    avatars_deleted INTEGER := 0;
    restaurant_images_deleted INTEGER := 0;
    menu_images_deleted INTEGER := 0;
    error_message TEXT;
BEGIN
    -- Get the deleted user's ID
    user_id := OLD.id;
    
    -- Log the cleanup operation
    RAISE LOG 'Starting storage cleanup for deleted user: %', user_id;
    
    BEGIN
        -- Delete from avatars bucket (where owner = user_id)
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' 
        AND owner = user_id::UUID;
        GET DIAGNOSTICS avatars_deleted = ROW_COUNT;
        
        RAISE LOG 'Deleted % avatar files for user %', avatars_deleted, user_id;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting avatars: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    BEGIN
        -- Delete from restaurant-images bucket (files with user_id in path)
        DELETE FROM storage.objects 
        WHERE bucket_id = 'restaurant-images' 
        AND name LIKE user_id || '/%';
        GET DIAGNOSTICS restaurant_images_deleted = ROW_COUNT;
        
        RAISE LOG 'Deleted % restaurant image files for user %', restaurant_images_deleted, user_id;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting restaurant images: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    BEGIN
        -- Delete from menu-images bucket (files with user_id in path)
        DELETE FROM storage.objects 
        WHERE bucket_id = 'menu-images' 
        AND name LIKE user_id || '/%';
        GET DIAGNOSTICS menu_images_deleted = ROW_COUNT;
        
        RAISE LOG 'Deleted % menu image files for user %', menu_images_deleted, user_id;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting menu images: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    -- Calculate total deleted files
    deleted_count := avatars_deleted + restaurant_images_deleted + menu_images_deleted;
    
    RAISE LOG 'Storage cleanup completed for user %: % total files deleted (avatars: %, restaurant: %, menu: %)', 
        user_id, deleted_count, avatars_deleted, restaurant_images_deleted, menu_images_deleted;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS cleanup_storage_on_user_delete ON auth.users;
CREATE TRIGGER cleanup_storage_on_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_storage();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_user_storage() IS 'Enhanced function that automatically cleans up all storage objects (avatars, restaurant images, menu images) when a user is deleted from auth.users. Includes error handling and detailed logging.';

-- Enhanced manual cleanup function with better error handling
CREATE OR REPLACE FUNCTION manual_cleanup_user_storage(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    avatars_deleted INTEGER := 0;
    restaurant_images_deleted INTEGER := 0;
    menu_images_deleted INTEGER := 0;
    error_message TEXT;
    result_message TEXT;
BEGIN
    -- Check if user exists (optional check)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE WARNING 'User % does not exist in auth.users', target_user_id;
    END IF;
    
    BEGIN
        -- Delete from avatars bucket
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' 
        AND owner = target_user_id::UUID;
        GET DIAGNOSTICS avatars_deleted = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting avatars: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    BEGIN
        -- Delete from restaurant-images bucket
        DELETE FROM storage.objects 
        WHERE bucket_id = 'restaurant-images' 
        AND name LIKE target_user_id::TEXT || '/%';
        GET DIAGNOSTICS restaurant_images_deleted = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting restaurant images: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    BEGIN
        -- Delete from menu-images bucket
        DELETE FROM storage.objects 
        WHERE bucket_id = 'menu-images' 
        AND name LIKE target_user_id::TEXT || '/%';
        GET DIAGNOSTICS menu_images_deleted = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        error_message := 'Error deleting menu images: ' || SQLERRM;
        RAISE LOG '%', error_message;
    END;
    
    deleted_count := avatars_deleted + restaurant_images_deleted + menu_images_deleted;
    
    result_message := 'Deleted ' || deleted_count || ' storage objects for user ' || target_user_id || 
                     ' (avatars: ' || avatars_deleted || ', restaurant: ' || restaurant_images_deleted || 
                     ', menu: ' || menu_images_deleted || ')';
    
    RAISE LOG 'Manual storage cleanup: %', result_message;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to list storage objects for a user
CREATE OR REPLACE FUNCTION list_user_storage_objects(target_user_id UUID)
RETURNS TABLE(
    bucket_id TEXT,
    object_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ,
    owner UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id,
        so.name as object_name,
        COALESCE((so.metadata->>'size')::BIGINT, 0) as file_size,
        so.created_at,
        so.owner
    FROM storage.objects so
    WHERE (so.owner = target_user_id)
       OR (so.name LIKE target_user_id::TEXT || '/%')
    ORDER BY so.bucket_id, so.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check storage cleanup status
CREATE OR REPLACE FUNCTION check_storage_cleanup_status(target_user_id UUID)
RETURNS TABLE(
    bucket_id TEXT,
    file_count BIGINT,
    total_size BIGINT,
    has_files BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id,
        COUNT(*) as file_count,
        COALESCE(SUM((so.metadata->>'size')::BIGINT), 0) as total_size,
        COUNT(*) > 0 as has_files
    FROM storage.objects so
    WHERE (so.owner = target_user_id)
       OR (so.name LIKE target_user_id::TEXT || '/%')
    GROUP BY so.bucket_id
    ORDER BY so.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_storage_cleanup_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_storage_cleanup_status(UUID) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION manual_cleanup_user_storage(UUID) IS 'Enhanced manual cleanup function with better error handling. Returns a detailed summary of deleted files.';
COMMENT ON FUNCTION list_user_storage_objects(UUID) IS 'Enhanced function to list all storage objects associated with a specific user for debugging purposes.';
COMMENT ON FUNCTION check_storage_cleanup_status(UUID) IS 'Check storage cleanup status for a user, showing file counts and sizes per bucket.'; 
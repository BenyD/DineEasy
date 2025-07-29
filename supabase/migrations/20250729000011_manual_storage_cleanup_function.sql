-- Manual function to clean up storage for a specific user
-- This can be called manually for testing or cleanup purposes
CREATE OR REPLACE FUNCTION manual_cleanup_user_storage(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    avatars_deleted INTEGER := 0;
    restaurant_images_deleted INTEGER := 0;
    menu_images_deleted INTEGER := 0;
BEGIN
    -- Check if user exists (optional check)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE WARNING 'User % does not exist in auth.users', target_user_id;
    END IF;
    
    -- Delete from avatars bucket
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
    AND owner = target_user_id::TEXT;
    GET DIAGNOSTICS avatars_deleted = ROW_COUNT;
    
    -- Delete from restaurant-images bucket
    DELETE FROM storage.objects 
    WHERE bucket_id = 'restaurant-images' 
    AND name LIKE target_user_id::TEXT || '/%';
    GET DIAGNOSTICS restaurant_images_deleted = ROW_COUNT;
    
    -- Delete from menu-images bucket
    DELETE FROM storage.objects 
    WHERE bucket_id = 'menu-images' 
    AND name LIKE target_user_id::TEXT || '/%';
    GET DIAGNOSTICS menu_images_deleted = ROW_COUNT;
    
    deleted_count := avatars_deleted + restaurant_images_deleted + menu_images_deleted;
    
    RAISE LOG 'Manual storage cleanup for user %: % files deleted (avatars: %, restaurant: %, menu: %)', 
        target_user_id, deleted_count, avatars_deleted, restaurant_images_deleted, menu_images_deleted;
    
    RETURN 'Deleted ' || deleted_count || ' storage objects for user ' || target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION manual_cleanup_user_storage(UUID) IS 'Manually clean up all storage objects for a specific user. Returns a summary of deleted files.';

-- Function to list storage objects for a user (useful for debugging)
CREATE OR REPLACE FUNCTION list_user_storage_objects(target_user_id UUID)
RETURNS TABLE(
    bucket_id TEXT,
    object_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id,
        so.name as object_name,
        so.metadata->>'size'::BIGINT as file_size,
        so.created_at
    FROM storage.objects so
    WHERE (so.owner = target_user_id::TEXT)
       OR (so.name LIKE target_user_id::TEXT || '/%')
    ORDER BY so.bucket_id, so.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION list_user_storage_objects(UUID) IS 'List all storage objects associated with a specific user for debugging purposes.';
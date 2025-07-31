-- Fix type casting issues in manual storage cleanup functions
-- Ensure consistent type handling across all storage cleanup functions

CREATE OR REPLACE FUNCTION manual_cleanup_user_storage(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER := 0;
    avatars_deleted INTEGER := 0;
    restaurant_images_deleted INTEGER := 0;
    menu_images_deleted INTEGER := 0;
    user_id_text TEXT;
BEGIN
    -- Convert UUID to TEXT for consistent handling
    user_id_text := target_user_id::TEXT;
    
    -- Check if user exists (optional check)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE WARNING 'User % does not exist in auth.users', target_user_id;
    END IF;
    
    -- Delete from avatars bucket
    -- Fix: Use the UUID directly since owner field expects UUID
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
    AND owner = target_user_id;
    GET DIAGNOSTICS avatars_deleted = ROW_COUNT;
    
    -- Delete from restaurant-images bucket
    -- Use TEXT for path matching
    DELETE FROM storage.objects 
    WHERE bucket_id = 'restaurant-images' 
    AND name LIKE user_id_text || '/%';
    GET DIAGNOSTICS restaurant_images_deleted = ROW_COUNT;
    
    -- Delete from menu-images bucket
    -- Use TEXT for path matching
    DELETE FROM storage.objects 
    WHERE bucket_id = 'menu-images' 
    AND name LIKE user_id_text || '/%';
    GET DIAGNOSTICS menu_images_deleted = ROW_COUNT;
    
    deleted_count := avatars_deleted + restaurant_images_deleted + menu_images_deleted;
    
    RAISE LOG 'Manual storage cleanup for user %: % files deleted (avatars: %, restaurant: %, menu: %)', 
        target_user_id, deleted_count, avatars_deleted, restaurant_images_deleted, menu_images_deleted;
    
    RETURN 'Deleted ' || deleted_count || ' storage objects for user ' || target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the list function to handle type casting properly
CREATE OR REPLACE FUNCTION list_user_storage_objects(target_user_id UUID)
RETURNS TABLE(
    bucket_id TEXT,
    object_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    user_id_text TEXT;
BEGIN
    user_id_text := target_user_id::TEXT;
    
    RETURN QUERY
    SELECT 
        so.bucket_id,
        so.name as object_name,
        so.metadata->>'size'::BIGINT as file_size,
        so.created_at
    FROM storage.objects so
    WHERE (so.owner = target_user_id)
       OR (so.name LIKE user_id_text || '/%')
    ORDER BY so.bucket_id, so.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_user_storage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION list_user_storage_objects(UUID) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION manual_cleanup_user_storage(UUID) IS 'Manually clean up all storage objects for a specific user. Returns a summary of deleted files. Fixed type casting issues.';
COMMENT ON FUNCTION list_user_storage_objects(UUID) IS 'List all storage objects associated with a specific user for debugging purposes. Fixed type casting issues.'; 
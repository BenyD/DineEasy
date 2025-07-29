-- Function to clean up storage objects when a user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_storage()
RETURNS TRIGGER AS $$
DECLARE
    user_id TEXT;
    storage_path TEXT;
BEGIN
    -- Get the deleted user's ID
    user_id := OLD.id;
    
    -- Log the cleanup operation
    RAISE LOG 'Cleaning up storage for deleted user: %', user_id;
    
    -- Delete all storage objects owned by this user
    -- This will automatically clean up files in all buckets where the user is the owner
    
    -- Delete from avatars bucket
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
    AND owner = user_id;
    
    -- Delete from restaurant-images bucket (files with user_id in path)
    DELETE FROM storage.objects 
    WHERE bucket_id = 'restaurant-images' 
    AND name LIKE user_id || '/%';
    
    -- Delete from menu-images bucket (files with user_id in path)
    DELETE FROM storage.objects 
    WHERE bucket_id = 'menu-images' 
    AND name LIKE user_id || '/%';
    
    RAISE LOG 'Storage cleanup completed for user: %', user_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up storage when a user is deleted
DROP TRIGGER IF EXISTS cleanup_storage_on_user_delete ON auth.users;
CREATE TRIGGER cleanup_storage_on_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_storage();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_storage() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_user_storage() IS 'Automatically cleans up all storage objects (avatars, restaurant images, menu images) when a user is deleted from auth.users';
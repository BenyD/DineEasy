# Unified Image Upload System

## Overview

This document outlines the unified image upload system for DineEasy, ensuring consistent patterns across all image uploads, edits, and deletions.

## Storage Buckets

### 1. `avatars` - User Profile Images

- **Path Structure**: `{userId}/{userId}-{timestamp}.{extension}`
- **Example**: `2ae1c447-bb5a-4daa-9156-24e65e93c214/2ae1c447-bb5a-4daa-9156-24e65e93c214-1752993784385.jpg`
- **RLS Policy**: User ID based ownership
- **Usage**: User profile pictures

### 2. `restaurant-images` - Restaurant Logo & Cover Photos

- **Path Structure**: `{restaurantId}/{imageType}-{slug}-{timestamp}.{extension}`
- **Example**: `99f7e7f4-3f74-48b5-b375-18f005967482/logo-bistro-cafe-1752993784385.jpg`
- **RLS Policy**: Restaurant ownership based
- **Usage**: Restaurant logos and cover photos

### 3. `menu-images` - Menu Item Images

- **Path Structure**: `{restaurantId}/menu-items/{timestamp}.{extension}`
- **Example**: `99f7e7f4-3f74-48b5-b375-18f005967482/menu-items/1752993784385.jpg`
- **RLS Policy**: Restaurant ownership based
- **Usage**: Menu item photos

## Upload Functions

### 1. Avatar Uploads

```typescript
// Function: uploadImage(file, "avatar")
// Path: {userId}/{userId}-{timestamp}.{extension}
// Bucket: avatars
```

### 2. Restaurant Image Uploads

```typescript
// Function: uploadRestaurantImageDirect(supabase, file, restaurantId, type, slug)
// Path: {restaurantId}/{imageType}-{slug}-{timestamp}.{extension}
// Bucket: restaurant-images
// Types: "logo" | "cover"
```

### 3. Menu Item Uploads

```typescript
// Function: uploadImage(file, "menu-item")
// Path: {restaurantId}/menu-items/{timestamp}.{extension}
// Bucket: menu-images
```

## RLS Policies

### Avatar Images (`avatars` bucket)

```sql
-- Public can view
create policy "Public can view avatar images"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Users can upload/update/delete their own
create policy "Users can upload avatar images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Restaurant Images (`restaurant-images` bucket)

```sql
-- Public can view
create policy "Public can view restaurant images"
  on storage.objects for select to public
  using (bucket_id = 'restaurant-images');

-- Restaurant owners can upload/update/delete
create policy "Restaurant owners can upload restaurant images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'restaurant-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  );
```

### Menu Images (`menu-images` bucket)

```sql
-- Public can view
create policy "Public can view menu images"
  on storage.objects for select to public
  using (bucket_id = 'menu-images');

-- Restaurant owners can upload/update/delete
create policy "Restaurant owners can upload menu images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from restaurants r
      where r.id::text = (storage.foldername(name))[1]
      and r.owner_id = auth.uid()
    )
  );
```

## File Validation

### Size Limits

- **Avatar**: 1MB
- **Restaurant Images**: 1MB
- **Menu Images**: 1MB

### Allowed Types

- **Extensions**: jpg, jpeg, png, webp
- **MIME Types**: image/jpeg, image/png, image/webp

## Usage Examples

### Setup Page (Restaurant Creation)

```typescript
// Uses uploadRestaurantImageDirect with restaurant ID
const logo_url = await uploadRestaurantImageDirect(
  supabase,
  logo,
  createdRestaurant.id, // restaurant ID
  "logo",
  slug
);
```

### Restaurant Settings Page

```typescript
// Uses updateRestaurantImages with restaurant ID path
const filePath = `${restaurant.id}/logo-${cleanSlug}-${timestamp}.${fileExtension}`;
```

### Menu Items Page

```typescript
// Uses uploadImage with menu-item type
const result = await uploadImage(file, "menu-item");
```

## Error Handling

### Common Issues

1. **RLS Policy Violations**: Ensure path structure matches policy expectations
2. **File Size Exceeded**: Check file size before upload
3. **Invalid File Type**: Validate MIME type and extension
4. **Missing Restaurant**: Ensure restaurant exists before uploading images

### Debugging

- Check console logs for upload paths
- Verify RLS policy matches path structure
- Ensure restaurant ownership is correct
- Validate file metadata before upload

## Migration Notes

### Before (Inconsistent)

- Setup page: `{restaurantId}/...`
- Settings page: `{userId}/...`
- Menu items: `{restaurantId}/...`

### After (Unified)

- Setup page: `{restaurantId}/...`
- Settings page: `{restaurantId}/...`
- Menu items: `{restaurantId}/...`

All restaurant-related images now use restaurant ID as the first folder, ensuring consistent RLS policy enforcement.

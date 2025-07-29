# Avatar Storage Setup Guide

This guide explains how to set up the avatar storage bucket for the Profile feature.

## Bucket Configuration

- **Name**: `avatars`
- **Public**: ✅ Yes (for public read access)
- **File size limit**: `1MB` (1,048,576 bytes)
- **Allowed image types**:
  - `image/jpeg` (JPG/JPEG)
  - `image/png` (PNG)
  - `image/webp` (WebP)

## Option 1: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Checked
   - **File size limit**: `1048576` (1MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
5. Click **Create bucket**

## Option 2: Using Supabase CLI

1. Create the bucket using the CLI:

   ```bash
   supabase storage create avatars --public --file-size-limit 1048576 --allowed-mime-types "image/jpeg,image/png,image/webp"
   ```

2. Run the database migration:
   ```bash
   npx supabase db push
   ```

## Verification

After setup, you can verify the bucket was created correctly by:

1. Going to the Supabase dashboard → Storage
2. You should see an `avatars` bucket listed
3. The bucket should be marked as public
4. Check that the storage policies were created by going to the **Policies** tab

## Storage Policies

The migration will create the following policies:

- **Avatar images are publicly accessible**: Allows public read access to avatar images
- **Users can upload their own avatar**: Allows authenticated users to upload avatars to their own folder
- **Users can update their own avatar**: Allows users to update their existing avatars
- **Users can delete their own avatar**: Allows users to delete their avatars

## File Structure

Avatars are stored in the following structure:

```
avatars/
├── user-id-1/
│   ├── user-id-1-timestamp.jpg
│   └── user-id-1-timestamp.png
└── user-id-2/
    └── user-id-2-timestamp.webp
```

## Image Requirements

- **Maximum file size**: 1MB
- **Supported formats**: JPEG, PNG, WebP
- **Recommended dimensions**: 400x400 pixels (square)
- **Recommended aspect ratio**: 1:1 (square)

## Troubleshooting

### Error: "must be owner of table buckets"

This error occurs when trying to create storage buckets via SQL migrations. Storage buckets must be created through the dashboard, CLI, or API.

### Error: "Bucket not found"

Make sure the `avatars` bucket exists before running the migration. The migration will only create policies if the bucket exists.

### Error: "Permission denied"

Ensure you're using the service role key (not the anon key) for bucket creation.

### Error: "File too large"

Avatar files must be 1MB or smaller. Consider compressing the image or using a smaller file.

### Error: "Invalid file type"

Only JPEG, PNG, and WebP images are allowed. Convert your image to one of these formats.

## Testing

Once setup is complete, you can test the avatar functionality:

1. Go to the dashboard settings
2. Click on the **Profile** tab
3. Try uploading an image file (JPEG, PNG, or WebP, max 1MB)
4. Verify the image appears in the preview
5. Save the changes and check that the avatar appears in the sidebar

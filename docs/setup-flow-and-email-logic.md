# Setup Flow and Email Logic Documentation

## Overview

This document explains the DineEasy setup flow, email logic, validation requirements, and image upload handling.

## Email Logic

### Two Email Addresses System

DineEasy uses **two distinct email addresses** for different purposes:

#### 1. **Signup Email** (Personal Email)

- **Purpose**: User authentication and account management
- **Used for**:
  - Account creation and login
  - Email verification
  - Password resets
  - Platform notifications
  - Admin communications
- **Location**: `/signup` page
- **Storage**: `auth.users.email` (Supabase Auth)
- **Example**: `john.doe@gmail.com`

#### 2. **Business Email** (Restaurant Email)

- **Purpose**: Business operations and customer communications
- **Used for**:
  - Customer receipts and invoices
  - Business notifications
  - Stripe Connect account
  - Customer support
  - Order confirmations
- **Location**: `/setup` page (Step 2)
- **Storage**: `restaurants.email`
- **Example**: `orders@starbucks.com`

### Why Two Emails?

1. **Security**: Personal email for sensitive account operations
2. **Business Operations**: Dedicated business email for customer-facing communications
3. **Compliance**: Stripe Connect requires business email for payment processing
4. **Professionalism**: Customers see business email on receipts and communications

## Setup Flow Validation

### Step 1: Basic Information (Required Fields)

- ✅ **Restaurant Name** - Required, trimmed validation
- ✅ **Restaurant Type** - Required, must be selected from dropdown
- ✅ **Currency** - Required, auto-selected based on country
- ✅ **Tax Rate** - Required, must be >= 0

### Step 2: Contact & Images (Required Fields)

- ✅ **Business Email** - Required, email format validation
- ⚪ **Phone Number** - Optional, but validated if provided
- ⚪ **Website** - Optional, but validated if provided
- ⚪ **Logo** - Optional, 2MB max, image format validation
- ⚪ **Cover Photo** - Optional, 5MB max, image format validation

### Step 3: Location & Services (Required Fields)

- ✅ **Street Address** - Required, trimmed validation
- ✅ **City** - Required, trimmed validation
- ✅ **Postal Code** - Required, trimmed validation
- ✅ **Country** - Required, must be selected from dropdown

### Validation Rules

#### Email Validation

```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

#### Phone Validation

```javascript
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
```

#### Website Validation

```javascript
new URL(website.startsWith("http") ? website : `https://${website}`);
```

#### Image Validation

- **Logo**: 2MB max, JPEG/PNG/GIF/WebP
- **Cover Photo**: 5MB max, JPEG/PNG/GIF/WebP
- File type validation
- File size validation
- Corrupted file detection

## Image Upload System

### Supabase Storage Configuration

- **Bucket**: `restaurant-images`
- **Public Access**: Yes (for customer viewing)
- **File Size Limit**: 5MB
- **Allowed Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### File Structure

```
restaurant-images/
├── {user_id}/
│   ├── logo-{restaurant-slug}-{timestamp}.{ext}
│   └── cover-{restaurant-slug}-{timestamp}.{ext}
```

### Upload Process

1. **Validation**: File type, size, and corruption check
2. **Filename Generation**: Clean slug + timestamp + extension
3. **Upload**: Supabase storage with proper content type
4. **Public URL**: Generated for frontend display
5. **Error Handling**: Comprehensive error messages and cleanup

### Error Handling

- **Bucket Not Configured**: "Storage bucket not configured. Please contact support."
- **Permission Denied**: "Permission denied. Please try again."
- **Duplicate File**: "File already exists. Please choose a different image."
- **Upload Failure**: Specific error messages with context

## Setup Flow Steps

### 1. Authentication Check

- Verify user is logged in
- Check onboarding status
- Redirect if already completed

### 2. Step-by-Step Validation

- **Real-time validation** on field changes
- **Step-specific validation** before proceeding
- **Comprehensive validation** before final submission

### 3. Data Processing

- Form data collection
- Image upload handling
- Stripe customer creation
- Restaurant record creation
- Error handling and rollback

### 4. Success Flow

- Success message
- Redirect to plan selection
- Database updates completed

## Error Handling

### Validation Errors

- **Field-specific errors** with clear messages
- **Step-specific validation** prevents progression
- **Comprehensive error summary** on final submission

### Upload Errors

- **File validation errors** before upload
- **Storage errors** with specific messages
- **Cleanup on partial failures**

### Database Errors

- **Restaurant creation failures**
- **Image cleanup** on database errors
- **User-friendly error messages**

## Security Considerations

### File Upload Security

- **File type validation** prevents malicious uploads
- **File size limits** prevent abuse
- **Content type enforcement** ensures proper handling
- **User isolation** via user_id in file paths

### Email Security

- **Personal email** for sensitive operations
- **Business email** for customer communications
- **Email format validation** prevents injection
- **Separate storage** for different purposes

### Data Validation

- **Input sanitization** on all fields
- **SQL injection prevention** via parameterized queries
- **XSS prevention** via proper escaping
- **CSRF protection** via form tokens

## Testing Checklist

### Setup Flow Testing

- [ ] All required fields validation
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Website URL validation
- [ ] Image upload validation
- [ ] Step progression validation
- [ ] Error message display
- [ ] Success flow completion

### Image Upload Testing

- [ ] Valid image uploads
- [ ] Invalid file type rejection
- [ ] File size limit enforcement
- [ ] Corrupted file detection
- [ ] Upload error handling
- [ ] Cleanup on failures
- [ ] Public URL generation

### Email Logic Testing

- [ ] Signup email creation
- [ ] Business email validation
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Receipt email sending
- [ ] Invoice email sending

## Troubleshooting

### Common Issues

#### Image Upload Failures

1. **Check Supabase storage bucket** exists and is configured
2. **Verify RLS policies** allow authenticated uploads
3. **Check file permissions** and size limits
4. **Review browser console** for detailed errors

#### Email Validation Issues

1. **Verify email format** using regex
2. **Check for special characters** in email addresses
3. **Ensure proper encoding** in form submissions
4. **Review email service** configuration

#### Setup Flow Issues

1. **Check authentication status** before setup
2. **Verify onboarding status** routing
3. **Review form validation** logic
4. **Check database constraints** and triggers

### Debug Information

- **Console logging** for upload processes
- **Error tracking** with detailed messages
- **Validation feedback** for user guidance
- **Step progression** monitoring

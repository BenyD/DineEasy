# Newsletter Subscription System

## Overview

The DineEasy newsletter subscription system allows users to subscribe to marketing communications and provides a complete infrastructure for managing newsletter campaigns. The system includes database storage, email functionality using Resend, and both user-facing and admin interfaces.

## Database Schema

### `newsletter_subscriptions` Table

```sql
CREATE TABLE newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_source TEXT DEFAULT 'website',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE
);
```

**Columns:**

- `id`: Unique identifier for the subscription
- `email`: Email address (unique constraint)
- `first_name`: Optional first name
- `last_name`: Optional last name
- `is_active`: Whether the subscription is currently active
- `subscription_source`: Source of subscription (website, admin, etc.)
- `preferences`: JSON object for subscriber preferences
- `created_at`: When the subscription was created
- `updated_at`: When the subscription was last updated
- `unsubscribed_at`: When the user unsubscribed (if applicable)
- `last_email_sent_at`: Timestamp of last newsletter sent

### Database Functions

#### `subscribe_to_newsletter(email, first_name, last_name, source)`

- Handles new subscriptions and reactivation of existing ones
- Returns JSON with success status and action taken

#### `unsubscribe_from_newsletter(email)`

- Marks a subscription as inactive
- Sets `unsubscribed_at` timestamp
- Returns JSON with success status

#### `get_active_newsletter_subscribers()`

- Returns all active subscribers for newsletter sending
- Used by admin panel and API

## Row Level Security (RLS)

The system implements proper RLS policies:

- **Public Insert**: Anyone can subscribe
- **User Access**: Users can view/update their own subscription
- **Service Role**: Full access for admin operations

## Frontend Components

### NewsletterSubscription Component

Located at `components/elements/NewsletterSubscription.tsx`

**Features:**

- Email validation
- Loading states
- Success/error feedback
- Configurable variants (default/compact)
- Customizable messages

**Usage:**

```tsx
<NewsletterSubscription
  variant="default"
  placeholder="Enter your email"
  buttonText="Subscribe"
  successMessage="Successfully subscribed!"
  errorMessage="Failed to subscribe"
/>
```

### Unsubscribe Page

Located at `app/(website)/unsubscribe/page.tsx`

**Features:**

- Dedicated unsubscribe form
- Email validation
- User-friendly messaging
- Link back to homepage

## Admin Panel Integration

### Direct Database Access (Recommended)

Since you're building a separate Next.js admin panel, use direct Supabase client access instead of API routes:

#### Setup in Admin Project

```typescript
// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);
```

#### List Subscriptions

```typescript
// Get all subscriptions with pagination
const { data, error, count } = await supabaseAdmin
  .from("newsletter_subscriptions")
  .select("*", { count: "exact" })
  .eq("is_active", true) // Filter by status
  .order("created_at", { ascending: false })
  .range(offset, offset + limit - 1);
```

#### Send Newsletter

```typescript
// Get active subscribers
const { data: subscribers } = await supabaseAdmin.rpc(
  "get_active_newsletter_subscribers"
);

// Send emails using Resend
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

for (const subscriber of subscribers) {
  const personalizedContent = content
    .replace(/\{firstName\}/g, subscriber.first_name || "there")
    .replace(/\{lastName\}/g, subscriber.last_name || "")
    .replace(/\{email\}/g, subscriber.email);

  await resend.emails.send({
    from: "DineEasy <noreply@dineeasy.ch>",
    to: subscriber.email,
    subject: subject,
    html: personalizedContent,
  });

  // Update last_email_sent_at
  await supabaseAdmin
    .from("newsletter_subscriptions")
    .update({ last_email_sent_at: new Date().toISOString() })
    .eq("id", subscriber.id);
}
```

#### Update Subscription

```typescript
const { data, error } = await supabaseAdmin
  .from("newsletter_subscriptions")
  .update({
    is_active: false,
    unsubscribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq("id", subscriptionId)
  .select();
```

#### Delete Subscription

```typescript
const { error } = await supabaseAdmin
  .from("newsletter_subscriptions")
  .delete()
  .eq("id", subscriptionId);
```

## Server Actions

### `subscribeToNewsletter(data)`

**Parameters:**

```typescript
interface NewsletterSubscriptionData {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}
```

**Returns:**

```typescript
interface NewsletterSubscriptionResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
  action?: "created" | "reactivated" | "unsubscribed";
}
```

### `unsubscribeFromNewsletter(email)`

**Parameters:**

- `email`: Email address to unsubscribe

**Returns:** Same as subscribe function

### `getNewsletterSubscription(email)`

**Parameters:**

- `email`: Email address to look up

**Returns:** Subscription object or null

## Email Functionality

### Welcome Email

Automatically sent to new subscribers with:

- Personalized greeting
- Welcome message
- What to expect
- Contact information

### Newsletter Sending

**Features:**

- Personalization with `{firstName}`, `{lastName}`, `{email}` placeholders
- Batch sending to active subscribers
- Test mode (limits to 10 subscribers)
- Success/failure tracking
- Updates `last_email_sent_at` timestamp

**Personalization Example:**

```html
<h1>Hello {firstName}!</h1>
<p>Welcome to our newsletter, {firstName} {lastName}.</p>
<p>We'll send updates to {email}.</p>
```

## Admin Panel Integration

The system is designed to work with a separate Next.js admin panel project using direct database access:

### Admin Features

- View all subscribers with pagination
- Filter by subscription status
- Send newsletters to all or specific subscribers
- Test newsletter sending
- Update subscription preferences
- Delete subscriptions

### Newsletter Management

- Create newsletter content with HTML
- Personalize content with placeholders
- Preview before sending
- Track sending results
- Manage subscriber lists

### Environment Setup for Admin Project

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

## Security Considerations

1. **Email Validation**: Server-side validation of email addresses
2. **Rate Limiting**: Consider implementing rate limiting for subscription endpoints
3. **CSRF Protection**: Forms include CSRF protection via Next.js
4. **RLS Policies**: Database access controlled by Row Level Security
5. **Input Sanitization**: All inputs are validated and sanitized

## Environment Variables

Required environment variables:

```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Usage Examples

### Basic Subscription

```tsx
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

const result = await subscribeToNewsletter({
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  source: "website",
});
```

### Send Newsletter (Admin)

```typescript
// Get active subscribers
const { data: subscribers } = await supabaseAdmin.rpc(
  "get_active_newsletter_subscribers"
);

// Send newsletter
for (const subscriber of subscribers) {
  const personalizedContent = content
    .replace(/\{firstName\}/g, subscriber.first_name || "there")
    .replace(/\{lastName\}/g, subscriber.last_name || "")
    .replace(/\{email\}/g, subscriber.email);

  await resend.emails.send({
    from: "DineEasy <noreply@dineeasy.ch>",
    to: subscriber.email,
    subject: "Monthly Update",
    html: personalizedContent,
  });
}
```

### Get Subscribers (Admin)

```typescript
const { data, error, count } = await supabaseAdmin
  .from("newsletter_subscriptions")
  .select("*", { count: "exact" })
  .eq("is_active", true)
  .order("created_at", { ascending: false })
  .range(0, 99); // First 100 subscribers
```

## Migration

To set up the newsletter system, run the migration:

```bash
# Apply the migration
supabase db push

# Or run manually
psql -d your_database -f supabase/migrations/20240713000000_add_newsletter_subscriptions.sql
```

## Testing

### Manual Testing

1. Subscribe via footer form
2. Check database for new subscription
3. Verify welcome email received
4. Test unsubscribe page
5. Verify subscription marked as inactive

### Admin Testing

```typescript
// Test newsletter sending in admin panel
const { data: subscribers } = await supabaseAdmin.rpc(
  "get_active_newsletter_subscribers"
);
console.log(`Found ${subscribers.length} active subscribers`);

// Test sending to first 5 subscribers
const testSubscribers = subscribers.slice(0, 5);
for (const subscriber of testSubscribers) {
  console.log(`Sending test email to ${subscriber.email}`);
  // ... send email logic
}
```

## Future Enhancements

1. **Email Templates**: Pre-built newsletter templates
2. **Analytics**: Track open rates, click rates
3. **Segmentation**: Target specific subscriber groups
4. **Automated Campaigns**: Scheduled newsletter sending
5. **A/B Testing**: Test different subject lines/content
6. **Double Opt-in**: Email verification for subscriptions
7. **Preference Management**: Let users choose content categories

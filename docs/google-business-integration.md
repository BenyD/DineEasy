# Google Business API Integration

## Overview

DineEasy integrates with Google Business API to provide seamless management of your restaurant's Google Business listing. This integration allows you to sync business information, manage reviews, and access insights directly from your DineEasy dashboard.

## Features

### 🔄 **Automated Data Sync**

- **Business Hours**: Automatically sync opening hours to Google Business
- **Contact Information**: Update phone, website, and address
- **Business Description**: Keep your Google listing description current
- **Photos**: Upload restaurant photos to Google Business

### 📝 **Review Management**

- **Fetch Reviews**: Import all Google Business reviews to DineEasy
- **Reply to Reviews**: Respond to customer reviews directly from DineEasy
- **Review Analytics**: Track review trends and ratings over time

### 📊 **Business Insights**

- **Search Views**: See how many times your business appears in searches
- **Map Views**: Track how often your business is viewed on Google Maps
- **Website Clicks**: Monitor clicks to your website from Google
- **Phone Calls**: Track phone calls generated from Google Business
- **Directions**: See how many people get directions to your restaurant

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable billing for the project

2. **Enable APIs**:
   - Enable "Google My Business API"
   - Enable "Google My Business Account Management API"
   - Enable "Google My Business Business Information API"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-domain.com/api/google-business/callback
     http://localhost:3000/api/google-business/callback (for development)
     ```

4. **Get API Credentials**:
   - Copy the Client ID and Client Secret
   - Add them to your environment variables

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Google Business API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google-business/callback
```

### 3. Install Dependencies

```bash
npm install googleapis
```

### 4. Database Migration

Run the migration to add Google Business fields:

```bash
npx supabase db push
```

## Usage

### Connecting Google Business

1. **Navigate to Settings**:
   - Go to Dashboard > Settings
   - Find the "Google Business Integration" section

2. **Connect Account**:
   - Click "Connect Google Business"
   - Authorize DineEasy to access your Google Business account
   - Select the business location to connect

3. **Enable Sync**:
   - Toggle "Auto-sync" to automatically keep data in sync
   - Choose what data to sync (hours, contact info, description)

### Managing Reviews

1. **Fetch Reviews**:
   - Go to Dashboard > Feedback
   - Click "Sync Google Reviews"
   - All reviews will be imported to DineEasy

2. **Reply to Reviews**:
   - View reviews in the Feedback dashboard
   - Click "Reply" on any review
   - Write your response and submit
   - Reply will be posted to Google Business

3. **Review Analytics**:
   - View review trends over time
   - Track average ratings
   - Monitor response rates

### Accessing Insights

1. **View Insights**:
   - Go to Dashboard > Analytics
   - Find the "Google Business Insights" section
   - View search views, map views, and actions

2. **Sync Insights**:
   - Click "Sync Insights" to fetch latest data
   - Insights are stored locally for quick access

## API Reference

### Server Actions

#### `getGoogleBusinessAuthUrl()`

Get the OAuth authorization URL for Google Business.

```typescript
const { authUrl } = await getGoogleBusinessAuthUrl();
```

#### `handleGoogleBusinessCallback(code: string)`

Handle the OAuth callback and connect Google Business.

```typescript
const result = await handleGoogleBusinessCallback(authCode);
```

#### `syncToGoogleBusiness()`

Sync restaurant data to Google Business.

```typescript
const result = await syncToGoogleBusiness();
```

#### `fetchGoogleBusinessReviews()`

Fetch and store Google Business reviews.

```typescript
const result = await fetchGoogleBusinessReviews();
```

#### `replyToGoogleBusinessReview(reviewId: string, reply: string)`

Reply to a Google Business review.

```typescript
const result = await replyToGoogleBusinessReview(reviewId, reply);
```

#### `fetchGoogleBusinessInsights()`

Fetch Google Business insights and analytics.

```typescript
const result = await fetchGoogleBusinessInsights();
```

#### `disconnectGoogleBusiness()`

Disconnect Google Business integration.

```typescript
const result = await disconnectGoogleBusiness();
```

### Database Schema

#### Restaurants Table

```sql
-- Google Business fields added to restaurants table
google_business_id TEXT,
google_business_access_token TEXT,
google_business_refresh_token TEXT,
google_business_token_expiry TIMESTAMP WITH TIME ZONE,
google_business_sync_enabled BOOLEAN DEFAULT FALSE,
google_business_last_sync TIMESTAMP WITH TIME ZONE,
google_business_location_id TEXT
```

#### Google Business Reviews Table

```sql
CREATE TABLE google_business_reviews (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id),
  google_review_id TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_time TIMESTAMP WITH TIME ZONE,
  reply_text TEXT,
  reply_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### Google Business Insights Table

```sql
CREATE TABLE google_business_insights (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id),
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Use Cases

### 1. **Multi-Location Restaurants**

- Connect multiple Google Business locations
- Sync data across all locations
- Manage reviews for each location separately

### 2. **Franchise Operations**

- Centralized review management
- Consistent business information across locations
- Brand reputation monitoring

### 3. **Local SEO Optimization**

- Keep business information current
- Respond to reviews promptly
- Monitor local search performance

### 4. **Customer Service**

- Centralized review management
- Quick response to customer feedback
- Track customer satisfaction trends

## Best Practices

### 1. **Regular Sync**

- Enable auto-sync for business information
- Manually sync reviews weekly
- Monitor insights monthly

### 2. **Review Management**

- Respond to all reviews within 24 hours
- Use professional, friendly tone
- Address negative reviews constructively

### 3. **Data Accuracy**

- Keep business hours current
- Update contact information promptly
- Maintain accurate business description

### 4. **Privacy & Security**

- Store tokens securely
- Use environment variables for credentials
- Implement proper access controls

## Troubleshooting

### Common Issues

#### "No Google Business accounts found"

- Ensure the Google account has a Google Business listing
- Verify the account has proper permissions
- Check if the business is verified on Google

#### "Failed to sync data"

- Check if access token is expired
- Verify API quotas haven't been exceeded
- Ensure all required fields are filled

#### "Reviews not appearing"

- Check if Reviews API is enabled
- Verify location ID is correct
- Ensure proper permissions for reviews

### Error Codes

- `GOOGLE_BUSINESS_NOT_CONNECTED`: Integration not set up
- `TOKEN_EXPIRED`: Access token needs refresh
- `INSUFFICIENT_PERMISSIONS`: Account lacks required permissions
- `API_QUOTA_EXCEEDED`: Daily API limit reached

## Security Considerations

### 1. **Token Management**

- Store tokens securely in database
- Implement token refresh logic
- Use HTTPS for all API calls

### 2. **Access Control**

- Verify user ownership of restaurant
- Implement proper RLS policies
- Audit API usage regularly

### 3. **Data Privacy**

- Only sync necessary data
- Respect user privacy preferences
- Comply with GDPR requirements

## Future Enhancements

### Planned Features

- **Automated Review Responses**: AI-powered review responses
- **Competitor Analysis**: Compare with local competitors
- **Advanced Analytics**: Custom reporting and insights
- **Bulk Operations**: Manage multiple locations efficiently
- **Integration with Other Platforms**: Facebook, Yelp, TripAdvisor

### API Improvements

- **Webhook Support**: Real-time updates
- **Batch Operations**: Efficient bulk updates
- **Advanced Filtering**: Better review and insight filtering
- **Custom Metrics**: Restaurant-specific analytics

## Support

For technical support with Google Business integration:

1. **Check Documentation**: Review this guide thoroughly
2. **Google API Status**: Check [Google API Status](https://status.developers.google.com/)
3. **DineEasy Support**: Contact support for DineEasy-specific issues
4. **Google Support**: Use Google's API support for Google-specific issues

## Resources

- [Google My Business API Documentation](https://developers.google.com/my-business)
- [Google My Business Account Management API](https://developers.google.com/my-business/reference/accountmanagement)
- [Google My Business Business Information API](https://developers.google.com/my-business/reference/businessinformation)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)

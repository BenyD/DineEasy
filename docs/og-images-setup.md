# DineEasy OG Images Setup Guide

## Overview

This guide helps you set up proper Open Graph (OG) images for all DineEasy pages to ensure optimal social media sharing and SEO.

## Required OG Images

### 1. Default OG Image

- **File**: `/public/images/dineeasy-og-default.jpg`
- **Size**: 1200x630 pixels
- **Content**: DineEasy logo, tagline "Modern Restaurant Management Made Simple"
- **Use**: Default fallback for all pages

### 2. Page-Specific OG Images

#### Homepage

- **File**: `/public/images/home-og.jpg`
- **Content**: Hero image with DineEasy branding, QR code visualization, restaurant management features

#### About Page

- **File**: `/public/images/about-og.jpg`
- **Content**: Team photo or mission statement with DineEasy branding

#### Features Page

- **File**: `/public/images/features-og.jpg`
- **Content**: Feature highlights with icons (QR ordering, analytics, payments, printing)

#### Pricing Page

- **File**: `/public/images/pricing-og.jpg`
- **Content**: Pricing plans visualization with "Simple, Transparent Pricing" message

#### Setup Guide

- **File**: `/images/setup-guide-og.jpg`
- **Content**: Step-by-step setup process visualization

#### Security Page

- **File**: `/images/security-og.jpg`
- **Content**: Security features with trust indicators (locks, shields, certifications)

#### Contact Page

- **File**: `/images/contact-og.jpg`
- **Content**: Contact information with support team visualization

#### Solution Pages

- **Restaurants**: `/images/solutions-restaurants-og.jpg`
- **Cafes**: `/images/solutions-cafes-og.jpg`
- **Bars**: `/images/solutions-bars-og.jpg`
- **Food Trucks**: `/images/solutions-food-trucks-og.jpg`

## OG Image Design Guidelines

### Technical Specifications

- **Dimensions**: 1200x630 pixels (1.91:1 aspect ratio)
- **Format**: JPEG for photos, PNG for graphics with transparency
- **File Size**: Under 1MB for optimal loading
- **Color Space**: sRGB

### Design Elements

1. **Brand Consistency**
   - Use DineEasy green (#16a34a) as primary color
   - Include DineEasy logo prominently
   - Maintain brand typography

2. **Content Hierarchy**
   - Clear, readable text (minimum 24px font)
   - High contrast for accessibility
   - Important information in top-left area

3. **Visual Elements**
   - Restaurant-related imagery (food, dining, technology)
   - QR codes and mobile devices
   - Clean, modern design aesthetic

## Implementation Status

### ✅ Completed

- [x] Default metadata configuration
- [x] Page-specific metadata files
- [x] Twitter card configuration
- [x] Proper image dimensions and types

### ❌ Missing (Need to Create)

- [ ] `/images/dineeasy-og-default.jpg`
- [ ] `/images/home-og.jpg`
- [ ] `/images/about-og.jpg`
- [ ] `/images/features-og.jpg`
- [ ] `/images/pricing-og.jpg`
- [ ] `/images/setup-guide-og.jpg`
- [ ] `/images/security-og.jpg`
- [ ] `/images/contact-og.jpg`
- [ ] `/images/solutions-restaurants-og.jpg`
- [ ] `/images/solutions-cafes-og.jpg`
- [ ] `/images/solutions-bars-og.jpg`
- [ ] `/images/solutions-food-trucks-og.jpg`

## Testing OG Images

### 1. Facebook Sharing Debugger

```
https://developers.facebook.com/tools/debug/
```

### 2. Twitter Card Validator

```
https://cards-dev.twitter.com/validator
```

### 3. LinkedIn Post Inspector

```
https://www.linkedin.com/post-inspector/
```

### 4. WhatsApp Link Preview

Test by sharing your URL in WhatsApp

## Best Practices

### 1. Content Guidelines

- Keep text concise and impactful
- Use action-oriented language
- Include clear value propositions
- Ensure mobile readability

### 2. Technical Best Practices

- Use descriptive alt text
- Optimize file sizes
- Test across different platforms
- Monitor loading times

### 3. Brand Guidelines

- Maintain consistent visual identity
- Use approved brand colors
- Follow typography guidelines
- Include proper logo usage

## Quick Setup Commands

### Generate OG Images

```bash
# Create images directory if it doesn't exist
mkdir -p public/images

# Generate OG images using design tools or AI
# Recommended tools: Canva, Figma, or AI image generators
```

### Test Implementation

```bash
# Test OG images locally
npm run dev
# Visit each page and check browser dev tools for meta tags
```

## Monitoring and Analytics

### Track OG Image Performance

- Monitor social media engagement
- Track click-through rates
- Analyze sharing patterns
- Monitor loading performance

### Regular Maintenance

- Update images quarterly
- Test across new platforms
- Optimize based on performance data
- Keep content current

## Troubleshooting

### Common Issues

1. **Images not loading**: Check file paths and permissions
2. **Wrong dimensions**: Ensure 1200x630 pixels
3. **Caching issues**: Use Facebook/Twitter debuggers to refresh cache
4. **Slow loading**: Optimize image file sizes

### Debug Steps

1. Validate HTML meta tags
2. Check image URLs are accessible
3. Test with social media debuggers
4. Verify image dimensions and format
5. Clear browser and social media caches

## Next Steps

1. **Create OG Images**: Design and create all missing OG images
2. **Upload to Public Directory**: Place images in `/public/images/`
3. **Test Implementation**: Use social media debuggers
4. **Monitor Performance**: Track engagement and sharing metrics
5. **Optimize Based on Data**: Refine images based on performance

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/best-practices)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [LinkedIn Post Inspector](https://www.linkedin.com/help/linkedin/answer/a522735)

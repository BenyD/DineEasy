#!/usr/bin/env node

/**
 * DineEasy OG Images Generator
 *
 * This script helps create placeholder OG images for testing.
 * For production, replace these with properly designed images.
 */

const fs = require("fs");
const path = require("path");

// OG Images configuration
const ogImages = [
  {
    name: "dineeasy-og-default.jpg",
    title: "DineEasy",
    subtitle: "Modern Restaurant Management Made Simple",
    description: "Default OG image for all pages",
  },
  {
    name: "home-og.jpg",
    title: "DineEasy",
    subtitle: "Transform Your Restaurant Operations",
    description: "Homepage OG image",
  },
  {
    name: "about-og.jpg",
    title: "About DineEasy",
    subtitle: "Our Mission and Team",
    description: "About page OG image",
  },
  {
    name: "features-og.jpg",
    title: "DineEasy Features",
    subtitle: "Complete Restaurant Management Solution",
    description: "Features page OG image",
  },
  {
    name: "pricing-og.jpg",
    title: "DineEasy Pricing",
    subtitle: "Simple, Transparent Plans",
    description: "Pricing page OG image",
  },
  {
    name: "setup-guide-og.jpg",
    title: "Setup Guide",
    subtitle: "Get Started in Under an Hour",
    description: "Setup guide OG image",
  },
  {
    name: "security-og.jpg",
    title: "Enterprise Security",
    subtitle: "Built on Enterprise Security Infrastructure",
    description: "Security page OG image",
  },
  {
    name: "contact-og.jpg",
    title: "Contact Us",
    subtitle: "Get in Touch with Our Team",
    description: "Contact page OG image",
  },
  {
    name: "solutions-restaurants-og.jpg",
    title: "Restaurant Solutions",
    subtitle: "Complete Management Solution",
    description: "Restaurants solution OG image",
  },
  {
    name: "solutions-cafes-og.jpg",
    title: "Café Solutions",
    subtitle: "Streamlined Coffee Shop Management",
    description: "Cafes solution OG image",
  },
  {
    name: "solutions-bars-og.jpg",
    title: "Bar Solutions",
    subtitle: "Specialized Nightlife Tools",
    description: "Bars solution OG image",
  },
  {
    name: "solutions-food-trucks-og.jpg",
    title: "Food Truck Solutions",
    subtitle: "Mobile-First Management",
    description: "Food trucks solution OG image",
  },
];

// Ensure images directory exists
const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log("✅ Created images directory");
}

// Generate placeholder images using Canvas API
async function generatePlaceholderImage(imageConfig) {
  const { createCanvas } = require("canvas");

  // Create canvas with OG image dimensions
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#16a34a");
  gradient.addColorStop(1, "#15803d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Add some visual elements
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.arc(1000, 150, 100, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(1100, 300, 80, 0, 2 * Math.PI);
  ctx.fill();

  // Text styling
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial, sans-serif";
  ctx.textAlign = "left";

  // Main title
  ctx.fillText(imageConfig.title, 60, 200);

  // Subtitle
  ctx.font = "24px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillText(imageConfig.subtitle, 60, 250);

  // Description
  ctx.font = "16px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(imageConfig.description, 60, 280);

  // DineEasy branding
  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("dineeasy.com", 60, 600);

  // Save the image
  const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
  const filePath = path.join(imagesDir, imageConfig.name);
  fs.writeFileSync(filePath, buffer);

  console.log(`✅ Generated ${imageConfig.name}`);
}

// Main execution
async function main() {
  console.log("🚀 Generating DineEasy OG Images...\n");

  try {
    // Check if canvas is available
    try {
      require("canvas");
    } catch (error) {
      console.log("❌ Canvas package not found. Installing...");
      console.log("Run: npm install canvas");
      console.log(
        "Or create images manually using the specifications in docs/og-images-setup.md"
      );
      return;
    }

    // Generate all images
    for (const imageConfig of ogImages) {
      await generatePlaceholderImage(imageConfig);
    }

    console.log("\n🎉 All OG images generated successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Review generated images in /public/images/");
    console.log("2. Replace with properly designed images");
    console.log("3. Test with social media debuggers");
    console.log("4. See docs/og-images-setup.md for detailed guidelines");
  } catch (error) {
    console.error("❌ Error generating images:", error.message);
    console.log(
      "\n💡 Alternative: Create images manually using design tools like Canva or Figma"
    );
    console.log("📋 See docs/og-images-setup.md for specifications");
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { ogImages, generatePlaceholderImage };

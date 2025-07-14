#!/usr/bin/env tsx

import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Pricing configuration based on new CHF prices
const PRICING = {
  starter: {
    USD: { monthly: 39, yearly: 374 },
    CHF: { monthly: 34.9, yearly: 334 },
    EUR: { monthly: 36, yearly: 345 },
    GBP: { monthly: 31, yearly: 297 },
    INR: { monthly: 3250, yearly: 31200 },
    AUD: { monthly: 59, yearly: 566 },
    AED: { monthly: 143, yearly: 1373 },
    SEK: { monthly: 408, yearly: 3917 },
    CAD: { monthly: 53, yearly: 509 },
    NZD: { monthly: 64, yearly: 614 },
    LKR: { monthly: 12400, yearly: 119040 },
    SGD: { monthly: 53, yearly: 509 },
    MYR: { monthly: 184, yearly: 1766 },
    THB: { monthly: 1400, yearly: 13440 },
    JPY: { monthly: 5900, yearly: 56640 },
    HKD: { monthly: 305, yearly: 2928 },
    KRW: { monthly: 52000, yearly: 499200 },
  },
  pro: {
    USD: { monthly: 105, yearly: 1008 },
    CHF: { monthly: 94.9, yearly: 911 },
    EUR: { monthly: 97, yearly: 931 },
    GBP: { monthly: 83, yearly: 797 },
    INR: { monthly: 8750, yearly: 84000 },
    AUD: { monthly: 159, yearly: 1526 },
    AED: { monthly: 385, yearly: 3696 },
    SEK: { monthly: 1100, yearly: 10560 },
    CAD: { monthly: 143, yearly: 1373 },
    NZD: { monthly: 172, yearly: 1651 },
    LKR: { monthly: 33400, yearly: 320640 },
    SGD: { monthly: 143, yearly: 1373 },
    MYR: { monthly: 495, yearly: 4752 },
    THB: { monthly: 3760, yearly: 36096 },
    JPY: { monthly: 15800, yearly: 151680 },
    HKD: { monthly: 820, yearly: 7872 },
    KRW: { monthly: 140000, yearly: 999999 },
  },
  elite: {
    USD: { monthly: 265, yearly: 2544 },
    CHF: { monthly: 239, yearly: 2294 },
    EUR: { monthly: 245, yearly: 2352 },
    GBP: { monthly: 210, yearly: 2016 },
    INR: { monthly: 22000, yearly: 211200 },
    AUD: { monthly: 399, yearly: 3830 },
    AED: { monthly: 973, yearly: 9341 },
    SEK: { monthly: 2770, yearly: 26592 },
    CAD: { monthly: 360, yearly: 3456 },
    NZD: { monthly: 433, yearly: 4157 },
    LKR: { monthly: 84000, yearly: 806400 },
    SGD: { monthly: 360, yearly: 3456 },
    MYR: { monthly: 1245, yearly: 11952 },
    THB: { monthly: 9470, yearly: 90912 },
    JPY: { monthly: 39800, yearly: 382080 },
    HKD: { monthly: 2065, yearly: 19824 },
    KRW: { monthly: 352000, yearly: 999999 },
  },
};

async function createPrices() {
  console.log("🚀 Starting Stripe price creation...\n");

  const createdPrices: Record<string, any> = {};

  for (const [plan, currencies] of Object.entries(PRICING)) {
    console.log(`📦 Creating prices for ${plan.toUpperCase()} plan:`);

    for (const [currency, intervals] of Object.entries(currencies)) {
      console.log(`  💰 ${currency}:`);

      for (const [interval, amount] of Object.entries(intervals)) {
        try {
          // Convert interval to Stripe format
          const stripeInterval = interval === "monthly" ? "month" : "year";

          const price = await stripe.prices.create({
            unit_amount: amount * 100, // Convert to cents
            currency: currency.toLowerCase(),
            recurring: {
              interval: stripeInterval as "month" | "year",
            },
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${interval.charAt(0).toUpperCase() + interval.slice(1)}ly`,
              metadata: {
                plan,
                interval,
                currency,
              },
            },
          });

          const envKey = `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_${currency.toUpperCase()}_PRICE_ID`;
          createdPrices[envKey] = price.id;

          console.log(
            `    ✅ ${interval}: ${price.id} (${amount} ${currency})`
          );
        } catch (error) {
          console.error(
            `    ❌ Error creating ${interval} price for ${currency}:`,
            error
          );
        }
      }
    }
    console.log("");
  }

  // Generate .env file content
  console.log("📝 Generated .env variables:");
  console.log("=".repeat(50));

  for (const [key, value] of Object.entries(createdPrices)) {
    console.log(`${key}=${value}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Price creation completed!");
  console.log("\n📋 Next steps:");
  console.log(
    "1. Copy the above environment variables to your .env.local file"
  );
  console.log("2. Update your pricing.ts file with the new price IDs");
  console.log("3. Test the subscription flow with the new prices");
}

// Run the script
createPrices().catch(console.error);

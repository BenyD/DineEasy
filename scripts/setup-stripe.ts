#!/usr/bin/env tsx

import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Pricing configuration with improved .99 pricing format
const PRICING = {
  starter: {
    CHF: { monthly: 34.99, yearly: 334.99 },
    // USD: { monthly: 39.99, yearly: 374.99 },
    // EUR: { monthly: 36.99, yearly: 345.99 },
    // GBP: { monthly: 31.99, yearly: 297.99 },
    // INR: { monthly: 3250, yearly: 31200 },
    // AUD: { monthly: 59.99, yearly: 566.99 },
    // AED: { monthly: 143, yearly: 1373 },
    // SEK: { monthly: 408, yearly: 3917 },
    // CAD: { monthly: 53.99, yearly: 509.99 },
    // NZD: { monthly: 64.99, yearly: 614.99 },
    // LKR: { monthly: 12400, yearly: 119040 },
    // SGD: { monthly: 53.99, yearly: 509.99 },
    // MYR: { monthly: 184, yearly: 1766 },
    // THB: { monthly: 1400, yearly: 13440 },
    // JPY: { monthly: 5900, yearly: 56640 },
    // HKD: { monthly: 305, yearly: 2928 },
    // KRW: { monthly: 52000, yearly: 499200 },
  },
  pro: {
    CHF: { monthly: 94.99, yearly: 911.99 },
    // USD: { monthly: 105.99, yearly: 1008.99 },
    // EUR: { monthly: 97.99, yearly: 931.99 },
    // GBP: { monthly: 83.99, yearly: 797.99 },
    // INR: { monthly: 8750, yearly: 84000 },
    // AUD: { monthly: 159.99, yearly: 1526.99 },
    // AED: { monthly: 385, yearly: 3696 },
    // SEK: { monthly: 1100, yearly: 10560 },
    // CAD: { monthly: 143.99, yearly: 1373.99 },
    // NZD: { monthly: 172.99, yearly: 1651.99 },
    // LKR: { monthly: 33400, yearly: 320640 },
    // SGD: { monthly: 143.99, yearly: 1373.99 },
    // MYR: { monthly: 495, yearly: 4752 },
    // THB: { monthly: 3760, yearly: 36096 },
    // JPY: { monthly: 15800, yearly: 151680 },
    // HKD: { monthly: 820, yearly: 7872 },
    // KRW: { monthly: 140000, yearly: 999999 },
  },
  elite: {
    CHF: { monthly: 239.99, yearly: 2294.99 },
    // USD: { monthly: 265.99, yearly: 2544.99 },
    // EUR: { monthly: 245.99, yearly: 2352.99 },
    // GBP: { monthly: 210.99, yearly: 2016.99 },
    // INR: { monthly: 22000, yearly: 211200 },
    // AUD: { monthly: 399.99, yearly: 3830.99 },
    // AED: { monthly: 973, yearly: 9341 },
    // SEK: { monthly: 2770, yearly: 26592 },
    // CAD: { monthly: 360.99, yearly: 3456.99 },
    // NZD: { monthly: 433.99, yearly: 4157.99 },
    // LKR: { monthly: 84000, yearly: 806400 },
    // SGD: { monthly: 360.99, yearly: 3456.99 },
    // MYR: { monthly: 1245, yearly: 11952 },
    // THB: { monthly: 9480, yearly: 91008 },
    // JPY: { monthly: 39800, yearly: 382080 },
    // HKD: { monthly: 2065, yearly: 19824 },
    // KRW: { monthly: 352000, yearly: 3379200 },
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

          // Create product description based on plan
          const getProductDescription = (
            planName: string,
            interval: string
          ) => {
            const planDescriptions = {
              starter:
                "Perfect for independent owners and small cafés. Includes digital menu, QR ordering, and basic reporting.",
              pro: "Ideal for growing restaurants with staff. Features role-based permissions, analytics, and custom branding.",
              elite:
                "Enterprise-grade solution for high-volume restaurants. Unlimited features with dedicated support and API access.",
            };

            const intervalText = interval === "monthly" ? "Monthly" : "Annual";
            return `${intervalText} subscription for ${planDescriptions[planName as keyof typeof planDescriptions]}`;
          };

          const price = await stripe.prices.create({
            unit_amount: Math.round(amount * 100), // Convert to cents and round
            currency: currency.toLowerCase(),
            recurring: {
              interval: stripeInterval as "month" | "year",
            },
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${interval.charAt(0).toUpperCase() + interval.slice(1)}`,
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
  console.log("\n💰 Pricing Summary:");
  console.log("Starter: 34.99 CHF/month, 334.99 CHF/year");
  console.log("Pro: 94.99 CHF/month, 911.99 CHF/year");
  console.log("Elite: 239.99 CHF/month, 2294.99 CHF/year");
}

// Run the script
createPrices().catch(console.error);

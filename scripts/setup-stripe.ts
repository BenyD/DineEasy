#!/usr/bin/env tsx

import "./load-env";
import Stripe from "stripe";
import { PRICING, DEFAULT_CURRENCY } from "../lib/constants";

const CURRENCIES = ["USD", "CHF", "EUR", "GBP", "INR", "AUD"] as const;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

const PLANS = ["starter", "pro", "elite"] as const;
const INTERVALS = ["monthly", "yearly"] as const;

async function createOrGetProduct(name: string, description: string) {
  // Check if product already exists
  const products = await stripe.products.list({ limit: 100 });
  const existingProduct = products.data.find((p) => p.name === name);

  if (existingProduct) {
    console.log(`✅ Found existing product: ${name}`);
    return existingProduct;
  }

  const product = await stripe.products.create({
    name,
    description,
  });
  console.log(`✅ Created new product: ${name}`);
  return product;
}

async function createOrGetPrice(
  productId: string,
  amount: number,
  currency: string,
  interval: "month" | "year",
  metadata: Record<string, string>
) {
  // Check if price already exists
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });

  const existingPrice = prices.data.find(
    (p) =>
      p.currency === currency &&
      p.recurring?.interval === interval &&
      p.unit_amount === (currency === "inr" ? amount : amount * 100)
  );

  if (existingPrice) {
    console.log(`  ✅ Found existing price: ${currency} ${interval}`);
    return existingPrice;
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount * 100, // Convert all currencies to smallest unit (cents/paise)
    currency,
    recurring: {
      interval,
    },
    metadata,
  });
  console.log(`  ✅ Created new price: ${currency} ${interval}`);
  return price;
}

async function main() {
  try {
    console.log(
      "🚀 Setting up Stripe products and prices for multi-currency support...\n"
    );

    const createdPrices: Record<string, string> = {};

    // Create base products (one per plan, not per currency)
    const products = {
      starter: await createOrGetProduct(
        "Starter Plan",
        "Perfect for small restaurants just getting started with digital ordering"
      ),
      pro: await createOrGetProduct(
        "Pro Plan",
        "For growing restaurants that need more features and higher limits"
      ),
      elite: await createOrGetProduct(
        "Elite Plan",
        "For established restaurants that need the highest limits and premium features"
      ),
    };

    console.log("\n📦 Creating prices for all currencies...\n");

    // Create prices for all currencies
    for (const plan of PLANS) {
      console.log(`📦 Creating prices for ${plan.toUpperCase()} plan:`);

      for (const currency of CURRENCIES) {
        for (const interval of INTERVALS) {
          const price =
            PRICING[plan].price[
              currency as keyof (typeof PRICING)[typeof plan]["price"]
            ][interval];
          const priceId = `${plan}_${interval}_${currency.toLowerCase()}`;

          try {
            const stripePrice = await createOrGetPrice(
              products[plan].id,
              price,
              currency.toLowerCase(),
              interval === "monthly" ? "month" : "year",
              {
                plan,
                interval,
                currency,
              }
            );

            createdPrices[priceId] = stripePrice.id;
            console.log(
              `    ${currency} ${interval}: ${price} ${currency} (ID: ${stripePrice.id})`
            );
          } catch (error) {
            console.error(
              `    ❌ Failed to create ${currency} ${interval} price:`,
              error
            );
          }
        }
      }
      console.log("");
    }

    console.log("📝 Environment variables to add to your .env file:");
    console.log("");

    for (const plan of PLANS) {
      for (const currency of CURRENCIES) {
        for (const interval of INTERVALS) {
          const priceId = `${plan}_${interval}_${currency.toLowerCase()}`;
          const envVar = `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_${currency}_PRICE_ID`;
          console.log(
            `${envVar}=${createdPrices[priceId] || "REPLACE_WITH_ACTUAL_ID"}`
          );
        }
      }
    }

    console.log("\n🎉 Setup complete!");
    console.log(`💡 Default currency is set to: ${DEFAULT_CURRENCY}`);
    console.log(
      "⚠️  Make sure to add the environment variables to your .env file"
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

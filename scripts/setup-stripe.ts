import "./load-env";
import Stripe from "stripe";
import { SUBSCRIPTION, PLANS } from "../lib/constants";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

async function createProduct(name: string, description: string) {
  const product = await stripe.products.create({
    name,
    description,
  });
  return product;
}

async function createPrice(
  productId: string,
  amount: number,
  interval: "month" | "year"
) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: amount * 100, // Convert to cents
    currency: "usd",
    recurring: {
      interval,
    },
  });
  return price;
}

async function main() {
  try {
    console.log("🚀 Setting up Stripe products and prices...");

    // Create products
    const starterProduct = await createProduct(
      "Starter Plan",
      "Perfect for small restaurants just getting started with digital ordering"
    );
    console.log("✅ Created Starter product");

    const proProduct = await createProduct(
      "Pro Plan",
      "For growing restaurants that need more features and higher limits"
    );
    console.log("✅ Created Pro product");

    const eliteProduct = await createProduct(
      "Elite Plan",
      "For established restaurants that need the highest limits and premium features"
    );
    console.log("✅ Created Elite product");

    // Create prices
    const starterMonthly = await createPrice(
      starterProduct.id,
      PLANS.starter.price.monthly,
      "month"
    );
    const starterYearly = await createPrice(
      starterProduct.id,
      PLANS.starter.price.yearly,
      "year"
    );
    console.log("✅ Created Starter prices");

    const proMonthly = await createPrice(
      proProduct.id,
      PLANS.pro.price.monthly,
      "month"
    );
    const proYearly = await createPrice(
      proProduct.id,
      PLANS.pro.price.yearly,
      "year"
    );
    console.log("✅ Created Pro prices");

    const eliteMonthly = await createPrice(
      eliteProduct.id,
      PLANS.elite.price.monthly,
      "month"
    );
    const eliteYearly = await createPrice(
      eliteProduct.id,
      PLANS.elite.price.yearly,
      "year"
    );
    console.log("✅ Created Elite prices");

    console.log("\n🎉 Setup complete! Add these values to your .env.local:\n");
    console.log(`STRIPE_STARTER_MONTHLY_PRICE_ID=${starterMonthly.id}`);
    console.log(`STRIPE_STARTER_YEARLY_PRICE_ID=${starterYearly.id}`);
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
    console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
    console.log(`STRIPE_ELITE_MONTHLY_PRICE_ID=${eliteMonthly.id}`);
    console.log(`STRIPE_ELITE_YEARLY_PRICE_ID=${eliteYearly.id}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();

import Stripe from "stripe";
import { SUBSCRIPTION, PLANS } from "./constants";

// Validate required environment variables
const requiredEnvVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} is not set in environment variables`);
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil", // Keep the future version as it seems to be required by the types
  typescript: true,
});

export type StripePlan = "starter" | "pro" | "elite";
export type StripeInterval = "monthly" | "yearly";
export type StripeCurrency =
  | "USD"
  | "CHF"
  | "EUR"
  | "GBP"
  | "INR"
  | "AUD"
  | "AED"
  | "SEK"
  | "CAD"
  | "NZD"
  | "LKR"
  | "SGD"
  | "MYR"
  | "THB"
  | "JPY"
  | "HKD"
  | "KRW";

export type SubscriptionMetadata = {
  restaurantId: string;
  plan: StripePlan;
  interval: StripeInterval;
  currency: StripeCurrency;
  [key: string]: string; // Add index signature for Stripe metadata compatibility
};

export async function createStripeCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  return customer;
}

export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  metadata: SubscriptionMetadata,
  trialDays: number = SUBSCRIPTION.TRIAL_DAYS
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      restaurantId: metadata.restaurantId,
      plan: metadata.plan,
      interval: metadata.interval,
      currency: metadata.currency,
    },
  });
  return subscription;
}

export async function updateStripeSubscription(
  subscriptionId: string,
  priceId: string,
  metadata?: Partial<SubscriptionMetadata>
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      ...(metadata && {
        metadata: {
          ...subscription.metadata,
          ...(metadata.restaurantId && { restaurantId: metadata.restaurantId }),
          ...(metadata.plan && { plan: metadata.plan }),
          ...(metadata.interval && { interval: metadata.interval }),
        },
      }),
    }
  );
  return updatedSubscription;
}

export async function cancelStripeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function createStripeCheckoutSession(
  customerId: string,
  priceId: string,
  metadata: SubscriptionMetadata,
  successUrl: string,
  cancelUrl: string,
  trialDays: number = SUBSCRIPTION.TRIAL_DAYS
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        restaurantId: metadata.restaurantId,
        plan: metadata.plan,
        interval: metadata.interval,
        currency: metadata.currency,
      },
    },
  });
  return session;
}

export async function createStripePortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId?: string,
  paymentMethodId?: string,
  returnUrl?: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: !!paymentMethodId,
    automatic_payment_methods: !paymentMethodId ? { enabled: true } : undefined,
    return_url:
      returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/return`,
  });
  return paymentIntent;
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
  return refund;
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
  return event;
}

export async function listPaymentMethods(customerId: string) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  return paymentMethods;
}

export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
  return paymentMethod;
}

export async function detachPaymentMethod(paymentMethodId: string) {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  const customer = await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  return customer;
}

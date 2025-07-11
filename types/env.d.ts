declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Stripe
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

    // Stripe Price IDs
    STRIPE_STARTER_MONTHLY_PRICE_ID: string;
    STRIPE_STARTER_YEARLY_PRICE_ID: string;
    STRIPE_PRO_MONTHLY_PRICE_ID: string;
    STRIPE_PRO_YEARLY_PRICE_ID: string;
    STRIPE_ELITE_MONTHLY_PRICE_ID: string;
    STRIPE_ELITE_YEARLY_PRICE_ID: string;

    // App
    NEXT_PUBLIC_APP_URL: string;
  }
}

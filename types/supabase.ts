export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          type: Database["public"]["Enums"]["restaurant_type"];
          cuisine: string | null;
          email: string;
          phone: string | null;
          website: string | null;
          logo_url: string | null;
          cover_url: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          country: string | null;
          currency: Database["public"]["Enums"]["currency"];
          tax_rate: number;
          vat_number: string | null;
          price_range: Database["public"]["Enums"]["price_range"] | null;
          seating_capacity: number | null;
          accepts_reservations: boolean;
          delivery_available: boolean;
          takeout_available: boolean;
          opening_hours: Json | null;
          subscription_status: string | null;
          stripe_customer_id: string | null;
          stripe_account_id: string | null;
          stripe_account_enabled: boolean | null;
          stripe_account_requirements: Json | null;
          stripe_account_created_at: string | null;
          created_at: string;
          updated_at: string;
          notification_settings: Json | null;
          is_open: boolean | null;
          onboarding_completed: boolean | null;
          payment_methods: Json | null;
          google_business_id: string | null;
          google_business_access_token: string | null;
          google_business_refresh_token: string | null;
          google_business_token_expiry: string | null;
          google_business_sync_enabled: boolean | null;
          google_business_last_sync: string | null;
          google_business_location_id: string | null;
          welcome_email_sent: boolean | null;
          auto_open_close: boolean | null;
          stripe_account_deleted: boolean | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          type: Database["public"]["Enums"]["restaurant_type"];
          cuisine?: string | null;
          email: string;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          currency?: Database["public"]["Enums"]["currency"];
          tax_rate?: number;
          vat_number?: string | null;
          price_range?: Database["public"]["Enums"]["price_range"] | null;
          seating_capacity?: number | null;
          accepts_reservations?: boolean;
          delivery_available?: boolean;
          takeout_available?: boolean;
          opening_hours?: Json | null;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_account_enabled?: boolean | null;
          stripe_account_requirements?: Json | null;
          stripe_account_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notification_settings?: Json | null;
          is_open?: boolean | null;
          onboarding_completed?: boolean | null;
          payment_methods?: Json | null;
          google_business_id?: string | null;
          google_business_access_token?: string | null;
          google_business_refresh_token?: string | null;
          google_business_token_expiry?: string | null;
          google_business_sync_enabled?: boolean | null;
          google_business_last_sync?: string | null;
          google_business_location_id?: string | null;
          welcome_email_sent?: boolean | null;
          auto_open_close?: boolean | null;
          stripe_account_deleted?: boolean | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["restaurant_type"];
          cuisine?: string | null;
          email?: string;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          currency?: Database["public"]["Enums"]["currency"];
          tax_rate?: number;
          vat_number?: string | null;
          price_range?: Database["public"]["Enums"]["price_range"] | null;
          seating_capacity?: number | null;
          accepts_reservations?: boolean;
          delivery_available?: boolean;
          takeout_available?: boolean;
          opening_hours?: Json | null;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_account_enabled?: boolean | null;
          stripe_account_requirements?: Json | null;
          stripe_account_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
          notification_settings?: Json | null;
          is_open?: boolean | null;
          onboarding_completed?: boolean | null;
          payment_methods?: Json | null;
          google_business_id?: string | null;
          google_business_access_token?: string | null;
          google_business_refresh_token?: string | null;
          google_business_token_expiry?: string | null;
          google_business_sync_enabled?: boolean | null;
          google_business_last_sync?: string | null;
          google_business_location_id?: string | null;
          welcome_email_sent?: boolean | null;
          auto_open_close?: boolean | null;
          stripe_account_deleted?: boolean | null;
        };
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          number: string;
          capacity: number;
          status: Database["public"]["Enums"]["table_status"];
          qr_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          number: string;
          capacity: number;
          status?: Database["public"]["Enums"]["table_status"];
          qr_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          number?: string;
          capacity?: number;
          status?: Database["public"]["Enums"]["table_status"];
          qr_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          restaurant_id: string;
          order_id: string;
          amount: number;
          status: Database["public"]["Enums"]["payment_status"];
          method: Database["public"]["Enums"]["payment_method"];
          stripe_payment_id: string | null;
          refund_id: string | null;
          created_at: string;
          updated_at: string;
          currency: Database["public"]["Enums"]["currency"];
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          order_id: string;
          amount: number;
          status?: Database["public"]["Enums"]["payment_status"];
          method: Database["public"]["Enums"]["payment_method"];
          stripe_payment_id?: string | null;
          refund_id?: string | null;
          created_at?: string;
          updated_at?: string;
          currency?: Database["public"]["Enums"]["currency"];
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          order_id?: string;
          amount?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          method?: Database["public"]["Enums"]["payment_method"];
          stripe_payment_id?: string | null;
          refund_id?: string | null;
          created_at?: string;
          updated_at?: string;
          currency?: Database["public"]["Enums"]["currency"];
        };
      };
      // Add other tables as needed...
    };
    Enums: {
      restaurant_type: "restaurant" | "cafe" | "bar" | "food-truck";
      currency:
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
      price_range: "$" | "$$" | "$$$" | "$$$$";
      table_status: "available" | "occupied" | "reserved" | "unavailable";
      payment_method: "cash" | "card" | "other";
      payment_status: "pending" | "completed" | "failed" | "refunded";
      // Add other enums as needed...
    };
  };
}

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
      activity_logs: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string | null;
          type: Database["public"]["Enums"]["activity_type"];
          action: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id?: string | null;
          type: Database["public"]["Enums"]["activity_type"];
          action: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string | null;
          type?: Database["public"]["Enums"]["activity_type"];
          action?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      allergens: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          restaurant_id: string;
          order_id: string | null;
          rating: number;
          comment: string | null;
          sentiment: Database["public"]["Enums"]["sentiment"];
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          order_id?: string | null;
          rating: number;
          comment?: string | null;
          sentiment: Database["public"]["Enums"]["sentiment"];
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          order_id?: string | null;
          rating?: number;
          comment?: string | null;
          sentiment?: Database["public"]["Enums"]["sentiment"];
          created_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          allergens: string[] | null;
          preparation_time: unknown | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          allergens?: string[] | null;
          preparation_time?: unknown | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          allergens?: string[] | null;
          preparation_time?: unknown | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          quantity?: number;
          unit_price?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_amount: number;
          tax_amount: number;
          tip_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount: number;
          tax_amount: number;
          tip_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount?: number;
          tax_amount?: number;
          tip_amount?: number;
          notes?: string | null;
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
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
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
          subscription_status: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id: string | null;
          stripe_account_id: string | null;
          stripe_account_enabled: boolean;
          stripe_account_requirements: Json | null;
          stripe_account_created_at: string | null;
          created_at: string;
          updated_at: string;
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
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_account_enabled?: boolean;
          stripe_account_requirements?: Json | null;
          stripe_account_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          subscription_status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_account_enabled?: boolean;
          stripe_account_requirements?: Json | null;
          stripe_account_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          permissions: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          permissions?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
          permissions?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          restaurant_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          interval: Database["public"]["Enums"]["subscription_interval"];
          status: string;
          current_period_start: string;
          current_period_end: string;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          interval: Database["public"]["Enums"]["subscription_interval"];
          status: string;
          current_period_start: string;
          current_period_end: string;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          interval?: Database["public"]["Enums"]["subscription_interval"];
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          is_active: boolean;
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
          is_active?: boolean;
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
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          is_active: boolean;
          subscription_source: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
          unsubscribed_at: string | null;
          last_email_sent_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          is_active?: boolean;
          subscription_source?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          unsubscribed_at?: string | null;
          last_email_sent_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          is_active?: boolean;
          subscription_source?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          unsubscribed_at?: string | null;
          last_email_sent_at?: string | null;
        };
      };
    };
    Enums: {
      activity_type:
        | "order"
        | "menu"
        | "staff"
        | "table"
        | "payment"
        | "settings";
      currency: "CHF";
      // | "USD"
      // | "EUR"
      // | "GBP"
      // | "INR"
      // | "AUD"
      // | "AED"
      // | "SEK"
      // | "CAD"
      // | "NZD"
      // | "LKR"
      // | "SGD"
      // | "MYR"
      // | "THB"
      // | "JPY"
      // | "HKD"
      // | "KRW";
      payment_method: "cash" | "card" | "other";
      payment_status: "pending" | "completed" | "failed" | "refunded";
      price_range: "$" | "$$" | "$$$" | "$$$$";
      restaurant_type: "restaurant" | "cafe" | "bar" | "food-truck";
      sentiment: "positive" | "neutral" | "negative";
      staff_role: "owner" | "manager" | "chef" | "server" | "cashier";
      subscription_interval: "monthly" | "yearly";
      subscription_plan: "starter" | "pro" | "elite";
      table_status: "available" | "occupied" | "reserved" | "unavailable";
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled";
      subscription_status:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid";
    };
  };
}

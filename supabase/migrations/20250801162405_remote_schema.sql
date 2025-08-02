drop policy "Users can read their own email verifications" on "public"."email_verifications";

drop policy "Restaurant owners can manage menu item allergens" on "public"."menu_items_allergens";

drop policy "Allow public newsletter subscription" on "public"."newsletter_subscriptions";

drop policy "Allow users to update own subscription" on "public"."newsletter_subscriptions";

drop policy "Allow users to view own subscription" on "public"."newsletter_subscriptions";

drop policy "Users can manage their own newsletter subscriptions" on "public"."newsletter_subscriptions";

drop policy "Allow public order tracking" on "public"."orders";

drop policy "Users can view abandoned orders for their restaurants" on "public"."orders";

drop policy "Users can insert their own password reset tokens" on "public"."password_reset_tokens";

drop policy "Users can update their own password reset tokens" on "public"."password_reset_tokens";

drop policy "Users can view their own password reset tokens" on "public"."password_reset_tokens";

drop policy "Users can view their own restaurant payments" on "public"."payments";

drop policy "Users can insert their own profile" on "public"."profiles";

drop policy "Staff can view staff in same restaurant" on "public"."staff";

drop policy "Restaurant owners can view activity logs" on "public"."activity_logs";

drop policy "Restaurant owners can manage allergens" on "public"."allergens";

drop policy "Service role has full access to email verifications" on "public"."email_verifications";

drop policy "Restaurant owners can manage feedback" on "public"."feedback";

drop policy "Restaurant owners can view their Google Business insights" on "public"."google_business_insights";

drop policy "Restaurant owners can update their review replies" on "public"."google_business_reviews";

drop policy "Restaurant owners can view their Google Business reviews" on "public"."google_business_reviews";

drop policy "Restaurant owners can manage menu categories" on "public"."menu_categories";

drop policy "Restaurant owners can manage menu items" on "public"."menu_items";

drop policy "Allow service role full access" on "public"."newsletter_subscriptions";

drop policy "Users can manage their own notifications" on "public"."notifications";

drop policy "Restaurant owners can manage order items" on "public"."order_items";

drop policy "Restaurant owners can manage orders" on "public"."orders";

drop policy "Service role can manage password reset tokens" on "public"."password_reset_tokens";

drop policy "Allow admin access to payments" on "public"."payments";

drop policy "Restaurant owners can manage payments" on "public"."payments";

drop policy "Enable insert for service role" on "public"."profiles";

drop policy "Users can update their own profile" on "public"."profiles";

drop policy "Users can view their own profile" on "public"."profiles";

drop policy "Authenticated users can view elements" on "public"."restaurant_elements";

drop policy "Restaurant owners can manage elements" on "public"."restaurant_elements";

drop policy "Restaurant owners can insert their own Stripe logs" on "public"."restaurant_stripe_logs";

drop policy "Restaurant owners can view their own Stripe logs" on "public"."restaurant_stripe_logs";

drop policy "System can manage all Stripe logs" on "public"."restaurant_stripe_logs";

drop policy "Allow admin access to restaurants for Stripe updates" on "public"."restaurants";

drop policy "Enable all operations for users based on owner_id" on "public"."restaurants";

drop policy "Users can delete their own restaurants" on "public"."restaurants";

drop policy "Users can insert their own restaurants" on "public"."restaurants";

drop policy "Users can update their own restaurants" on "public"."restaurants";

drop policy "Users can view their own restaurants" on "public"."restaurants";

drop policy "Restaurant owners can manage staff" on "public"."staff";

drop policy "Staff can view own record" on "public"."staff";

drop policy "Allow admin access to subscriptions" on "public"."subscriptions";

drop policy "Restaurant owners can manage subscriptions" on "public"."subscriptions";

drop policy "Restaurant owners can manage tables" on "public"."tables";

drop policy "Users can update table layouts" on "public"."tables";

drop policy "Users can view table layouts" on "public"."tables";

drop policy "Service role can manage webhook events" on "public"."webhook_events";

alter table "public"."orders" drop constraint "orders_order_number_key";

alter table "public"."subscriptions" drop constraint "subscriptions_id_key";

alter table "public"."subscriptions" drop constraint "subscriptions_stripe_subscription_id_key";

drop function if exists "public"."cleanup_abandoned_orders"(timeout_minutes integer);

drop function if exists "public"."debug_all_upload_issues"();

drop function if exists "public"."debug_menu_upload_issue"();

drop function if exists "public"."debug_menu_upload_permissions"();

drop function if exists "public"."debug_menu_upload_permissions_v3"();

drop function if exists "public"."get_abandoned_orders"(timeout_minutes integer);

drop function if exists "public"."get_order_timeout_status"(order_uuid uuid, timeout_minutes integer);

drop view if exists "public"."order_timeout_monitor";

drop index if exists "public"."idx_orders_status_created_at";

drop index if exists "public"."idx_orders_table_status_created";

drop index if exists "public"."idx_subscriptions_stripe_id";

drop index if exists "public"."orders_order_number_idx";

drop index if exists "public"."orders_order_number_key";

drop index if exists "public"."subscriptions_id_key";

drop index if exists "public"."subscriptions_stripe_subscription_id_key";

create table "public"."audit_config" (
    "id" uuid not null default uuid_generate_v4(),
    "table_name" text not null,
    "audit_insert" boolean default true,
    "audit_update" boolean default true,
    "audit_delete" boolean default true,
    "audit_select" boolean default false,
    "track_changes" boolean default true,
    "retention_days" integer default 2555,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."audit_config" enable row level security;

create table "public"."audit_logs" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid,
    "user_id" uuid,
    "table_name" text not null,
    "record_id" uuid,
    "action" text not null,
    "old_values" jsonb,
    "new_values" jsonb,
    "changed_fields" text[],
    "ip_address" inet,
    "user_agent" text,
    "session_id" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."audit_logs" enable row level security;

create table "public"."restaurant_business_info" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid not null,
    "type" restaurant_type not null,
    "cuisine" text,
    "price_range" price_range,
    "seating_capacity" integer,
    "accepts_reservations" boolean default false,
    "delivery_available" boolean default false,
    "takeout_available" boolean default false,
    "tax_rate" numeric not null default 0,
    "vat_number" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."restaurant_business_info" enable row level security;

create table "public"."restaurant_contact_info" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid not null,
    "email" text not null,
    "phone" text,
    "website" text,
    "address" text,
    "city" text,
    "postal_code" text,
    "country" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."restaurant_contact_info" enable row level security;

create table "public"."restaurant_integrations" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid not null,
    "stripe_customer_id" text,
    "stripe_account_id" text,
    "stripe_account_enabled" boolean default false,
    "stripe_account_requirements" jsonb,
    "stripe_account_created_at" timestamp with time zone,
    "stripe_account_deleted" boolean default false,
    "google_business_id" text,
    "google_business_access_token" text,
    "google_business_refresh_token" text,
    "google_business_token_expiry" timestamp with time zone,
    "google_business_sync_enabled" boolean default false,
    "google_business_last_sync" timestamp with time zone,
    "google_business_location_id" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."restaurant_integrations" enable row level security;

create table "public"."restaurant_settings" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid not null,
    "notification_settings" jsonb default '{"newOrders": true, "playSound": true, "tableRequests": true, "kitchenUpdates": false, "paymentReceived": true}'::jsonb,
    "payment_methods" jsonb default '{"cardEnabled": true, "cashEnabled": true}'::jsonb,
    "opening_hours" jsonb,
    "auto_open_close" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."restaurant_settings" enable row level security;

CREATE UNIQUE INDEX audit_config_pkey ON public.audit_config USING btree (id);

CREATE UNIQUE INDEX audit_config_table_name_key ON public.audit_config USING btree (table_name);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE INDEX idx_activity_logs_restaurant_type_created ON public.activity_logs USING btree (restaurant_id, type, created_at DESC);

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);

CREATE INDEX idx_audit_logs_restaurant_id ON public.audit_logs USING btree (restaurant_id);

CREATE INDEX idx_audit_logs_restaurant_table_created ON public.audit_logs USING btree (restaurant_id, table_name, created_at DESC);

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs USING btree (user_id, created_at DESC);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_feedback_restaurant_rating_created ON public.feedback USING btree (restaurant_id, rating, created_at DESC);

CREATE INDEX idx_menu_items_active_only ON public.menu_items USING btree (restaurant_id, category_id, name) WHERE (is_available = true);

CREATE INDEX idx_menu_items_restaurant_available_category ON public.menu_items USING btree (restaurant_id, is_available, category_id);

CREATE INDEX idx_menu_items_restaurant_popular ON public.menu_items USING btree (restaurant_id, is_popular) WHERE (is_popular = true);

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);

CREATE INDEX idx_orders_restaurant_status_created ON public.orders USING btree (restaurant_id, status, created_at DESC);

CREATE INDEX idx_orders_table_status ON public.orders USING btree (table_id, status) WHERE (table_id IS NOT NULL);

CREATE INDEX idx_payments_restaurant_status_created ON public.payments USING btree (restaurant_id, status, created_at DESC);

CREATE INDEX idx_restaurant_business_info_restaurant_id ON public.restaurant_business_info USING btree (restaurant_id);

CREATE INDEX idx_restaurant_business_info_type ON public.restaurant_business_info USING btree (type);

CREATE INDEX idx_restaurant_contact_info_restaurant_id ON public.restaurant_contact_info USING btree (restaurant_id);

CREATE INDEX idx_restaurant_integrations_google_business_id ON public.restaurant_integrations USING btree (google_business_id) WHERE (google_business_id IS NOT NULL);

CREATE INDEX idx_restaurant_integrations_restaurant_id ON public.restaurant_integrations USING btree (restaurant_id);

CREATE INDEX idx_restaurant_integrations_stripe_account_id ON public.restaurant_integrations USING btree (stripe_account_id) WHERE (stripe_account_id IS NOT NULL);

CREATE INDEX idx_restaurant_integrations_stripe_customer_id ON public.restaurant_integrations USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);

CREATE INDEX idx_restaurant_settings_restaurant_id ON public.restaurant_settings USING btree (restaurant_id);

CREATE INDEX idx_restaurants_onboarding_pending ON public.restaurants USING btree (onboarding_completed, created_at) WHERE (onboarding_completed = false);

CREATE INDEX idx_restaurants_subscription_active ON public.restaurants USING btree (subscription_status, is_open) WHERE (subscription_status = 'active'::text);

CREATE INDEX idx_staff_active_only ON public.staff USING btree (restaurant_id, role) WHERE (is_active = true);

CREATE INDEX idx_staff_restaurant_active_role ON public.staff USING btree (restaurant_id, is_active, role);

CREATE INDEX idx_subscriptions_restaurant_status_period ON public.subscriptions USING btree (restaurant_id, status, current_period_end);

CREATE INDEX idx_tables_active_only ON public.tables USING btree (restaurant_id, number) WHERE (is_active = true);

CREATE INDEX idx_tables_restaurant_status_active ON public.tables USING btree (restaurant_id, status, is_active);

CREATE UNIQUE INDEX restaurant_business_info_pkey ON public.restaurant_business_info USING btree (id);

CREATE UNIQUE INDEX restaurant_business_info_restaurant_id_key ON public.restaurant_business_info USING btree (restaurant_id);

CREATE UNIQUE INDEX restaurant_contact_info_pkey ON public.restaurant_contact_info USING btree (id);

CREATE UNIQUE INDEX restaurant_contact_info_restaurant_id_key ON public.restaurant_contact_info USING btree (restaurant_id);

CREATE UNIQUE INDEX restaurant_integrations_pkey ON public.restaurant_integrations USING btree (id);

CREATE UNIQUE INDEX restaurant_integrations_restaurant_id_key ON public.restaurant_integrations USING btree (restaurant_id);

CREATE UNIQUE INDEX restaurant_settings_pkey ON public.restaurant_settings USING btree (id);

CREATE UNIQUE INDEX restaurant_settings_restaurant_id_key ON public.restaurant_settings USING btree (restaurant_id);

alter table "public"."audit_config" add constraint "audit_config_pkey" PRIMARY KEY using index "audit_config_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."restaurant_business_info" add constraint "restaurant_business_info_pkey" PRIMARY KEY using index "restaurant_business_info_pkey";

alter table "public"."restaurant_contact_info" add constraint "restaurant_contact_info_pkey" PRIMARY KEY using index "restaurant_contact_info_pkey";

alter table "public"."restaurant_integrations" add constraint "restaurant_integrations_pkey" PRIMARY KEY using index "restaurant_integrations_pkey";

alter table "public"."restaurant_settings" add constraint "restaurant_settings_pkey" PRIMARY KEY using index "restaurant_settings_pkey";

alter table "public"."audit_config" add constraint "audit_config_table_name_key" UNIQUE using index "audit_config_table_name_key";

alter table "public"."audit_logs" add constraint "audit_logs_action_check" CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text, 'SELECT'::text, 'LOGIN'::text, 'LOGOUT'::text, 'PASSWORD_CHANGE'::text, 'PERMISSION_CHANGE'::text]))) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_action_check";

alter table "public"."restaurant_business_info" add constraint "restaurant_business_info_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_business_info" validate constraint "restaurant_business_info_restaurant_id_fkey";

alter table "public"."restaurant_business_info" add constraint "restaurant_business_info_restaurant_id_key" UNIQUE using index "restaurant_business_info_restaurant_id_key";

alter table "public"."restaurant_contact_info" add constraint "restaurant_contact_info_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_contact_info" validate constraint "restaurant_contact_info_restaurant_id_fkey";

alter table "public"."restaurant_contact_info" add constraint "restaurant_contact_info_restaurant_id_key" UNIQUE using index "restaurant_contact_info_restaurant_id_key";

alter table "public"."restaurant_integrations" add constraint "restaurant_integrations_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_integrations" validate constraint "restaurant_integrations_restaurant_id_fkey";

alter table "public"."restaurant_integrations" add constraint "restaurant_integrations_restaurant_id_key" UNIQUE using index "restaurant_integrations_restaurant_id_key";

alter table "public"."restaurant_settings" add constraint "restaurant_settings_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_settings" validate constraint "restaurant_settings_restaurant_id_fkey";

alter table "public"."restaurant_settings" add constraint "restaurant_settings_restaurant_id_key" UNIQUE using index "restaurant_settings_restaurant_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.audit_activity_logs_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'activity_logs', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_email_verifications_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'email_verifications', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_feedback_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'feedback', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_google_business_insights_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'google_business_insights', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_google_business_reviews_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'google_business_reviews', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_menu_categories_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'menu_categories', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_menu_items_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'menu_items', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_newsletter_subscriptions_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'newsletter_subscriptions', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_notifications_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'notifications', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_orders_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'orders', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_password_reset_tokens_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'password_reset_tokens', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_payments_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'payments', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_profiles_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'profiles', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_restaurant_elements_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'restaurant_elements', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_restaurant_stripe_logs_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'restaurant_stripe_logs', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_restaurants_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'restaurants', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_staff_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'staff', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_subscriptions_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'subscriptions', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_tables_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'tables', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.audit_webhook_events_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                v_action := 'INSERT';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = 'UPDATE' THEN
                v_action := 'UPDATE';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = 'DELETE' THEN
                v_action := 'DELETE';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                'webhook_events', v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted_count integer := 0;
    v_retention_days integer;
    v_table_name text;
BEGIN
    -- Clean up audit logs based on retention policy
    FOR v_table_name, v_retention_days IN 
        SELECT "table_name", "retention_days" 
        FROM "public"."audit_config"
    LOOP
        DELETE FROM "public"."audit_logs" 
        WHERE "table_name" = v_table_name 
        AND "created_at" < NOW() - INTERVAL '1 day' * v_retention_days;
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % audit logs for table % older than % days', v_deleted_count, v_table_name, v_retention_days;
    END LOOP;
    
    RETURN v_deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_audit_trigger(p_table_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_trigger_name text;
    v_function_name text;
    v_id_column_type text;
BEGIN
    v_trigger_name := 'audit_' || p_table_name || '_trigger';
    v_function_name := 'audit_' || p_table_name || '_function';
    
    -- Get the data type of the id column
    SELECT data_type INTO v_id_column_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = 'id';
    
    -- Create the trigger function
    EXECUTE format('
        CREATE OR REPLACE FUNCTION %I() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''public'' AS $func$
        DECLARE
            v_old_values jsonb;
            v_new_values jsonb;
            v_changed_fields text[];
            v_action text;
            v_record_id text;
        BEGIN
            IF TG_OP = ''INSERT'' THEN
                v_action := ''INSERT'';
                v_new_values := to_jsonb(NEW);
                v_record_id := COALESCE(NEW.id::text, NULL);
            ELSIF TG_OP = ''UPDATE'' THEN
                v_action := ''UPDATE'';
                v_old_values := to_jsonb(OLD);
                v_new_values := to_jsonb(NEW);
                v_changed_fields := public.get_changed_fields(v_old_values, v_new_values);
                v_record_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
            ELSIF TG_OP = ''DELETE'' THEN
                v_action := ''DELETE'';
                v_old_values := to_jsonb(OLD);
                v_record_id := COALESCE(OLD.id::text, NULL);
            END IF;
            
            PERFORM public.log_audit_event(
                %L, v_record_id, v_action, v_old_values, v_new_values, v_changed_fields
            );
            
            IF TG_OP = ''DELETE'' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $func$;
    ', v_function_name, p_table_name);
    
    -- Create the trigger
    EXECUTE format('
        DROP TRIGGER IF EXISTS %I ON %I;
        CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION %I();
    ', v_trigger_name, p_table_name, v_trigger_name, p_table_name, v_function_name);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order_id uuid, p_restaurant_id uuid, p_table_id uuid, p_order_number text, p_total_amount numeric, p_tax_amount numeric, p_tip_amount numeric DEFAULT 0, p_customer_name text DEFAULT NULL::text, p_customer_email text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_item record;
  v_result jsonb;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (
      id,
      restaurant_id,
      table_id,
      order_number,
      total_amount,
      tax_amount,
      tip_amount,
      customer_name,
      customer_email,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_order_id,
      p_restaurant_id,
      p_table_id,
      p_order_number,
      p_total_amount,
      p_tax_amount,
      p_tip_amount,
      p_customer_name,
      p_customer_email,
      p_notes,
      'pending',
      NOW(),
      NOW()
    ) RETURNING id INTO v_order_id;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO order_items (
        order_id,
        menu_item_id,
        quantity,
        unit_price,
        total_price,
        notes,
        created_at
      ) VALUES (
        v_order_id,
        (v_item->>'menu_item_id')::uuid,
        (v_item->>'quantity')::integer,
        (v_item->>'unit_price')::numeric,
        (v_item->>'total_price')::numeric,
        v_item->>'notes',
        NOW()
      );
    END LOOP;

    -- Return success result
    v_result := jsonb_build_object(
      'success', true,
      'order_id', v_order_id,
      'order_number', p_order_number,
      'message', 'Order created successfully'
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction
      RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_order_number(restaurant_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_year integer;
  v_sequence integer;
  v_order_number text;
  v_lock_key integer;
  v_max_retries integer := 10;
  v_retry_count integer := 0;
BEGIN
  -- Use restaurant_id hash as advisory lock key to prevent race conditions
  v_lock_key := abs(hashtext(restaurant_id::text));
  
  -- Try to acquire advisory lock with retry mechanism
  WHILE v_retry_count < v_max_retries LOOP
    IF pg_try_advisory_lock(v_lock_key) THEN
      -- Lock acquired, proceed with order number generation
      BEGIN
        v_year := EXTRACT(YEAR FROM NOW());
        
        -- Get the next sequence number for this restaurant and year
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-' || v_year || '-(\\d+)') AS integer)), 0) + 1
        INTO v_sequence
        FROM orders
        WHERE restaurant_id = generate_order_number.restaurant_id
          AND order_number LIKE 'ORD-' || v_year || '-%';
        
        -- Format order number
        v_order_number := 'ORD-' || v_year || '-' || LPAD(v_sequence::text, 3, '0');
        
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(v_lock_key);
        
        RETURN v_order_number;
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Release lock on error
          PERFORM pg_advisory_unlock(v_lock_key);
          RAISE;
      END;
    ELSE
      -- Lock not acquired, wait a bit and retry
      v_retry_count := v_retry_count + 1;
      PERFORM pg_sleep(0.01 * v_retry_count); -- Exponential backoff
    END IF;
  END LOOP;
  
  -- If we couldn't acquire the lock after max retries, use timestamp-based fallback
  RETURN 'ORD-' || v_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::integer::text, 10, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_audit_trail(p_table_name text, p_record_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, action text, old_values jsonb, new_values jsonb, changed_fields text[], user_id uuid, created_at timestamp with time zone, ip_address inet, user_agent text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        al."id", al."action", al."old_values", al."new_values", al."changed_fields",
        al."user_id", al."created_at", al."ip_address", al."user_agent"
    FROM "public"."audit_logs" al
    WHERE al."table_name" = p_table_name 
    AND al."record_id" = p_record_id
    ORDER BY al."created_at" DESC
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_changed_fields(p_old_values jsonb, p_new_values jsonb)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v_changed_fields text[] := '{}';
    v_key text;
    v_old_value jsonb;
    v_new_value jsonb;
BEGIN
    IF p_old_values IS NULL OR p_new_values IS NULL THEN
        RETURN v_changed_fields;
    END IF;
    
    FOR v_key IN SELECT jsonb_object_keys(p_new_values) LOOP
        v_old_value := p_old_values->v_key;
        v_new_value := p_new_values->v_key;
        
        IF v_old_value IS DISTINCT FROM v_new_value THEN
            v_changed_fields := array_append(v_changed_fields, v_key);
        END IF;
    END LOOP;
    
    RETURN v_changed_fields;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_table_name text, p_record_id text, p_action text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_changed_fields text[] DEFAULT NULL::text[], p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_restaurant_id uuid;
    v_user_id uuid;
    v_ip_address inet;
    v_user_agent text;
    v_session_id text;
    v_record_uuid uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Try to convert record_id to uuid if possible
    BEGIN
        v_record_uuid := p_record_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_record_uuid := NULL;
    END;
    
    -- Determine restaurant_id based on table and record
    IF p_table_name = 'restaurants' AND v_record_uuid IS NOT NULL THEN
        v_restaurant_id := v_record_uuid;
    ELSIF p_table_name IN ('orders', 'payments', 'staff', 'menu_items', 'menu_categories', 'tables', 'feedback', 'subscriptions') THEN
        -- Try to get restaurant_id from the record
        BEGIN
            EXECUTE format('SELECT restaurant_id FROM %I WHERE id = $1', p_table_name) 
            INTO v_restaurant_id 
            USING v_record_uuid;
        EXCEPTION WHEN OTHERS THEN
            v_restaurant_id := NULL;
        END;
    END IF;
    
    -- Get request context
    v_ip_address := inet_client_addr();
    v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
    v_session_id := current_setting('request.headers', true)::jsonb->>'x-session-id';
    
    -- Insert audit log
    INSERT INTO "public"."audit_logs" (
        "restaurant_id", "user_id", "table_name", "record_id", "action", 
        "old_values", "new_values", "changed_fields", "ip_address", 
        "user_agent", "session_id", "metadata"
    ) VALUES (
        v_restaurant_id, v_user_id, p_table_name, v_record_uuid, p_action,
        p_old_values, p_new_values, p_changed_fields, v_ip_address,
        v_user_agent, v_session_id, p_metadata
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_table_name text, p_record_id uuid, p_action text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_changed_fields text[] DEFAULT NULL::text[], p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Call the text version
    PERFORM "public"."log_audit_event"(
        p_table_name, 
        p_record_id::text, 
        p_action, 
        p_old_values, 
        p_new_values, 
        p_changed_fields, 
        p_metadata
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_restaurant_business_info_to_main()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE "public"."restaurants" SET
            "type" = NEW."type",
            "cuisine" = NEW."cuisine",
            "price_range" = NEW."price_range",
            "seating_capacity" = NEW."seating_capacity",
            "accepts_reservations" = NEW."accepts_reservations",
            "delivery_available" = NEW."delivery_available",
            "takeout_available" = NEW."takeout_available",
            "tax_rate" = NEW."tax_rate",
            "vat_number" = NEW."vat_number",
            "updated_at" = NOW()
        WHERE "id" = NEW."restaurant_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."restaurants" SET
            "type" = NULL,
            "cuisine" = NULL,
            "price_range" = NULL,
            "seating_capacity" = NULL,
            "accepts_reservations" = NULL,
            "delivery_available" = NULL,
            "takeout_available" = NULL,
            "tax_rate" = NULL,
            "vat_number" = NULL,
            "updated_at" = NOW()
        WHERE "id" = OLD."restaurant_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_restaurant_contact_info_to_main()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE "public"."restaurants" SET
            "email" = NEW."email",
            "phone" = NEW."phone",
            "website" = NEW."website",
            "address" = NEW."address",
            "city" = NEW."city",
            "postal_code" = NEW."postal_code",
            "country" = NEW."country",
            "updated_at" = NOW()
        WHERE "id" = NEW."restaurant_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."restaurants" SET
            "email" = NULL,
            "phone" = NULL,
            "website" = NULL,
            "address" = NULL,
            "city" = NULL,
            "postal_code" = NULL,
            "country" = NULL,
            "updated_at" = NOW()
        WHERE "id" = OLD."restaurant_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_restaurant_integrations_to_main()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE "public"."restaurants" SET
            "stripe_customer_id" = NEW."stripe_customer_id",
            "stripe_account_id" = NEW."stripe_account_id",
            "stripe_account_enabled" = NEW."stripe_account_enabled",
            "stripe_account_requirements" = NEW."stripe_account_requirements",
            "stripe_account_created_at" = NEW."stripe_account_created_at",
            "stripe_account_deleted" = NEW."stripe_account_deleted",
            "google_business_id" = NEW."google_business_id",
            "google_business_access_token" = NEW."google_business_access_token",
            "google_business_refresh_token" = NEW."google_business_refresh_token",
            "google_business_token_expiry" = NEW."google_business_token_expiry",
            "google_business_sync_enabled" = NEW."google_business_sync_enabled",
            "google_business_last_sync" = NEW."google_business_last_sync",
            "google_business_location_id" = NEW."google_business_location_id",
            "updated_at" = NOW()
        WHERE "id" = NEW."restaurant_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."restaurants" SET
            "stripe_customer_id" = NULL,
            "stripe_account_id" = NULL,
            "stripe_account_enabled" = NULL,
            "stripe_account_requirements" = NULL,
            "stripe_account_created_at" = NULL,
            "stripe_account_deleted" = NULL,
            "google_business_id" = NULL,
            "google_business_access_token" = NULL,
            "google_business_refresh_token" = NULL,
            "google_business_token_expiry" = NULL,
            "google_business_sync_enabled" = NULL,
            "google_business_last_sync" = NULL,
            "google_business_location_id" = NULL,
            "updated_at" = NOW()
        WHERE "id" = OLD."restaurant_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_restaurant_settings_to_main()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE "public"."restaurants" SET
            "notification_settings" = NEW."notification_settings",
            "payment_methods" = NEW."payment_methods",
            "opening_hours" = NEW."opening_hours",
            "auto_open_close" = NEW."auto_open_close",
            "updated_at" = NOW()
        WHERE "id" = NEW."restaurant_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."restaurants" SET
            "notification_settings" = NULL,
            "payment_methods" = NULL,
            "opening_hours" = NULL,
            "auto_open_close" = NULL,
            "updated_at" = NOW()
        WHERE "id" = OLD."restaurant_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

grant delete on table "public"."audit_config" to "anon";

grant insert on table "public"."audit_config" to "anon";

grant references on table "public"."audit_config" to "anon";

grant select on table "public"."audit_config" to "anon";

grant trigger on table "public"."audit_config" to "anon";

grant truncate on table "public"."audit_config" to "anon";

grant update on table "public"."audit_config" to "anon";

grant delete on table "public"."audit_config" to "authenticated";

grant insert on table "public"."audit_config" to "authenticated";

grant references on table "public"."audit_config" to "authenticated";

grant select on table "public"."audit_config" to "authenticated";

grant trigger on table "public"."audit_config" to "authenticated";

grant truncate on table "public"."audit_config" to "authenticated";

grant update on table "public"."audit_config" to "authenticated";

grant delete on table "public"."audit_config" to "service_role";

grant insert on table "public"."audit_config" to "service_role";

grant references on table "public"."audit_config" to "service_role";

grant select on table "public"."audit_config" to "service_role";

grant trigger on table "public"."audit_config" to "service_role";

grant truncate on table "public"."audit_config" to "service_role";

grant update on table "public"."audit_config" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."restaurant_business_info" to "anon";

grant insert on table "public"."restaurant_business_info" to "anon";

grant references on table "public"."restaurant_business_info" to "anon";

grant select on table "public"."restaurant_business_info" to "anon";

grant trigger on table "public"."restaurant_business_info" to "anon";

grant truncate on table "public"."restaurant_business_info" to "anon";

grant update on table "public"."restaurant_business_info" to "anon";

grant delete on table "public"."restaurant_business_info" to "authenticated";

grant insert on table "public"."restaurant_business_info" to "authenticated";

grant references on table "public"."restaurant_business_info" to "authenticated";

grant select on table "public"."restaurant_business_info" to "authenticated";

grant trigger on table "public"."restaurant_business_info" to "authenticated";

grant truncate on table "public"."restaurant_business_info" to "authenticated";

grant update on table "public"."restaurant_business_info" to "authenticated";

grant delete on table "public"."restaurant_business_info" to "service_role";

grant insert on table "public"."restaurant_business_info" to "service_role";

grant references on table "public"."restaurant_business_info" to "service_role";

grant select on table "public"."restaurant_business_info" to "service_role";

grant trigger on table "public"."restaurant_business_info" to "service_role";

grant truncate on table "public"."restaurant_business_info" to "service_role";

grant update on table "public"."restaurant_business_info" to "service_role";

grant delete on table "public"."restaurant_contact_info" to "anon";

grant insert on table "public"."restaurant_contact_info" to "anon";

grant references on table "public"."restaurant_contact_info" to "anon";

grant select on table "public"."restaurant_contact_info" to "anon";

grant trigger on table "public"."restaurant_contact_info" to "anon";

grant truncate on table "public"."restaurant_contact_info" to "anon";

grant update on table "public"."restaurant_contact_info" to "anon";

grant delete on table "public"."restaurant_contact_info" to "authenticated";

grant insert on table "public"."restaurant_contact_info" to "authenticated";

grant references on table "public"."restaurant_contact_info" to "authenticated";

grant select on table "public"."restaurant_contact_info" to "authenticated";

grant trigger on table "public"."restaurant_contact_info" to "authenticated";

grant truncate on table "public"."restaurant_contact_info" to "authenticated";

grant update on table "public"."restaurant_contact_info" to "authenticated";

grant delete on table "public"."restaurant_contact_info" to "service_role";

grant insert on table "public"."restaurant_contact_info" to "service_role";

grant references on table "public"."restaurant_contact_info" to "service_role";

grant select on table "public"."restaurant_contact_info" to "service_role";

grant trigger on table "public"."restaurant_contact_info" to "service_role";

grant truncate on table "public"."restaurant_contact_info" to "service_role";

grant update on table "public"."restaurant_contact_info" to "service_role";

grant delete on table "public"."restaurant_integrations" to "anon";

grant insert on table "public"."restaurant_integrations" to "anon";

grant references on table "public"."restaurant_integrations" to "anon";

grant select on table "public"."restaurant_integrations" to "anon";

grant trigger on table "public"."restaurant_integrations" to "anon";

grant truncate on table "public"."restaurant_integrations" to "anon";

grant update on table "public"."restaurant_integrations" to "anon";

grant delete on table "public"."restaurant_integrations" to "authenticated";

grant insert on table "public"."restaurant_integrations" to "authenticated";

grant references on table "public"."restaurant_integrations" to "authenticated";

grant select on table "public"."restaurant_integrations" to "authenticated";

grant trigger on table "public"."restaurant_integrations" to "authenticated";

grant truncate on table "public"."restaurant_integrations" to "authenticated";

grant update on table "public"."restaurant_integrations" to "authenticated";

grant delete on table "public"."restaurant_integrations" to "service_role";

grant insert on table "public"."restaurant_integrations" to "service_role";

grant references on table "public"."restaurant_integrations" to "service_role";

grant select on table "public"."restaurant_integrations" to "service_role";

grant trigger on table "public"."restaurant_integrations" to "service_role";

grant truncate on table "public"."restaurant_integrations" to "service_role";

grant update on table "public"."restaurant_integrations" to "service_role";

grant delete on table "public"."restaurant_settings" to "anon";

grant insert on table "public"."restaurant_settings" to "anon";

grant references on table "public"."restaurant_settings" to "anon";

grant select on table "public"."restaurant_settings" to "anon";

grant trigger on table "public"."restaurant_settings" to "anon";

grant truncate on table "public"."restaurant_settings" to "anon";

grant update on table "public"."restaurant_settings" to "anon";

grant delete on table "public"."restaurant_settings" to "authenticated";

grant insert on table "public"."restaurant_settings" to "authenticated";

grant references on table "public"."restaurant_settings" to "authenticated";

grant select on table "public"."restaurant_settings" to "authenticated";

grant trigger on table "public"."restaurant_settings" to "authenticated";

grant truncate on table "public"."restaurant_settings" to "authenticated";

grant update on table "public"."restaurant_settings" to "authenticated";

grant delete on table "public"."restaurant_settings" to "service_role";

grant insert on table "public"."restaurant_settings" to "service_role";

grant references on table "public"."restaurant_settings" to "service_role";

grant select on table "public"."restaurant_settings" to "service_role";

grant trigger on table "public"."restaurant_settings" to "service_role";

grant truncate on table "public"."restaurant_settings" to "service_role";

grant update on table "public"."restaurant_settings" to "service_role";

create policy "Service role can manage audit config"
on "public"."audit_config"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners can view their audit logs"
on "public"."audit_logs"
as permissive
for select
to public
using (( SELECT (auth.uid() = audit_logs.restaurant_id)));


create policy "Service role can manage audit logs"
on "public"."audit_logs"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners and staff can manage menu item allergens"
on "public"."menu_items_allergens"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM (menu_items mi
     JOIN restaurants r ON ((r.id = mi.restaurant_id)))
  WHERE ((mi.id = menu_items_allergens.menu_item_id) AND (r.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (menu_items mi
     JOIN staff s ON ((s.restaurant_id = mi.restaurant_id)))
  WHERE ((mi.id = menu_items_allergens.menu_item_id) AND (s.user_id = auth.uid()) AND (s.is_active = true) AND (s.permissions @> ARRAY['menu.manage'::text]))))));


create policy "Restaurant owners can manage their business info"
on "public"."restaurant_business_info"
as permissive
for all
to public
using (( SELECT (auth.uid() = restaurant_business_info.restaurant_id)));


create policy "Restaurant owners can manage their contact info"
on "public"."restaurant_contact_info"
as permissive
for all
to public
using (( SELECT (auth.uid() = restaurant_contact_info.restaurant_id)));


create policy "Restaurant owners can manage their integrations"
on "public"."restaurant_integrations"
as permissive
for all
to public
using (( SELECT (auth.uid() = restaurant_integrations.restaurant_id)));


create policy "Service role can manage integrations"
on "public"."restaurant_integrations"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners can manage their settings"
on "public"."restaurant_settings"
as permissive
for all
to public
using (( SELECT (auth.uid() = restaurant_settings.restaurant_id)));


create policy "Staff can view other staff if owner"
on "public"."staff"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = staff.restaurant_id) AND (r.owner_id = auth.uid())))));


create policy "Restaurant owners can view activity logs"
on "public"."activity_logs"
as permissive
for select
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = activity_logs.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can manage allergens"
on "public"."allergens"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = allergens.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Service role has full access to email verifications"
on "public"."email_verifications"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners can manage feedback"
on "public"."feedback"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = feedback.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can view their Google Business insights"
on "public"."google_business_insights"
as permissive
for select
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = google_business_insights.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can update their review replies"
on "public"."google_business_reviews"
as permissive
for update
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = google_business_reviews.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can view their Google Business reviews"
on "public"."google_business_reviews"
as permissive
for select
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = google_business_reviews.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can manage menu categories"
on "public"."menu_categories"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = menu_categories.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can manage menu items"
on "public"."menu_items"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = menu_items.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Allow service role full access"
on "public"."newsletter_subscriptions"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Users can manage their own notifications"
on "public"."notifications"
as permissive
for all
to public
using (( SELECT (notifications.user_id = auth.uid())));


create policy "Restaurant owners can manage order items"
on "public"."order_items"
as permissive
for all
to public
using (( SELECT (auth.uid() = ( SELECT orders.restaurant_id
           FROM orders
          WHERE (orders.id = order_items.order_id)))));


create policy "Restaurant owners can manage orders"
on "public"."orders"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = orders.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Service role can manage password reset tokens"
on "public"."password_reset_tokens"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Allow admin access to payments"
on "public"."payments"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners can manage payments"
on "public"."payments"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = payments.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Enable insert for service role"
on "public"."profiles"
as permissive
for insert
to public
with check (( SELECT (auth.role() = 'service_role'::text)));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using (( SELECT (profiles.id = auth.uid())))
with check (( SELECT (profiles.id = auth.uid())));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using (( SELECT (profiles.id = auth.uid())));


create policy "Authenticated users can view elements"
on "public"."restaurant_elements"
as permissive
for select
to public
using (( SELECT (auth.role() = 'authenticated'::text)));


create policy "Restaurant owners can manage elements"
on "public"."restaurant_elements"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = restaurant_elements.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can insert their own Stripe logs"
on "public"."restaurant_stripe_logs"
as permissive
for insert
to public
with check (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = restaurant_stripe_logs.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can view their own Stripe logs"
on "public"."restaurant_stripe_logs"
as permissive
for select
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = restaurant_stripe_logs.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "System can manage all Stripe logs"
on "public"."restaurant_stripe_logs"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Allow admin access to restaurants for Stripe updates"
on "public"."restaurants"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Enable all operations for users based on owner_id"
on "public"."restaurants"
as permissive
for all
to public
using (( SELECT (auth.uid() = restaurants.owner_id)));


create policy "Users can delete their own restaurants"
on "public"."restaurants"
as permissive
for delete
to public
using (( SELECT (restaurants.owner_id = auth.uid())));


create policy "Users can insert their own restaurants"
on "public"."restaurants"
as permissive
for insert
to public
with check (( SELECT (restaurants.owner_id = auth.uid())));


create policy "Users can update their own restaurants"
on "public"."restaurants"
as permissive
for update
to public
using (( SELECT (restaurants.owner_id = auth.uid())))
with check (( SELECT (restaurants.owner_id = auth.uid())));


create policy "Users can view their own restaurants"
on "public"."restaurants"
as permissive
for select
to public
using (( SELECT (restaurants.owner_id = auth.uid())));


create policy "Restaurant owners can manage staff"
on "public"."staff"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = staff.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Staff can view own record"
on "public"."staff"
as permissive
for select
to public
using (( SELECT (staff.user_id = auth.uid())));


create policy "Allow admin access to subscriptions"
on "public"."subscriptions"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


create policy "Restaurant owners can manage subscriptions"
on "public"."subscriptions"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = subscriptions.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Restaurant owners can manage tables"
on "public"."tables"
as permissive
for all
to public
using (( SELECT (EXISTS ( SELECT 1
           FROM restaurants r
          WHERE ((r.id = tables.restaurant_id) AND (r.owner_id = auth.uid())))) AS "exists"));


create policy "Users can update table layouts"
on "public"."tables"
as permissive
for update
to public
using (( SELECT (auth.uid() = tables.restaurant_id)));


create policy "Users can view table layouts"
on "public"."tables"
as permissive
for select
to public
using (( SELECT (auth.uid() = tables.restaurant_id)));


create policy "Service role can manage webhook events"
on "public"."webhook_events"
as permissive
for all
to public
using (( SELECT (auth.role() = 'service_role'::text)));


CREATE TRIGGER audit_activity_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION audit_activity_logs_function();

CREATE TRIGGER audit_email_verifications_trigger AFTER INSERT OR DELETE OR UPDATE ON public.email_verifications FOR EACH ROW EXECUTE FUNCTION audit_email_verifications_function();

CREATE TRIGGER audit_feedback_trigger AFTER INSERT OR DELETE OR UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION audit_feedback_function();

CREATE TRIGGER audit_google_business_insights_trigger AFTER INSERT OR DELETE OR UPDATE ON public.google_business_insights FOR EACH ROW EXECUTE FUNCTION audit_google_business_insights_function();

CREATE TRIGGER audit_google_business_reviews_trigger AFTER INSERT OR DELETE OR UPDATE ON public.google_business_reviews FOR EACH ROW EXECUTE FUNCTION audit_google_business_reviews_function();

CREATE TRIGGER audit_menu_categories_trigger AFTER INSERT OR DELETE OR UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION audit_menu_categories_function();

CREATE TRIGGER audit_menu_items_trigger AFTER INSERT OR DELETE OR UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION audit_menu_items_function();

CREATE TRIGGER audit_newsletter_subscriptions_trigger AFTER INSERT OR DELETE OR UPDATE ON public.newsletter_subscriptions FOR EACH ROW EXECUTE FUNCTION audit_newsletter_subscriptions_function();

CREATE TRIGGER audit_notifications_trigger AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION audit_notifications_function();

CREATE TRIGGER audit_orders_trigger AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION audit_orders_function();

CREATE TRIGGER audit_password_reset_tokens_trigger AFTER INSERT OR DELETE OR UPDATE ON public.password_reset_tokens FOR EACH ROW EXECUTE FUNCTION audit_password_reset_tokens_function();

CREATE TRIGGER audit_payments_trigger AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION audit_payments_function();

CREATE TRIGGER audit_profiles_trigger AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION audit_profiles_function();

CREATE TRIGGER sync_restaurant_business_info_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_business_info FOR EACH ROW EXECUTE FUNCTION sync_restaurant_business_info_to_main();

CREATE TRIGGER sync_restaurant_contact_info_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_contact_info FOR EACH ROW EXECUTE FUNCTION sync_restaurant_contact_info_to_main();

CREATE TRIGGER audit_restaurant_elements_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_elements FOR EACH ROW EXECUTE FUNCTION audit_restaurant_elements_function();

CREATE TRIGGER sync_restaurant_integrations_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_integrations FOR EACH ROW EXECUTE FUNCTION sync_restaurant_integrations_to_main();

CREATE TRIGGER sync_restaurant_settings_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION sync_restaurant_settings_to_main();

CREATE TRIGGER audit_restaurant_stripe_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurant_stripe_logs FOR EACH ROW EXECUTE FUNCTION audit_restaurant_stripe_logs_function();

CREATE TRIGGER audit_restaurants_trigger AFTER INSERT OR DELETE OR UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION audit_restaurants_function();

CREATE TRIGGER audit_staff_trigger AFTER INSERT OR DELETE OR UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION audit_staff_function();

CREATE TRIGGER audit_subscriptions_trigger AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION audit_subscriptions_function();

CREATE TRIGGER audit_tables_trigger AFTER INSERT OR DELETE OR UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION audit_tables_function();

CREATE TRIGGER audit_webhook_events_trigger AFTER INSERT OR DELETE OR UPDATE ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION audit_webhook_events_function();



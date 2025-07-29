

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_type" AS ENUM (
    'order',
    'menu',
    'staff',
    'table',
    'payment',
    'settings'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."currency" AS ENUM (
    'USD',
    'CHF',
    'EUR',
    'GBP',
    'INR',
    'AUD',
    'AED',
    'SEK',
    'CAD',
    'NZD',
    'LKR',
    'SGD',
    'MYR',
    'THB',
    'JPY',
    'HKD',
    'KRW'
);


ALTER TYPE "public"."currency" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'preparing',
    'ready',
    'served',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'card',
    'other'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."price_range" AS ENUM (
    '$',
    '$$',
    '$$$',
    '$$$$'
);


ALTER TYPE "public"."price_range" OWNER TO "postgres";


CREATE TYPE "public"."restaurant_type" AS ENUM (
    'restaurant',
    'cafe',
    'bar',
    'food-truck',
    'pizzeria',
    'sushi',
    'steakhouse',
    'bakery',
    'brewery',
    'food-court',
    'catering',
    'ghost-kitchen'
);


ALTER TYPE "public"."restaurant_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."restaurant_type" IS 'Restaurant type enum with expanded options for better categorization';



CREATE TYPE "public"."sentiment" AS ENUM (
    'positive',
    'neutral',
    'negative'
);


ALTER TYPE "public"."sentiment" OWNER TO "postgres";


CREATE TYPE "public"."staff_permission" AS ENUM (
    'orders.view',
    'orders.manage',
    'kitchen.view',
    'kitchen.manage',
    'menu.view',
    'menu.manage',
    'menu.categories',
    'menu.pricing',
    'tables.view',
    'tables.manage',
    'qr.view',
    'qr.manage',
    'analytics.view',
    'analytics.detailed',
    'analytics.export',
    'staff.view',
    'staff.manage',
    'staff.permissions',
    'payments.view',
    'payments.manage',
    'billing.view',
    'billing.manage',
    'settings.view',
    'settings.manage',
    'settings.branding'
);


ALTER TYPE "public"."staff_permission" OWNER TO "postgres";


CREATE TYPE "public"."staff_role" AS ENUM (
    'owner',
    'manager',
    'chef',
    'server',
    'cashier'
);


ALTER TYPE "public"."staff_role" OWNER TO "postgres";


CREATE TYPE "public"."subscription_interval" AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE "public"."subscription_interval" OWNER TO "postgres";


CREATE TYPE "public"."subscription_plan" AS ENUM (
    'starter',
    'pro',
    'elite'
);


ALTER TYPE "public"."subscription_plan" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."table_status" AS ENUM (
    'available',
    'occupied',
    'reserved',
    'unavailable'
);


ALTER TYPE "public"."table_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_default_menu_data"("p_restaurant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Add default categories
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (p_restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (p_restaurant_id, 'Mains', 'Main course dishes', 2),
    (p_restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (p_restaurant_id, 'Drinks', 'Beverages and drinks', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (p_restaurant_id, 'Gluten', '🌾'),
    (p_restaurant_id, 'Dairy', '🥛'),
    (p_restaurant_id, 'Eggs', '🥚'),
    (p_restaurant_id, 'Nuts', '🥜'),
    (p_restaurant_id, 'Soy', '🫘'),
    (p_restaurant_id, 'Shellfish', '🦐'),
    (p_restaurant_id, 'Fish', '🐟'),
    (p_restaurant_id, 'Sulfites', '🍷'),
    (p_restaurant_id, 'Peanuts', '🥜'),
    (p_restaurant_id, 'Tree Nuts', '🌰'),
    (p_restaurant_id, 'Wheat', '🌾'),
    (p_restaurant_id, 'Lactose', '🥛'),
    (p_restaurant_id, 'Molluscs', '🦪'),
    (p_restaurant_id, 'Celery', '🥬'),
    (p_restaurant_id, 'Mustard', '🌶️'),
    (p_restaurant_id, 'Sesame', '⚪'),
    (p_restaurant_id, 'Lupin', '🫘'),
    (p_restaurant_id, 'Crustaceans', '🦞')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."add_default_menu_data"("p_restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_update_table_layouts"("layout_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  layout_item JSONB;
BEGIN
  FOR layout_item IN SELECT * FROM jsonb_array_elements(layout_data)
  LOOP
    UPDATE tables 
    SET 
      layout_x = (layout_item->>'x')::INTEGER,
      layout_y = (layout_item->>'y')::INTEGER,
      layout_rotation = (layout_item->>'rotation')::INTEGER,
      layout_width = (layout_item->>'width')::INTEGER,
      layout_height = (layout_item->>'height')::INTEGER,
      updated_at = NOW()
    WHERE id = (layout_item->>'id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."bulk_update_table_layouts"("layout_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") RETURNS TABLE("table_id" "uuid", "table_number" "text", "current_qr_code" "text", "expected_qr_code" "text", "needs_update" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    RETURN QUERY
    SELECT 
        t.id,
        t.number,
        t.qr_code,
        base_url || '/qr/' || t.id::text as expected_qr_code,
        (t.qr_code IS NULL OR t.qr_code != (base_url || '/qr/' || t.id::text)) as needs_update
    FROM tables t
    WHERE t.id = table_uuid;
END;
$$;


ALTER FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") IS 'Check if a table QR code needs updating without actually updating it. Returns current and expected QR codes for comparison.';



CREATE OR REPLACE FUNCTION "public"."check_restaurant_access"("restaurant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Check if user is restaurant owner
  if exists (
    select 1 from restaurants r
    where r.id = restaurant_id 
    and r.owner_id = auth.uid()
  ) then
    return true;
  end if;
  
  -- Check if user is staff with menu.manage permission
  if exists (
    select 1 from staff s
    where s.restaurant_id = restaurant_id
    and s.user_id = auth.uid()
    and s.is_active = true
    and s.permissions && array['menu.manage']::text[]
  ) then
    return true;
  end if;
  
  return false;
end;
$$;


ALTER FUNCTION "public"."check_restaurant_access"("restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_subscription_table_structure"() RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" "text", "column_default" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  from information_schema.columns c
  where c.table_name = 'subscriptions'
  order by c.ordinal_position;
end;
$$;


ALTER FUNCTION "public"."check_subscription_table_structure"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE restaurants
    SET 
        onboarding_completed = true,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Restaurant not found');
    END IF;
    
    RETURN json_build_object('success', true, 'onboarding_completed', true);
END;
$$;


ALTER FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text" DEFAULT NULL::"text", "p_stripe_account_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE restaurants
    SET
        onboarding_completed = true,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    -- Update Stripe customer ID if provided
    IF p_stripe_customer_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_customer_id = p_stripe_customer_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
    
    -- Update Stripe account ID if provided
    IF p_stripe_account_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_account_id = p_stripe_account_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_account_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_account_id" "text") IS 'Mark restaurant onboarding as completed and optionally update Stripe IDs';



CREATE OR REPLACE FUNCTION "public"."create_owner_staff_record"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Only create staff record if it doesn't exist
  if not exists (
    select 1 from staff
    where restaurant_id = new.id
    and user_id = new.owner_id
    and role = 'owner'
  ) then
    insert into staff (restaurant_id, user_id, role, permissions)
    values (
      new.id,
      new.owner_id,
      'owner',
      get_all_permissions()
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."create_owner_staff_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_order_exists boolean;
  v_payment_id uuid;
begin
  -- Check if order exists
  select exists(select 1 from orders where id = p_order_id) into v_order_exists;
  
  if not v_order_exists then
    -- Create a fallback order if it doesn't exist
    insert into orders (
      id,
      restaurant_id,
      table_id,
      status,
      total_amount,
      tax_amount,
      tip_amount,
      created_at,
      updated_at
    ) values (
      p_order_id,
      p_restaurant_id,
      null,
      'completed',
      p_amount,
      0, -- tax_amount (required field)
      0, -- tip_amount (default 0)
      now(),
      now()
    );
    
    raise notice 'Created fallback order with ID: %', p_order_id;
  end if;
  
  -- Create the payment record for customer payments to restaurants
  insert into payments (
    id,
    order_id,
    restaurant_id,
    amount,
    currency,
    status,
    method,
    stripe_payment_id,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    p_order_id,
    p_restaurant_id,
    p_amount,
    p_currency,
    p_status,
    p_method,
    p_stripe_payment_id,
    now(),
    now()
  ) returning id into v_payment_id;
  
  raise notice 'Created payment with ID: % for customer payment to restaurant', v_payment_id;
  
exception when others then
  raise log 'Error creating payment %: %', p_stripe_payment_id, sqlerrm;
  raise;
end;
$$;


ALTER FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  max_retries constant int := 3;
  current_try int := 0;
begin
  -- Loop to retry on conflicts
  while current_try < max_retries loop
    begin
      insert into public.profiles (id, full_name, created_at, updated_at)
      values (
        new.id,
        coalesce(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'name',
          'New User'
        ),
        now(),
        now()
      )
      on conflict (id) do update
      set 
        full_name = EXCLUDED.full_name,
        updated_at = now();
      
      return new;
    exception when others then
      -- Log error and increment counter
      raise notice 'Error creating profile on try %: %', current_try, sqlerrm;
      current_try := current_try + 1;
      if current_try = max_retries then
        raise exception 'Failed to create profile after % attempts: %', max_retries, sqlerrm;
      end if;
      -- Small delay before retry
      perform pg_sleep(0.1);
    end;
  end loop;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."create_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_all_upload_issues"() RETURNS TABLE("user_id" "uuid", "restaurant_id" "uuid", "is_restaurant_owner" boolean, "has_staff_access" boolean, "can_upload_menu" boolean, "can_upload_restaurant" boolean, "can_upload_avatar" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_restaurant_id uuid;
begin
  -- Get the current restaurant ID for the user
  select r.id into current_restaurant_id
  from restaurants r
  where r.owner_id = auth.uid()
  limit 1;
  
  return query
  select 
    auth.uid() as user_id,
    current_restaurant_id as restaurant_id,
    exists (
      select 1 from restaurants r2
      where r2.owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff s2
      where s2.user_id = auth.uid()
      and s2.is_active = true
      and s2.permissions && array['menu.manage']::text[]
    ) as has_staff_access,
    true as can_upload_menu, -- Always true with simplified policy
    true as can_upload_restaurant, -- Always true with simplified policy
    true as can_upload_avatar; -- Always true with simplified policy
end;
$$;


ALTER FUNCTION "public"."debug_all_upload_issues"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_menu_upload_issue"() RETURNS TABLE("user_id" "uuid", "restaurant_id" "uuid", "is_restaurant_owner" boolean, "has_staff_access" boolean, "can_upload" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_restaurant_id uuid;
begin
  -- Get the current restaurant ID for the user
  select r.id into current_restaurant_id
  from restaurants r
  where r.owner_id = auth.uid()
  limit 1;
  
  return query
  select 
    auth.uid() as user_id,
    current_restaurant_id as restaurant_id,
    exists (
      select 1 from restaurants r2
      where r2.owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff s2
      where s2.user_id = auth.uid()
      and s2.is_active = true
      and s2.permissions && array['menu.manage']::text[]
    ) as has_staff_access,
    true as can_upload; -- Always true with simplified policy
end;
$$;


ALTER FUNCTION "public"."debug_menu_upload_issue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_menu_upload_permissions"() RETURNS TABLE("user_id" "uuid", "is_restaurant_owner" boolean, "has_menu_manage" boolean, "restaurant_id" "uuid", "staff_permissions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return query
  select 
    auth.uid() as user_id,
    exists (
      select 1 from restaurants 
      where owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    ) as has_menu_manage,
    r.id as restaurant_id,
    s.permissions as staff_permissions
  from restaurants r
  left join staff s on s.restaurant_id = r.id and s.user_id = auth.uid()
  where r.owner_id = auth.uid()
  limit 1;
end;
$$;


ALTER FUNCTION "public"."debug_menu_upload_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_menu_upload_permissions_v3"() RETURNS TABLE("user_id" "uuid", "is_restaurant_owner" boolean, "has_menu_manage" boolean, "restaurant_id" "uuid", "can_access" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_restaurant_id uuid;
begin
  -- Get the current restaurant ID for the user
  select r.id into current_restaurant_id
  from restaurants r
  where r.owner_id = auth.uid()
  limit 1;
  
  return query
  select 
    auth.uid() as user_id,
    exists (
      select 1 from restaurants r2
      where r2.owner_id = auth.uid()
    ) as is_restaurant_owner,
    exists (
      select 1 from staff s2
      where s2.user_id = auth.uid()
      and s2.is_active = true
      and s2.permissions && array['menu.manage']::text[]
    ) as has_menu_manage,
    current_restaurant_id as restaurant_id,
    check_restaurant_access(current_restaurant_id) as can_access;
end;
$$;


ALTER FUNCTION "public"."debug_menu_upload_permissions_v3"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_default_menu_data"("p_restaurant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Add default categories if they don't exist
  INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
  VALUES 
    (p_restaurant_id, 'Starters', 'Appetizers and small plates', 1),
    (p_restaurant_id, 'Mains', 'Main course dishes', 2),
    (p_restaurant_id, 'Desserts', 'Sweet treats and desserts', 3),
    (p_restaurant_id, 'Drinks', 'Beverages and drinks', 4)
  ON CONFLICT (restaurant_id, name) DO NOTHING;

  -- Add default allergens if they don't exist
  INSERT INTO allergens (restaurant_id, name, icon)
  VALUES 
    (p_restaurant_id, 'Gluten', '🌾'),
    (p_restaurant_id, 'Dairy', '🥛'),
    (p_restaurant_id, 'Eggs', '🥚'),
    (p_restaurant_id, 'Nuts', '🥜'),
    (p_restaurant_id, 'Soy', '🫘'),
    (p_restaurant_id, 'Shellfish', '🦐'),
    (p_restaurant_id, 'Fish', '🐟'),
    (p_restaurant_id, 'Sulfites', '🍷')
  ON CONFLICT (restaurant_id, name) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."ensure_default_menu_data"("p_restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_newsletter_subscribers"() RETURNS TABLE("id" "uuid", "email" "text", "first_name" "text", "last_name" "text", "preferences" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.email,
        ns.first_name,
        ns.last_name,
        ns.preferences
    FROM newsletter_subscriptions ns
    WHERE ns.is_active = true
    ORDER BY ns.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_active_newsletter_subscribers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_permissions"() RETURNS "text"[]
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  return enum_range(null::staff_permission)::text[];
end;
$$;


ALTER FUNCTION "public"."get_all_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") RETURNS TABLE("id" "uuid", "owner_id" "uuid", "name" "text", "email" "text", "stripe_customer_id" "text", "subscription_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") IS 'Get restaurant by ID for webhook validation';



CREATE OR REPLACE FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") RETURNS TABLE("id" "uuid", "owner_id" "uuid", "name" "text", "email" "text", "stripe_account_id" "text", "stripe_account_enabled" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_account_id,
        r.stripe_account_enabled
    FROM restaurants r
    WHERE r.stripe_account_id = p_stripe_account_id;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") IS 'Find restaurant by Stripe Connect account ID for webhook processing';



CREATE OR REPLACE FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") RETURNS TABLE("id" "uuid", "owner_id" "uuid", "name" "text", "email" "text", "stripe_customer_id" "text", "subscription_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.owner_id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status
    FROM restaurants r
    WHERE r.stripe_customer_id = p_stripe_customer_id;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") IS 'Find restaurant by Stripe customer ID for subscription webhooks';



CREATE OR REPLACE FUNCTION "public"."get_restaurant_elements"("p_restaurant_id" "uuid") RETURNS TABLE("id" "uuid", "restaurant_id" "uuid", "type" "text", "name" "text", "x" integer, "y" integer, "width" integer, "height" integer, "rotation" integer, "color" "text", "icon" "text", "locked" boolean, "visible" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Security check: ensure user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
    AND r.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: restaurant not found or not owned by user';
  END IF;

  RETURN QUERY
  SELECT 
    re.id,
    re.restaurant_id,
    re.type,
    re.name,
    re.x,
    re.y,
    re.width,
    re.height,
    re.rotation,
    re.color,
    re.icon,
    re.locked,
    re.visible,
    re.created_at,
    re.updated_at
  FROM restaurant_elements re
  WHERE re.restaurant_id = p_restaurant_id
  ORDER BY re.created_at;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_elements"("p_restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_restaurant_id_by_stripe_customer"("p_stripe_customer_id" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_restaurant_id uuid;
begin
  select id into v_restaurant_id
  from restaurants
  where stripe_customer_id = p_stripe_customer_id
  limit 1;
  
  return v_restaurant_id;
end;
$$;


ALTER FUNCTION "public"."get_restaurant_id_by_stripe_customer"("p_stripe_customer_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer DEFAULT 30) RETURNS TABLE("total_transactions" bigint, "total_amount" numeric, "card_transactions" bigint, "card_amount" numeric, "cash_transactions" bigint, "cash_amount" numeric, "average_order_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE payment_method = 'card') as card_transactions,
        COALESCE(SUM(amount) FILTER (WHERE payment_method = 'card'), 0) as card_amount,
        COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_transactions,
        COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0) as cash_amount,
        COALESCE(AVG(amount), 0) as average_order_value
    FROM payments
    WHERE restaurant_id = p_restaurant_id
        AND created_at >= NOW() - interval '1 day' * p_days
        AND status = 'succeeded';
END;
$$;


ALTER FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer) IS 'Get payment statistics for a restaurant over a specified number of days';



CREATE OR REPLACE FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_amount INTEGER;
    v_total_payments INTEGER;
    v_total_refunds INTEGER;
    v_refund_amount INTEGER;
BEGIN
    -- Check if user has access to this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = p_restaurant_id 
        AND owner_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Get payment stats
    SELECT 
        COALESCE(SUM(amount), 0),
        COUNT(*)
    INTO v_total_amount, v_total_payments
    FROM payments
    WHERE restaurant_id = p_restaurant_id
    AND status = 'succeeded'
    AND (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date);
    
    -- Get refund stats
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0)
    INTO v_total_refunds, v_refund_amount
    FROM refunds
    WHERE restaurant_id = p_restaurant_id
    AND (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date);
    
    RETURN json_build_object(
        'success', true,
        'total_amount', v_total_amount,
        'total_payments', v_total_payments,
        'total_refunds', v_total_refunds,
        'refund_amount', v_refund_amount,
        'net_amount', v_total_amount - v_refund_amount
    );
END;
$$;


ALTER FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "email" "text", "stripe_account_id" "text", "stripe_account_enabled" boolean, "stripe_account_requirements" "jsonb", "has_stripe_connect" boolean, "can_accept_payments" boolean, "payment_methods" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.email,
        r.stripe_account_id,
        r.stripe_account_enabled,
        r.stripe_account_requirements,
        COALESCE(r.stripe_account_id IS NOT NULL, false) as has_stripe_connect,
        COALESCE(r.stripe_account_enabled = true, false) as can_accept_payments,
        r.payment_methods
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") IS 'Get comprehensive Stripe Connect status for a restaurant';



CREATE OR REPLACE FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "email" "text", "stripe_customer_id" "text", "subscription_status" "text", "has_subscription" boolean, "onboarding_completed" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.email,
        r.stripe_customer_id,
        r.subscription_status,
        COALESCE(r.subscription_status IN ('active', 'trialing'), false) as has_subscription,
        COALESCE(r.onboarding_completed, false) as onboarding_completed
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") IS 'Get comprehensive subscription status for a restaurant';



CREATE OR REPLACE FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "has_verified_email" boolean, "verification_count" integer, "last_verification_attempt" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        is_email_verified(u.id) as has_verified_email,
        COUNT(ev.id)::integer as verification_count,
        MAX(ev.created_at) as last_verification_attempt
    FROM auth.users u
    LEFT JOIN public.email_verifications ev ON u.id = ev.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.email;
END;
$$;


ALTER FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") IS 'Get comprehensive user verification status including verification attempts';



CREATE OR REPLACE FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE restaurants
    SET
        stripe_account_id = NULL,
        stripe_account_enabled = false,
        stripe_account_requirements = NULL,
        updated_at = NOW()
    WHERE stripe_account_id = p_stripe_account_id;
END;
$$;


ALTER FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") IS 'Handle Stripe account deauthorization events';



CREATE OR REPLACE FUNCTION "public"."handle_stripe_account_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  SET search_path = public;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_stripe_account_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stripe_account_update"("p_stripe_account_id" "text", "p_status" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    -- Find restaurant by Stripe account ID
    SELECT id INTO v_restaurant_id
    FROM restaurants
    WHERE stripe_account_id = p_stripe_account_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Restaurant not found');
    END IF;
    
    -- Update restaurant status
    UPDATE restaurants
    SET 
        stripe_connect_status = p_status,
        updated_at = NOW()
    WHERE id = v_restaurant_id;
    
    -- Log the update
    INSERT INTO restaurant_stripe_logs (
        restaurant_id,
        stripe_account_id,
        event_type,
        status,
        created_at
    ) VALUES (
        v_restaurant_id,
        p_stripe_account_id,
        'account_update',
        p_status,
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'restaurant_id', v_restaurant_id,
        'status', p_status
    );
END;
$$;


ALTER FUNCTION "public"."handle_stripe_account_update"("p_stripe_account_id" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("restaurant_id" "uuid", "required_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_staff staff;
begin
  -- Check if user is restaurant owner
  if exists (
    select 1 from restaurants
    where id = restaurant_id
    and owner_id = auth.uid()
  ) then
    return true;
  end if;

  -- Check staff permissions
  select * into v_staff
  from staff
  where restaurant_id = restaurant_id
  and user_id = auth.uid()
  and is_active = true;

  return v_staff.permissions && array[required_permission];
end;
$$;


ALTER FUNCTION "public"."has_permission"("restaurant_id" "uuid", "required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_staff_permission"("restaurant_id" "uuid", "required_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_permissions text[];
  v_is_active boolean;
begin
  -- First check if user is restaurant owner
  if is_restaurant_owner(restaurant_id) then
    return true;
  end if;

  -- Direct query to check staff permissions
  select permissions, is_active into v_permissions, v_is_active
  from staff
  where restaurant_id = restaurant_id
  and user_id = auth.uid()
  limit 1;

  -- Return true if staff is active and has the required permission
  return v_is_active = true and v_permissions && array[required_permission];
end;
$$;


ALTER FUNCTION "public"."has_staff_permission"("restaurant_id" "uuid", "required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_verified"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    SELECT verified INTO v_verified
    FROM email_verifications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_verified, false);
END;
$$;


ALTER FUNCTION "public"."is_email_verified"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_email_verified"("p_user_id" "uuid") IS 'Check if user has verified their email through our custom verification system';



CREATE OR REPLACE FUNCTION "public"."is_restaurant_owner"("restaurant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return exists (
    select 1 from restaurants
    where id = restaurant_id
    and owner_id = auth.uid()
  );
end;
$$;


ALTER FUNCTION "public"."is_restaurant_owner"("restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_stripe_connect_ready"("restaurant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_restaurant restaurants;
begin
  select * into v_restaurant
  from restaurants
  where id = restaurant_id;

  return v_restaurant.stripe_account_id is not null
    and v_restaurant.stripe_account_enabled = true
    and (
      v_restaurant.stripe_account_requirements is null
      or not v_restaurant.stripe_account_requirements ? 'currently_due'
      or v_restaurant.stripe_account_requirements->>'currently_due' = '[]'
    );
end;
$$;


ALTER FUNCTION "public"."is_stripe_connect_ready"("restaurant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_staff_permission"("permissions" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  return array_length(
    array(
      select unnest(permissions)
      except
      select unnest(enum_range(null::staff_permission)::text[])
    ),
    1
  ) is null;
end;
$$;


ALTER FUNCTION "public"."is_valid_staff_permission"("permissions" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_restaurant_stripe_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Log changes to Stripe Connect fields
    IF OLD.stripe_account_id IS DISTINCT FROM NEW.stripe_account_id THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_id',
            OLD.stripe_account_id,
            NEW.stripe_account_id,
            NOW()
        );
    END IF;

    IF OLD.stripe_account_enabled IS DISTINCT FROM NEW.stripe_account_enabled THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_enabled',
            OLD.stripe_account_enabled::text,
            NEW.stripe_account_enabled::text,
            NOW()
        );
    END IF;

    IF OLD.stripe_account_requirements IS DISTINCT FROM NEW.stripe_account_requirements THEN
        INSERT INTO restaurant_stripe_logs (
            restaurant_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.id,
            'stripe_account_requirements',
            OLD.stripe_account_requirements::text,
            NEW.stripe_account_requirements::text,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_restaurant_stripe_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_intent_id" "text", "p_amount" integer, "p_currency" "text" DEFAULT 'CHF'::"text", "p_status" "text" DEFAULT 'succeeded'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_restaurant_id UUID;
    v_order_record RECORD;
    v_result JSON;
BEGIN
    -- Get restaurant ID from order
    SELECT restaurant_id INTO v_restaurant_id
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Check if user has access to this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = v_restaurant_id 
        AND owner_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Update order with payment information
    UPDATE orders
    SET 
        payment_intent_id = p_payment_intent_id,
        payment_status = p_status,
        paid_at = CASE WHEN p_status = 'succeeded' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order_record;
    
    -- Insert payment record
    INSERT INTO payments (
        order_id,
        restaurant_id,
        payment_intent_id,
        amount,
        currency,
        status,
        created_at
    ) VALUES (
        p_order_id,
        v_restaurant_id,
        p_payment_intent_id,
        p_amount,
        p_currency,
        p_status,
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_intent_id', p_payment_intent_id,
        'amount', p_amount,
        'currency', p_currency,
        'status', p_status
    );
END;
$$;


ALTER FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_intent_id" "text", "p_amount" integer, "p_currency" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_currency" "text" DEFAULT 'CHF'::"text", "p_method" "text" DEFAULT 'card'::"text", "p_stripe_payment_id" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_payment_id uuid;
BEGIN
  -- Insert payment record
  INSERT INTO payments (
    restaurant_id,
    order_id,
    amount,
    method,
    stripe_payment_id,
    status
  ) VALUES (
    p_restaurant_id,
    p_order_id,
    p_amount,
    p_method::payment_method,
    p_stripe_payment_id,
    'completed'
  ) RETURNING id INTO v_payment_id;

  -- Update order status to completed
  UPDATE orders 
  SET status = 'completed' 
  WHERE id = p_order_id;

  -- Log activity
  INSERT INTO activity_logs (
    restaurant_id,
    type,
    action,
    description,
    metadata
  ) VALUES (
    p_restaurant_id,
    'payment',
    'payment_completed',
    'Payment processed successfully',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'order_id', p_order_id,
      'amount', p_amount,
      'currency', p_currency,
      'method', p_method
    )
  );

  RETURN v_payment_id;
END;
$$;


ALTER FUNCTION "public"."process_payment"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_method" "text", "p_stripe_payment_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_refund_amount" integer, "p_reason" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_payment_record RECORD;
    v_restaurant_id UUID;
    v_result JSON;
BEGIN
    -- Get payment details
    SELECT p.*, o.restaurant_id INTO v_payment_record
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE p.id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    -- Check if user has access to this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id = v_payment_record.restaurant_id 
        AND owner_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Access denied');
    END IF;
    
    -- Check if refund amount is valid
    IF p_refund_amount > v_payment_record.amount THEN
        RETURN json_build_object('success', false, 'error', 'Refund amount exceeds payment amount');
    END IF;
    
    -- Insert refund record
    INSERT INTO refunds (
        payment_id,
        order_id,
        restaurant_id,
        amount,
        currency,
        reason,
        created_at
    ) VALUES (
        p_payment_id,
        v_payment_record.order_id,
        v_payment_record.restaurant_id,
        p_refund_amount,
        v_payment_record.currency,
        p_reason,
        NOW()
    );
    
    -- Update payment status if full refund
    IF p_refund_amount = v_payment_record.amount THEN
        UPDATE payments
        SET status = 'refunded', updated_at = NOW()
        WHERE id = p_payment_id;
        
        UPDATE orders
        SET payment_status = 'refunded', updated_at = NOW()
        WHERE id = v_payment_record.order_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'refund_id', (SELECT id FROM refunds WHERE payment_id = p_payment_id ORDER BY created_at DESC LIMIT 1),
        'amount', p_refund_amount,
        'currency', v_payment_record.currency
    );
END;
$$;


ALTER FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_refund_amount" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_amount" numeric, "p_currency" "text" DEFAULT 'CHF'::"text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_refund_id uuid;
  v_restaurant_id uuid;
BEGIN
  -- Get restaurant_id from payment
  SELECT restaurant_id INTO v_restaurant_id 
  FROM payments 
  WHERE id = p_payment_id;

  -- Insert refund record
  INSERT INTO payments (
    restaurant_id,
    order_id,
    amount,
    method,
    status,
    refund_id
  ) SELECT 
    restaurant_id,
    order_id,
    -p_amount, -- Negative amount for refund
    method,
    'refunded',
    p_payment_id
  FROM payments 
  WHERE id = p_payment_id
  RETURNING id INTO v_refund_id;

  -- Update original payment status
  UPDATE payments 
  SET status = 'refunded' 
  WHERE id = p_payment_id;

  -- Log activity
  INSERT INTO activity_logs (
    restaurant_id,
    type,
    action,
    description,
    metadata
  ) VALUES (
    v_restaurant_id,
    'payment',
    'refund_processed',
    'Refund processed successfully',
    jsonb_build_object(
      'refund_id', v_refund_id,
      'payment_id', p_payment_id,
      'amount', p_amount,
      'currency', p_currency,
      'reason', p_reason
    )
  );

  RETURN v_refund_id;
END;
$$;


ALTER FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- This function would typically call Stripe API to refresh status
    -- For now, we just update the timestamp
    UPDATE restaurants
    SET updated_at = NOW()
    WHERE id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") IS 'Refresh Stripe account status from stored data';



CREATE OR REPLACE FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") RETURNS TABLE("table_id" "uuid", "table_number" "text", "old_qr_code" "text", "new_qr_code" "text", "success" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    base_url TEXT;
    old_code TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    -- Get the old QR code
    SELECT qr_code INTO old_code
    FROM tables
    WHERE id = table_uuid;
    
    -- Update the QR code
    UPDATE tables
    SET 
        qr_code = base_url || '/qr/' || id::text,
        updated_at = NOW()
    WHERE id = table_uuid;
    
    -- Return the result
    RETURN QUERY
    SELECT 
        t.id,
        t.number,
        old_code,
        t.qr_code,
        (t.qr_code = base_url || '/qr/' || t.id::text) as success
    FROM tables t
    WHERE t.id = table_uuid;
END;
$$;


ALTER FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") IS 'Manually regenerate QR code for a specific table. This is the only way QR codes should be changed after initial creation.';



CREATE OR REPLACE FUNCTION "public"."set_qr_code_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Get the current base URL from environment
    base_url := COALESCE(
        current_setting('app.settings.base_url', true),
        'https://dineeasy.ch'
    );
    
    -- Only set QR code if it's NULL (for new tables)
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := base_url || '/qr/' || NEW.id::text;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_qr_code_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subscribe_to_newsletter"("subscriber_email" "text", "subscriber_first_name" "text" DEFAULT NULL::"text", "subscriber_last_name" "text" DEFAULT NULL::"text", "subscriber_source" "text" DEFAULT 'website'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    existing_subscription UUID;
    new_subscription UUID;
    result JSON;
BEGIN
    -- Check if email already exists
    SELECT id INTO existing_subscription
    FROM newsletter_subscriptions
    WHERE email = subscriber_email;
    
    IF existing_subscription IS NOT NULL THEN
        -- Update existing subscription to active
        UPDATE newsletter_subscriptions
        SET 
            is_active = true,
            unsubscribed_at = NULL,
            updated_at = NOW(),
            first_name = COALESCE(subscriber_first_name, first_name),
            last_name = COALESCE(subscriber_last_name, last_name)
        WHERE id = existing_subscription;
        
        result := json_build_object(
            'success', true,
            'message', 'Email already subscribed. Subscription reactivated.',
            'subscription_id', existing_subscription,
            'action', 'reactivated'
        );
    ELSE
        -- Create new subscription
        INSERT INTO newsletter_subscriptions (
            email,
            first_name,
            last_name,
            subscription_source,
            is_active
        ) VALUES (
            subscriber_email,
            subscriber_first_name,
            subscriber_last_name,
            subscriber_source,
            true
        ) RETURNING id INTO new_subscription;
        
        result := json_build_object(
            'success', true,
            'message', 'Successfully subscribed to newsletter.',
            'subscription_id', new_subscription,
            'action', 'created'
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."subscribe_to_newsletter"("subscriber_email" "text", "subscriber_first_name" "text", "subscriber_last_name" "text", "subscriber_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_add_default_menu_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM add_default_menu_data(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_add_default_menu_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unsubscribe_from_newsletter"("subscriber_email" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    subscription_id UUID;
    result JSON;
BEGIN
    -- Find the subscription
    SELECT id INTO subscription_id
    FROM newsletter_subscriptions
    WHERE email = subscriber_email;
    
    IF subscription_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'Email not found in newsletter subscriptions.'
        );
    ELSE
        -- Mark as unsubscribed
        UPDATE newsletter_subscriptions
        SET 
            is_active = false,
            unsubscribed_at = NOW(),
            updated_at = NOW()
        WHERE id = subscription_id;
        
        result := json_build_object(
            'success', true,
            'message', 'Successfully unsubscribed from newsletter.',
            'subscription_id', subscription_id
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."unsubscribe_from_newsletter"("subscriber_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_google_business_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_google_business_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_qr_codes_for_environment"("new_base_url" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE tables 
  SET 
    qr_code = new_base_url || '/qr/' || id::text,
    updated_at = NOW()
  WHERE qr_code IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."update_qr_codes_for_environment"("new_base_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text" DEFAULT NULL::"text", "p_onboarding_completed" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Add debug logging
  RAISE LOG 'Updating restaurant % onboarding completion with stripe_customer_id: %', 
    p_restaurant_id, p_stripe_customer_id;
  
  UPDATE restaurants
  SET
    onboarding_completed = p_onboarding_completed,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  -- If stripe_customer_id is provided, update it as well
  IF p_stripe_customer_id IS NOT NULL THEN
    UPDATE restaurants
    SET
      stripe_customer_id = p_stripe_customer_id,
      updated_at = now()
    WHERE id = p_restaurant_id;
  END IF;
  
  -- Log the result
  IF NOT FOUND THEN
    RAISE LOG 'No restaurant found to update with id: %', p_restaurant_id;
  ELSE
    RAISE LOG 'Successfully updated restaurant % onboarding completion', p_restaurant_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_onboarding_completed" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_onboarding_completed" boolean) IS 'Update restaurant onboarding completion status and optionally Stripe customer ID';



CREATE OR REPLACE FUNCTION "public"."update_restaurant_onboarding_status"("p_restaurant_id" "uuid", "p_onboarding_completed" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE restaurants
  SET
    onboarding_completed = p_onboarding_completed,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."update_restaurant_onboarding_status"("p_restaurant_id" "uuid", "p_onboarding_completed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_restaurant_stripe_application"("p_restaurant_id" "uuid", "p_stripe_application_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE restaurants
  SET
    stripe_application_id = p_stripe_application_id,
    updated_at = now()
  WHERE id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."update_restaurant_stripe_application"("p_restaurant_id" "uuid", "p_stripe_application_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE restaurants
    SET
        subscription_status = p_subscription_status,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    -- Update stripe_customer_id if provided
    IF p_stripe_customer_id IS NOT NULL THEN
        UPDATE restaurants
        SET
            stripe_customer_id = p_stripe_customer_id,
            updated_at = NOW()
        WHERE id = p_restaurant_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text") IS 'Update restaurant subscription status and optionally Stripe customer ID';



CREATE OR REPLACE FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE restaurants
  SET
    subscription_status = p_subscription_status,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  RAISE LOG 'Updated restaurant % subscription status to % (simple)', p_restaurant_id, p_subscription_status;
END;
$$;


ALTER FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") IS 'Update restaurant subscription status only (backward compatibility)';



CREATE OR REPLACE FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_status" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE restaurants
    SET 
        stripe_connect_status = p_status,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Restaurant not found');
    END IF;
    
    RETURN json_build_object('success', true, 'status', p_status);
END;
$$;


ALTER FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  SET search_path = public;
  
  UPDATE restaurants
  SET
    stripe_account_id = p_stripe_account_id,
    stripe_account_enabled = p_charges_enabled,
    stripe_account_requirements = p_requirements,
    stripe_account_created_at = CASE 
      WHEN stripe_account_created_at IS NULL THEN now()
      ELSE stripe_account_created_at
    END,
    updated_at = now()
  WHERE id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurant with id % not found', p_restaurant_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") IS 'Update restaurant Stripe Connect status and requirements';



CREATE OR REPLACE FUNCTION "public"."update_table_layout"("table_id" "uuid", "x_pos" integer, "y_pos" integer, "rotation" integer DEFAULT 0, "width" integer DEFAULT 120, "height" integer DEFAULT 80) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE tables 
  SET 
    layout_x = x_pos,
    layout_y = y_pos,
    layout_rotation = rotation,
    layout_width = width,
    layout_height = height,
    updated_at = NOW()
  WHERE id = table_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_table_layout"("table_id" "uuid", "x_pos" integer, "y_pos" integer, "rotation" integer, "width" integer, "height" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_restaurant_elements"("p_restaurant_id" "uuid", "p_elements" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  element JSONB;
BEGIN
  -- Security check: ensure user owns the restaurant
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
    AND r.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: restaurant not found or not owned by user';
  END IF;

  -- Delete existing elements for this restaurant
  DELETE FROM restaurant_elements WHERE restaurant_id = p_restaurant_id;

  -- Insert new elements
  FOR element IN SELECT * FROM jsonb_array_elements(p_elements)
  LOOP
    INSERT INTO restaurant_elements (
      restaurant_id,
      type,
      name,
      x,
      y,
      width,
      height,
      rotation,
      color,
      icon,
      locked,
      visible
    ) VALUES (
      p_restaurant_id,
      (element->>'type')::TEXT,
      (element->>'name')::TEXT,
      (element->>'x')::INTEGER,
      (element->>'y')::INTEGER,
      (element->>'width')::INTEGER,
      (element->>'height')::INTEGER,
      (element->>'rotation')::INTEGER,
      (element->>'color')::TEXT,
      (element->>'icon')::TEXT,
      (element->>'locked')::BOOLEAN,
      (element->>'visible')::BOOLEAN
    );
  END LOOP;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."upsert_restaurant_elements"("p_restaurant_id" "uuid", "p_elements" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_current_time TIMESTAMPTZ := NOW();
    v_has_timestamps BOOLEAN := false;
BEGIN
    -- Check if we have any timestamps to satisfy the constraint
    v_has_timestamps := (
        p_current_period_start IS NOT NULL OR 
        p_current_period_end IS NOT NULL OR 
        p_trial_start IS NOT NULL OR 
        p_trial_end IS NOT NULL
    );
    
    -- If no timestamps are provided, use current time as fallback
    IF NOT v_has_timestamps THEN
        p_current_period_start := v_current_time;
        p_current_period_end := v_current_time + interval '1 month';
    END IF;
    
    -- For trial subscriptions, use trial timestamps as fallbacks for current period
    IF p_status = 'trialing' THEN
        IF p_current_period_start IS NULL AND p_trial_start IS NOT NULL THEN
            p_current_period_start := p_trial_start;
        END IF;
        IF p_current_period_end IS NULL AND p_trial_end IS NOT NULL THEN
            p_current_period_end := p_trial_end;
        END IF;
    END IF;
    
    -- Final fallback: ensure we have at least current_period_start
    IF p_current_period_start IS NULL THEN
        p_current_period_start := v_current_time;
    END IF;
    IF p_current_period_end IS NULL THEN
        p_current_period_end := p_current_period_start + interval '1 month';
    END IF;
    
    INSERT INTO subscriptions (
        id,
        restaurant_id,
        stripe_customer_id,
        stripe_subscription_id,
        plan,
        interval,
        status,
        stripe_price_id,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        cancel_at,
        canceled_at,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_restaurant_id,
        p_stripe_customer_id,
        p_stripe_subscription_id,
        p_plan::subscription_plan,
        p_interval::subscription_interval,
        p_status,
        p_stripe_price_id,
        p_current_period_start,
        p_current_period_end,
        p_trial_start,
        p_trial_end,
        p_cancel_at,
        p_canceled_at,
        p_metadata,
        NOW(),
        NOW()
    )
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET
        plan = EXCLUDED.plan,
        interval = EXCLUDED.interval,
        status = EXCLUDED.status,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        cancel_at = EXCLUDED.cancel_at,
        canceled_at = EXCLUDED.canceled_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
        
    -- Update restaurant subscription status
    UPDATE restaurants
    SET
        subscription_status = p_status,
        stripe_customer_id = p_stripe_customer_id,
        updated_at = NOW()
    WHERE id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb") IS 'Upsert subscription record and update restaurant status';



CREATE OR REPLACE FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") RETURNS TABLE("is_valid" boolean, "missing_fields" "text"[], "recommendations" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN r.stripe_account_enabled = true THEN true ELSE false END as is_valid,
        ARRAY[]::text[] as missing_fields,
        ARRAY['Ensure all required business information is provided']::text[] as recommendations
    FROM restaurants r
    WHERE r.id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") IS 'Validate Stripe Connect setup and provide recommendations';



CREATE OR REPLACE FUNCTION "public"."verify_email"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_verification record;
  v_user_id uuid;
  v_result json;
begin
  -- Get verification record
  select * into v_verification
  from public.email_verifications
  where token = p_token
    and verified = false
    and expires_at > now();

  if not found then
    return json_build_object(
      'success', false,
      'error', 'Invalid or expired verification token'
    );
  end if;

  -- Mark as verified
  update public.email_verifications
  set verified = true,
      verified_at = now(),
      updated_at = now()
  where id = v_verification.id;

  -- Update user email_verified status
  update auth.users
  set email_confirmed_at = now(),
      updated_at = now()
  where id = v_verification.user_id;

  return json_build_object(
    'success', true,
    'user_id', v_verification.user_id
  );
end;
$$;


ALTER FUNCTION "public"."verify_email"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password_reset_token"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_reset_token record;
  v_user_id uuid;
  v_token_count integer;
  v_expired_count integer;
  v_used_count integer;
begin
  -- First, let's check what's in the database for debugging
  select count(*) into v_token_count
  from public.password_reset_tokens
  where token = p_token;
  
  select count(*) into v_expired_count
  from public.password_reset_tokens
  where token = p_token
    and expires_at <= now();
    
  select count(*) into v_used_count
  from public.password_reset_tokens
  where token = p_token
    and used = true;

  -- Get reset token record
  select * into v_reset_token
  from public.password_reset_tokens
  where token = p_token
    and used = false
    and expires_at > now();

  if not found then
    -- Return detailed error information for debugging
    return json_build_object(
      'success', false,
      'error', 'Invalid or expired password reset token',
      'debug', json_build_object(
        'token_provided', p_token,
        'token_found', v_token_count > 0,
        'token_count', v_token_count,
        'expired_count', v_expired_count,
        'used_count', v_used_count
      )
    );
  end if;

  -- Mark as used
  update public.password_reset_tokens
  set used = true,
      updated_at = now()
  where id = v_reset_token.id;

  return json_build_object(
    'success', true,
    'user_id', v_reset_token.user_id,
    'email', v_reset_token.email
  );
end;
$$;


ALTER FUNCTION "public"."verify_password_reset_token"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") RETURNS TABLE("restaurant_id" "uuid", "restaurant_name" "text", "stripe_customer_id" "text", "stripe_account_id" "text", "subscription_status" "text", "onboarding_completed" boolean, "has_valid_customer" boolean, "has_valid_account" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.stripe_customer_id,
    r.stripe_account_id,
    r.subscription_status,
    r.onboarding_completed,
    CASE WHEN r.stripe_customer_id IS NOT NULL THEN true ELSE false END as has_valid_customer,
    CASE WHEN r.stripe_account_id IS NOT NULL THEN true ELSE false END as has_valid_account
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$;


ALTER FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") IS 'Verify restaurant Stripe data integrity and completeness';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "type" "public"."activity_type" NOT NULL,
    "action" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."allergens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."allergens" REPLICA IDENTITY FULL;


ALTER TABLE "public"."allergens" OWNER TO "postgres";


COMMENT ON TABLE "public"."allergens" IS 'Allergens table with real-time enabled';



CREATE TABLE IF NOT EXISTS "public"."email_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "sentiment" "public"."sentiment" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_business_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."google_business_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_business_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "google_review_id" "text" NOT NULL,
    "reviewer_name" "text",
    "reviewer_photo_url" "text",
    "rating" integer,
    "comment" "text",
    "review_time" timestamp with time zone,
    "reply_text" "text",
    "reply_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "google_business_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."google_business_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."menu_categories" REPLICA IDENTITY FULL;


ALTER TABLE "public"."menu_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."menu_categories" IS 'Menu categories table with real-time enabled';



CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "preparation_time" interval,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_popular" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."menu_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."menu_items" IS 'Menu items table with real-time enabled';



COMMENT ON COLUMN "public"."menu_items"."is_popular" IS 'Whether this menu item is marked as popular/featured';



CREATE TABLE IF NOT EXISTS "public"."menu_items_allergens" (
    "menu_item_id" "uuid" NOT NULL,
    "allergen_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."menu_items_allergens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "is_active" boolean DEFAULT true,
    "subscription_source" "text" DEFAULT 'website'::"text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "unsubscribed_at" timestamp with time zone,
    "last_email_sent_at" timestamp with time zone
);


ALTER TABLE "public"."newsletter_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."newsletter_subscriptions" IS 'Newsletter subscription management for DineEasy marketing communications';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."email" IS 'Unique email address for the subscriber';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."first_name" IS 'Optional first name of the subscriber';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."last_name" IS 'Optional last name of the subscriber';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."is_active" IS 'Whether the subscription is currently active';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."subscription_source" IS 'Source of the subscription (website, admin, etc.)';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."preferences" IS 'JSON object containing subscriber preferences (frequency, categories, etc.)';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."unsubscribed_at" IS 'Timestamp when the user unsubscribed';



COMMENT ON COLUMN "public"."newsletter_subscriptions"."last_email_sent_at" IS 'Timestamp of the last newsletter email sent to this subscriber';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "table_id" "uuid",
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "tax_amount" numeric(10,2) NOT NULL,
    "tip_amount" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "customer_name" "text",
    "customer_email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "stripe_payment_intent_id" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."stripe_payment_intent_id" IS 'Stripe payment intent ID for QR payments';



CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "stripe_payment_id" "text",
    "refund_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "currency" "public"."currency" DEFAULT 'CHF'::"public"."currency" NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payments"."refund_id" IS 'Stripe refund ID when payment is refunded';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_elements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "x" integer DEFAULT 0 NOT NULL,
    "y" integer DEFAULT 0 NOT NULL,
    "width" integer DEFAULT 80 NOT NULL,
    "height" integer DEFAULT 60 NOT NULL,
    "rotation" integer DEFAULT 0 NOT NULL,
    "color" "text" DEFAULT '#10b981'::"text" NOT NULL,
    "icon" "text" DEFAULT 'Building2'::"text" NOT NULL,
    "locked" boolean DEFAULT false NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "restaurant_elements_type_check" CHECK (("type" = ANY (ARRAY['entrance'::"text", 'kitchen'::"text", 'bar'::"text", 'bathroom'::"text", 'counter'::"text", 'storage'::"text"])))
);


ALTER TABLE "public"."restaurant_elements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "type" "public"."restaurant_type" NOT NULL,
    "cuisine" "text",
    "email" "text" NOT NULL,
    "phone" "text",
    "website" "text",
    "logo_url" "text",
    "cover_url" "text",
    "address" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text",
    "tax_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "vat_number" "text",
    "price_range" "public"."price_range",
    "seating_capacity" integer,
    "accepts_reservations" boolean DEFAULT false,
    "delivery_available" boolean DEFAULT false,
    "takeout_available" boolean DEFAULT false,
    "opening_hours" "jsonb",
    "subscription_status" "text",
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "stripe_account_id" "text",
    "stripe_account_enabled" boolean DEFAULT false,
    "stripe_account_requirements" "jsonb",
    "stripe_account_created_at" timestamp with time zone,
    "notification_settings" "jsonb" DEFAULT '{"newOrders": true, "playSound": true, "tableRequests": true, "kitchenUpdates": false, "paymentReceived": true}'::"jsonb",
    "is_open" boolean DEFAULT true,
    "onboarding_completed" boolean DEFAULT false,
    "payment_methods" "jsonb" DEFAULT '{"cardEnabled": true, "cashEnabled": true}'::"jsonb",
    "currency" "public"."currency" DEFAULT 'CHF'::"public"."currency" NOT NULL,
    "google_business_id" "text",
    "google_business_access_token" "text",
    "google_business_refresh_token" "text",
    "google_business_token_expiry" timestamp with time zone,
    "google_business_sync_enabled" boolean DEFAULT false,
    "google_business_last_sync" timestamp with time zone,
    "google_business_location_id" "text",
    "welcome_email_sent" boolean DEFAULT false
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."restaurants"."type" IS 'Type of restaurant establishment - expanded to include specific cuisine types and business models';



COMMENT ON COLUMN "public"."restaurants"."subscription_status" IS 'Current subscription status: incomplete, pending, active, trialing, canceled, etc.';



COMMENT ON COLUMN "public"."restaurants"."stripe_customer_id" IS 'Stripe customer ID for subscription payments (restaurant paying platform)';



COMMENT ON COLUMN "public"."restaurants"."stripe_account_id" IS 'Stripe Connect account ID for receiving customer payments';



COMMENT ON COLUMN "public"."restaurants"."stripe_account_enabled" IS 'Whether the Stripe Connect account can accept charges';



COMMENT ON COLUMN "public"."restaurants"."stripe_account_requirements" IS 'Stripe Connect account verification requirements and status';



COMMENT ON COLUMN "public"."restaurants"."stripe_account_created_at" IS 'When the Stripe Connect account was created';



COMMENT ON COLUMN "public"."restaurants"."notification_settings" IS 'JSON object storing user notification preferences';



COMMENT ON COLUMN "public"."restaurants"."is_open" IS 'Manual override for restaurant open/closed status. When true, restaurant is manually set to open. When false, restaurant is manually set to closed.';



COMMENT ON COLUMN "public"."restaurants"."onboarding_completed" IS 'Whether the restaurant has completed the full onboarding process';



COMMENT ON COLUMN "public"."restaurants"."payment_methods" IS 'JSON object storing payment method preferences (cardEnabled, cashEnabled)';



CREATE OR REPLACE VIEW "public"."restaurant_stripe_connect_overview" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "email",
    "stripe_account_id",
    "stripe_account_enabled",
        CASE
            WHEN ("stripe_account_id" IS NOT NULL) THEN true
            ELSE false
        END AS "has_stripe_connect",
        CASE
            WHEN ("stripe_account_enabled" = true) THEN true
            ELSE false
        END AS "can_accept_payments",
    "payment_methods",
    "created_at",
    "updated_at"
   FROM "public"."restaurants" "r";


ALTER VIEW "public"."restaurant_stripe_connect_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."restaurant_stripe_connect_overview" IS 'View for Stripe Connect status overview. Uses SECURITY INVOKER to respect RLS policies.';



CREATE TABLE IF NOT EXISTS "public"."restaurant_stripe_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."restaurant_stripe_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."restaurant_stripe_logs" IS 'Audit log of Stripe account changes for restaurants (account ID, enabled status, requirements, etc.)';



CREATE OR REPLACE VIEW "public"."restaurant_subscription_overview" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "email",
    "stripe_customer_id",
    "subscription_status",
        CASE
            WHEN ("subscription_status" = ANY (ARRAY['active'::"text", 'trialing'::"text"])) THEN true
            ELSE false
        END AS "has_active_subscription",
    "onboarding_completed",
    "created_at",
    "updated_at"
   FROM "public"."restaurants" "r";


ALTER VIEW "public"."restaurant_subscription_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."restaurant_subscription_overview" IS 'View for subscription status overview. Uses SECURITY INVOKER to respect RLS policies.';



CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."staff_role" NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "valid_permissions" CHECK ("public"."is_valid_staff_permission"("permissions"))
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "plan" "public"."subscription_plan" NOT NULL,
    "interval" "public"."subscription_interval" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "stripe_price_id" "text",
    "currency" "public"."currency" DEFAULT 'CHF'::"public"."currency" NOT NULL,
    CONSTRAINT "check_subscription_timestamps" CHECK ((("current_period_start" IS NOT NULL) OR ("current_period_end" IS NOT NULL) OR ("trial_start" IS NOT NULL) OR ("trial_end" IS NOT NULL)))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subscriptions"."metadata" IS 'JSON metadata for subscription, including trial upgrade information';



COMMENT ON COLUMN "public"."subscriptions"."stripe_price_id" IS 'Stripe price ID for the current subscription item';



CREATE TABLE IF NOT EXISTS "public"."tables" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "number" "text" NOT NULL,
    "capacity" integer NOT NULL,
    "status" "public"."table_status" DEFAULT 'available'::"public"."table_status" NOT NULL,
    "qr_code" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "layout_x" integer DEFAULT 0,
    "layout_y" integer DEFAULT 0,
    "layout_rotation" integer DEFAULT 0,
    "layout_width" integer DEFAULT 120,
    "layout_height" integer DEFAULT 80,
    CONSTRAINT "qr_code_format_check" CHECK ((("qr_code" IS NULL) OR ("qr_code" ~ '^https?://[^/]+/qr/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::"text")))
);


ALTER TABLE "public"."tables" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tables"."qr_code" IS 'QR code URL that links to the table-specific ordering page. This URL is persistent and only changes when manually regenerated.';



COMMENT ON CONSTRAINT "qr_code_format_check" ON "public"."tables" IS 'Ensures QR codes follow the correct format: base_url/qr/table_uuid';



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."allergens"
    ADD CONSTRAINT "allergens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."allergens"
    ADD CONSTRAINT "allergens_restaurant_id_name_key" UNIQUE ("restaurant_id", "name");



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_insights"
    ADD CONSTRAINT "google_business_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_insights"
    ADD CONSTRAINT "google_business_insights_restaurant_id_date_metric_name_key" UNIQUE ("restaurant_id", "date", "metric_name");



ALTER TABLE ONLY "public"."google_business_reviews"
    ADD CONSTRAINT "google_business_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_business_reviews"
    ADD CONSTRAINT "google_business_reviews_restaurant_id_google_review_id_key" UNIQUE ("restaurant_id", "google_review_id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_restaurant_id_name_key" UNIQUE ("restaurant_id", "name");



ALTER TABLE ONLY "public"."menu_items_allergens"
    ADD CONSTRAINT "menu_items_allergens_pkey" PRIMARY KEY ("menu_item_id", "allergen_id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_elements"
    ADD CONSTRAINT "restaurant_elements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_stripe_logs"
    ADD CONSTRAINT "restaurant_stripe_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_restaurant_id_user_id_key" UNIQUE ("restaurant_id", "user_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_restaurant_id_number_key" UNIQUE ("restaurant_id", "number");



CREATE INDEX "email_verifications_token_idx" ON "public"."email_verifications" USING "btree" ("token");



CREATE INDEX "email_verifications_user_id_idx" ON "public"."email_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_google_business_insights_date" ON "public"."google_business_insights" USING "btree" ("date");



CREATE INDEX "idx_google_business_insights_metric" ON "public"."google_business_insights" USING "btree" ("metric_name");



CREATE INDEX "idx_google_business_insights_restaurant_id" ON "public"."google_business_insights" USING "btree" ("restaurant_id");



CREATE INDEX "idx_google_business_reviews_rating" ON "public"."google_business_reviews" USING "btree" ("rating");



CREATE INDEX "idx_google_business_reviews_restaurant_id" ON "public"."google_business_reviews" USING "btree" ("restaurant_id");



CREATE INDEX "idx_google_business_reviews_review_time" ON "public"."google_business_reviews" USING "btree" ("review_time");



CREATE INDEX "idx_newsletter_subscriptions_created_at" ON "public"."newsletter_subscriptions" USING "btree" ("created_at");



CREATE INDEX "idx_newsletter_subscriptions_email" ON "public"."newsletter_subscriptions" USING "btree" ("email");



CREATE INDEX "idx_newsletter_subscriptions_is_active" ON "public"."newsletter_subscriptions" USING "btree" ("is_active");



CREATE INDEX "idx_newsletter_subscriptions_last_email_sent_at" ON "public"."newsletter_subscriptions" USING "btree" ("last_email_sent_at");



CREATE INDEX "idx_orders_restaurant_id" ON "public"."orders" USING "btree" ("restaurant_id");



CREATE INDEX "idx_orders_stripe_payment_intent_id" ON "public"."orders" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_password_reset_tokens_expires_at" ON "public"."password_reset_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_password_reset_tokens_token" ON "public"."password_reset_tokens" USING "btree" ("token");



CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_payments_currency" ON "public"."payments" USING "btree" ("currency");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_refund_id" ON "public"."payments" USING "btree" ("refund_id");



CREATE INDEX "idx_payments_restaurant_id" ON "public"."payments" USING "btree" ("restaurant_id");



CREATE INDEX "idx_restaurant_elements_restaurant_id" ON "public"."restaurant_elements" USING "btree" ("restaurant_id");



CREATE INDEX "idx_restaurant_elements_type" ON "public"."restaurant_elements" USING "btree" ("type");



CREATE INDEX "idx_restaurants_currency" ON "public"."restaurants" USING "btree" ("currency");



CREATE INDEX "idx_restaurants_google_business_id" ON "public"."restaurants" USING "btree" ("google_business_id");



CREATE INDEX "idx_restaurants_is_open" ON "public"."restaurants" USING "btree" ("is_open");



CREATE INDEX "idx_restaurants_onboarding_completed" ON "public"."restaurants" USING "btree" ("onboarding_completed");



CREATE INDEX "idx_restaurants_owner_id" ON "public"."restaurants" USING "btree" ("owner_id");



CREATE INDEX "idx_restaurants_payment_methods" ON "public"."restaurants" USING "gin" ("payment_methods");



CREATE INDEX "idx_restaurants_stripe_account_enabled" ON "public"."restaurants" USING "btree" ("stripe_account_enabled");



CREATE INDEX "idx_restaurants_stripe_account_id" ON "public"."restaurants" USING "btree" ("stripe_account_id") WHERE ("stripe_account_id" IS NOT NULL);



CREATE INDEX "idx_restaurants_stripe_customer_id" ON "public"."restaurants" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_restaurants_subscription_status" ON "public"."restaurants" USING "btree" ("subscription_status");



CREATE INDEX "idx_staff_restaurant_id" ON "public"."staff" USING "btree" ("restaurant_id");



CREATE INDEX "idx_staff_user_id" ON "public"."staff" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_logs_restaurant_id" ON "public"."restaurant_stripe_logs" USING "btree" ("restaurant_id");



CREATE INDEX "idx_subscriptions_currency" ON "public"."subscriptions" USING "btree" ("currency");



CREATE INDEX "idx_subscriptions_current_period_end" ON "public"."subscriptions" USING "btree" ("current_period_end");



CREATE INDEX "idx_subscriptions_current_period_start" ON "public"."subscriptions" USING "btree" ("current_period_start");



CREATE INDEX "idx_subscriptions_id" ON "public"."subscriptions" USING "btree" ("id");



CREATE INDEX "idx_subscriptions_restaurant_id" ON "public"."subscriptions" USING "btree" ("restaurant_id");



CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_stripe_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_stripe_price_id" ON "public"."subscriptions" USING "btree" ("stripe_price_id");



CREATE INDEX "idx_subscriptions_stripe_subscription_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_trial_end" ON "public"."subscriptions" USING "btree" ("trial_end");



CREATE INDEX "idx_tables_layout" ON "public"."tables" USING "btree" ("layout_x", "layout_y");



CREATE INDEX "profiles_id_idx" ON "public"."profiles" USING "btree" ("id");



CREATE OR REPLACE TRIGGER "add_default_menu_data_trigger" AFTER INSERT ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_add_default_menu_data"();



CREATE OR REPLACE TRIGGER "create_owner_staff_after_restaurant" AFTER INSERT ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."create_owner_staff_record"();



CREATE OR REPLACE TRIGGER "set_qr_code_trigger" BEFORE INSERT ON "public"."tables" FOR EACH ROW EXECUTE FUNCTION "public"."set_qr_code_on_insert"();



CREATE OR REPLACE TRIGGER "stripe_account_updated" BEFORE UPDATE OF "stripe_account_id", "stripe_account_enabled", "stripe_account_requirements" ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."handle_stripe_account_update"();



CREATE OR REPLACE TRIGGER "trigger_log_restaurant_stripe_changes" BEFORE UPDATE OF "stripe_account_id", "stripe_account_enabled", "stripe_account_requirements" ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."log_restaurant_stripe_changes"();



CREATE OR REPLACE TRIGGER "update_allergens_updated_at" BEFORE UPDATE ON "public"."allergens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_google_business_reviews_updated_at" BEFORE UPDATE ON "public"."google_business_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_google_business_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "update_menu_categories_updated_at" BEFORE UPDATE ON "public"."menu_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_menu_items_updated_at" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_newsletter_subscriptions_updated_at" BEFORE UPDATE ON "public"."newsletter_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_restaurants_updated_at" BEFORE UPDATE ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_updated_at" BEFORE UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tables_updated_at" BEFORE UPDATE ON "public"."tables" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."allergens"
    ADD CONSTRAINT "allergens_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_insights"
    ADD CONSTRAINT "google_business_insights_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_business_reviews"
    ADD CONSTRAINT "google_business_reviews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items_allergens"
    ADD CONSTRAINT "menu_items_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "public"."allergens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items_allergens"
    ADD CONSTRAINT "menu_items_allergens_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurant_elements"
    ADD CONSTRAINT "restaurant_elements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurant_stripe_logs"
    ADD CONSTRAINT "restaurant_stripe_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin access to payments" ON "public"."payments" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow admin access to restaurants for Stripe updates" ON "public"."restaurants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow admin access to subscriptions" ON "public"."subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow public newsletter subscription" ON "public"."newsletter_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow service role full access" ON "public"."newsletter_subscriptions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow users to update own subscription" ON "public"."newsletter_subscriptions" FOR UPDATE USING (("auth"."email"() = "email"));



CREATE POLICY "Allow users to view own subscription" ON "public"."newsletter_subscriptions" FOR SELECT USING (("auth"."email"() = "email"));



CREATE POLICY "Authenticated users can view elements" ON "public"."restaurant_elements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "restaurant_elements"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Enable all operations for users based on owner_id" ON "public"."restaurants" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Enable insert for service role" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Public can view active menu items" ON "public"."menu_items" FOR SELECT USING (("is_available" = true));



CREATE POLICY "Restaurant owners can insert their own Stripe logs" ON "public"."restaurant_stripe_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "restaurant_stripe_logs"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage allergens" ON "public"."allergens" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "allergens"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage elements" ON "public"."restaurant_elements" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "restaurant_elements"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage feedback" ON "public"."feedback" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "feedback"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage menu categories" ON "public"."menu_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "menu_categories"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage menu item allergens" ON "public"."menu_items_allergens" USING ((EXISTS ( SELECT 1
   FROM ("public"."menu_items" "mi"
     JOIN "public"."restaurants" "r" ON (("r"."id" = "mi"."restaurant_id")))
  WHERE (("mi"."id" = "menu_items_allergens"."menu_item_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage menu items" ON "public"."menu_items" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "menu_items"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage order items" ON "public"."order_items" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."restaurants" "r" ON (("r"."id" = "o"."restaurant_id")))
  WHERE (("o"."id" = "order_items"."order_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage orders" ON "public"."orders" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "orders"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage payments" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "payments"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage staff" ON "public"."staff" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "staff"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage subscriptions" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "subscriptions"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can manage tables" ON "public"."tables" USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "tables"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can update their review replies" ON "public"."google_business_reviews" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "google_business_reviews"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can view activity logs" ON "public"."activity_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "activity_logs"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can view their Google Business insights" ON "public"."google_business_insights" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "google_business_insights"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can view their Google Business reviews" ON "public"."google_business_reviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "google_business_reviews"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Restaurant owners can view their own Stripe logs" ON "public"."restaurant_stripe_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "restaurant_stripe_logs"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Service role can manage password reset tokens" ON "public"."password_reset_tokens" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role has full access to email verifications" ON "public"."email_verifications" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Staff can view own record" ON "public"."staff" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Staff can view staff in same restaurant" ON "public"."staff" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "staff"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))) OR ("restaurant_id" IN ( SELECT "s"."restaurant_id"
   FROM "public"."staff" "s"
  WHERE (("s"."user_id" = "auth"."uid"()) AND ("s"."is_active" = true))))));



CREATE POLICY "System can manage all Stripe logs" ON "public"."restaurant_stripe_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete their own restaurants" ON "public"."restaurants" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own password reset tokens" ON "public"."password_reset_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own restaurants" ON "public"."restaurants" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own newsletter subscriptions" ON "public"."newsletter_subscriptions" USING (("auth"."email"() = "email"));



CREATE POLICY "Users can manage their own notifications" ON "public"."notifications" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own email verifications" ON "public"."email_verifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update table layouts" ON "public"."tables" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "tables"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own password reset tokens" ON "public"."password_reset_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own restaurants" ON "public"."restaurants" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can view table layouts" ON "public"."tables" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants" "r"
  WHERE (("r"."id" = "tables"."restaurant_id") AND ("r"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own password reset tokens" ON "public"."password_reset_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own restaurant payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."restaurants"
  WHERE (("restaurants"."id" = "payments"."restaurant_id") AND ("restaurants"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own restaurants" ON "public"."restaurants" FOR SELECT USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."allergens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_business_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items_allergens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurant_elements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurant_stripe_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tables" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_default_menu_data"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_default_menu_data"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_default_menu_data"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_update_table_layouts"("layout_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_update_table_layouts"("layout_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_update_table_layouts"("layout_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_qr_code_status"("table_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_restaurant_access"("restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_restaurant_access"("restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_restaurant_access"("restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_subscription_table_structure"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_subscription_table_structure"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subscription_table_structure"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_account_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_account_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_restaurant_onboarding"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_account_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_owner_staff_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_owner_staff_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_owner_staff_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_with_fallback"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_status" "text", "p_method" "text", "p_stripe_payment_id" "text", "p_currency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_all_upload_issues"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_all_upload_issues"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_all_upload_issues"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_menu_upload_issue"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_issue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_issue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions_v3"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions_v3"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_menu_upload_permissions_v3"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_default_menu_data"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_default_menu_data"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_default_menu_data"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_newsletter_subscribers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_newsletter_subscribers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_newsletter_subscribers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_permissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_permissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_permissions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_id"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_account"("p_stripe_account_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_by_stripe_customer"("p_stripe_customer_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_elements"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_elements"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_elements"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_id_by_stripe_customer"("p_stripe_customer_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_id_by_stripe_customer"("p_stripe_customer_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_id_by_stripe_customer"("p_stripe_customer_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_payment_stats"("p_restaurant_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_stripe_connect_status"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_restaurant_subscription_status"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_verification_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_deauthorization"("p_stripe_account_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"("p_stripe_account_id" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"("p_stripe_account_id" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_account_update"("p_stripe_account_id" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("restaurant_id" "uuid", "required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("restaurant_id" "uuid", "required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("restaurant_id" "uuid", "required_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_staff_permission"("restaurant_id" "uuid", "required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_staff_permission"("restaurant_id" "uuid", "required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_staff_permission"("restaurant_id" "uuid", "required_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_verified"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_verified"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_verified"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_restaurant_owner"("restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_restaurant_owner"("restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_restaurant_owner"("restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_stripe_connect_ready"("restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_stripe_connect_ready"("restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_stripe_connect_ready"("restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_staff_permission"("permissions" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_staff_permission"("permissions" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_staff_permission"("permissions" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_restaurant_stripe_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_restaurant_stripe_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_restaurant_stripe_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_intent_id" "text", "p_amount" integer, "p_currency" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_intent_id" "text", "p_amount" integer, "p_currency" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment"("p_order_id" "uuid", "p_payment_intent_id" "text", "p_amount" integer, "p_currency" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_method" "text", "p_stripe_payment_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_method" "text", "p_stripe_payment_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment"("p_restaurant_id" "uuid", "p_order_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_method" "text", "p_stripe_payment_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_refund_amount" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_refund_amount" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_refund_amount" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_refund"("p_payment_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_stripe_account_status"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_qr_code"("table_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_qr_code_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_qr_code_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_qr_code_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."subscribe_to_newsletter"("subscriber_email" "text", "subscriber_first_name" "text", "subscriber_last_name" "text", "subscriber_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."subscribe_to_newsletter"("subscriber_email" "text", "subscriber_first_name" "text", "subscriber_last_name" "text", "subscriber_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."subscribe_to_newsletter"("subscriber_email" "text", "subscriber_first_name" "text", "subscriber_last_name" "text", "subscriber_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_add_default_menu_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_add_default_menu_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_add_default_menu_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unsubscribe_from_newsletter"("subscriber_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unsubscribe_from_newsletter"("subscriber_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unsubscribe_from_newsletter"("subscriber_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_google_business_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_google_business_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_google_business_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_qr_codes_for_environment"("new_base_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_qr_codes_for_environment"("new_base_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_qr_codes_for_environment"("new_base_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_onboarding_completed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_onboarding_completed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_completion"("p_restaurant_id" "uuid", "p_stripe_customer_id" "text", "p_onboarding_completed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_status"("p_restaurant_id" "uuid", "p_onboarding_completed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_status"("p_restaurant_id" "uuid", "p_onboarding_completed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_restaurant_onboarding_status"("p_restaurant_id" "uuid", "p_onboarding_completed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_restaurant_stripe_application"("p_restaurant_id" "uuid", "p_stripe_application_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_restaurant_stripe_application"("p_restaurant_id" "uuid", "p_stripe_application_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_restaurant_stripe_application"("p_restaurant_id" "uuid", "p_stripe_application_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status"("p_restaurant_id" "uuid", "p_subscription_status" "text", "p_stripe_customer_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_restaurant_subscription_status_simple"("p_restaurant_id" "uuid", "p_subscription_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stripe_connect_status"("p_restaurant_id" "uuid", "p_stripe_account_id" "text", "p_charges_enabled" boolean, "p_requirements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_table_layout"("table_id" "uuid", "x_pos" integer, "y_pos" integer, "rotation" integer, "width" integer, "height" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_table_layout"("table_id" "uuid", "x_pos" integer, "y_pos" integer, "rotation" integer, "width" integer, "height" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_table_layout"("table_id" "uuid", "x_pos" integer, "y_pos" integer, "rotation" integer, "width" integer, "height" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_restaurant_elements"("p_restaurant_id" "uuid", "p_elements" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_restaurant_elements"("p_restaurant_id" "uuid", "p_elements" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_restaurant_elements"("p_restaurant_id" "uuid", "p_elements" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_stripe_subscription_id" "text", "p_restaurant_id" "uuid", "p_plan" "text", "p_interval" "text", "p_status" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_trial_start" timestamp with time zone, "p_trial_end" timestamp with time zone, "p_cancel_at" timestamp with time zone, "p_canceled_at" timestamp with time zone, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_stripe_connect_setup"("p_restaurant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_email"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_email"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_email"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password_reset_token"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password_reset_token"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password_reset_token"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_restaurant_stripe_data"("p_restaurant_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."allergens" TO "anon";
GRANT ALL ON TABLE "public"."allergens" TO "authenticated";
GRANT ALL ON TABLE "public"."allergens" TO "service_role";



GRANT ALL ON TABLE "public"."email_verifications" TO "anon";
GRANT ALL ON TABLE "public"."email_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_insights" TO "anon";
GRANT ALL ON TABLE "public"."google_business_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_insights" TO "service_role";



GRANT ALL ON TABLE "public"."google_business_reviews" TO "anon";
GRANT ALL ON TABLE "public"."google_business_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."google_business_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."menu_categories" TO "anon";
GRANT ALL ON TABLE "public"."menu_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_categories" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items_allergens" TO "anon";
GRANT ALL ON TABLE "public"."menu_items_allergens" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items_allergens" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_elements" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_elements" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_elements" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_stripe_connect_overview" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_stripe_connect_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_stripe_connect_overview" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_stripe_logs" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_stripe_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_stripe_logs" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_subscription_overview" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_subscription_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_subscription_overview" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tables" TO "anon";
GRANT ALL ON TABLE "public"."tables" TO "authenticated";
GRANT ALL ON TABLE "public"."tables" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

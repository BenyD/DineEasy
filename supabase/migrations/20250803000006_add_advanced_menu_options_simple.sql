-- Add advanced menu item options (simplified version)
-- This migration adds support for size variations, modifiers, and combo meals

-- 1. Menu Item Size Variations
CREATE TABLE IF NOT EXISTS "public"."menu_item_sizes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price_modifier" numeric(10,2) DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "menu_item_sizes_pkey" PRIMARY KEY ("id")
);

-- 2. Menu Item Modifiers (Add-ons, Substitutions, etc.)
CREATE TABLE IF NOT EXISTS "public"."menu_item_modifiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL CHECK ("type" IN ('addon', 'substitution', 'preparation', 'sauce', 'topping')),
    "price_modifier" numeric(10,2) DEFAULT 0,
    "is_required" boolean DEFAULT false,
    "max_selections" integer DEFAULT 1,
    "sort_order" integer DEFAULT 0,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "menu_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- 3. Combo Meals
CREATE TABLE IF NOT EXISTS "public"."combo_meals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_price" numeric(10,2) NOT NULL,
    "discount_percentage" numeric(5,2) DEFAULT 0,
    "is_available" boolean DEFAULT true,
    "image_url" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "combo_meals_pkey" PRIMARY KEY ("id")
);

-- 4. Combo Meal Items (what's included in each combo)
CREATE TABLE IF NOT EXISTS "public"."combo_meal_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "combo_meal_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL CHECK ("item_type" IN ('main', 'side', 'drink', 'dessert')),
    "is_required" boolean DEFAULT true,
    "is_customizable" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "combo_meal_items_pkey" PRIMARY KEY ("id")
);

-- 5. Combo Meal Options (customizable choices within combos)
CREATE TABLE IF NOT EXISTS "public"."combo_meal_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "combo_meal_item_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "price_modifier" numeric(10,2) DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "combo_meal_options_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."menu_item_sizes" 
ADD CONSTRAINT "menu_item_sizes_menu_item_id_fkey" 
FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;

ALTER TABLE "public"."menu_item_modifiers" 
ADD CONSTRAINT "menu_item_modifiers_menu_item_id_fkey" 
FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;

ALTER TABLE "public"."combo_meals" 
ADD CONSTRAINT "combo_meals_restaurant_id_fkey" 
FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;

ALTER TABLE "public"."combo_meal_items" 
ADD CONSTRAINT "combo_meal_items_combo_meal_id_fkey" 
FOREIGN KEY ("combo_meal_id") REFERENCES "public"."combo_meals"("id") ON DELETE CASCADE;

ALTER TABLE "public"."combo_meal_items" 
ADD CONSTRAINT "combo_meal_items_menu_item_id_fkey" 
FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;

ALTER TABLE "public"."combo_meal_options" 
ADD CONSTRAINT "combo_meal_options_combo_meal_item_id_fkey" 
FOREIGN KEY ("combo_meal_item_id") REFERENCES "public"."combo_meal_items"("id") ON DELETE CASCADE;

ALTER TABLE "public"."combo_meal_options" 
ADD CONSTRAINT "combo_meal_options_menu_item_id_fkey" 
FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX "idx_menu_item_sizes_menu_item_id" ON "public"."menu_item_sizes"("menu_item_id");
CREATE INDEX "idx_menu_item_modifiers_menu_item_id" ON "public"."menu_item_modifiers"("menu_item_id");
CREATE INDEX "idx_combo_meals_restaurant_id" ON "public"."combo_meals"("restaurant_id");
CREATE INDEX "idx_combo_meal_items_combo_meal_id" ON "public"."combo_meal_items"("combo_meal_id");
CREATE INDEX "idx_combo_meal_options_combo_meal_item_id" ON "public"."combo_meal_options"("combo_meal_item_id");

-- Add RLS policies (simplified)
ALTER TABLE "public"."menu_item_sizes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."menu_item_modifiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."combo_meals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."combo_meal_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."combo_meal_options" ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - will be refined later
CREATE POLICY "Enable all for authenticated users" ON "public"."menu_item_sizes" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON "public"."menu_item_modifiers" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON "public"."combo_meals" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON "public"."combo_meal_items" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON "public"."combo_meal_options" FOR ALL USING (auth.role() = 'authenticated');

-- Add updated_at triggers
CREATE TRIGGER "update_menu_item_sizes_updated_at" BEFORE UPDATE ON "public"."menu_item_sizes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_menu_item_modifiers_updated_at" BEFORE UPDATE ON "public"."menu_item_modifiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_combo_meals_updated_at" BEFORE UPDATE ON "public"."combo_meals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_combo_meal_items_updated_at" BEFORE UPDATE ON "public"."combo_meal_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE TRIGGER "update_combo_meal_options_updated_at" BEFORE UPDATE ON "public"."combo_meal_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Add comments
COMMENT ON TABLE "public"."menu_item_sizes" IS 'Size variations for menu items (Small, Medium, Large)';
COMMENT ON TABLE "public"."menu_item_modifiers" IS 'Add-ons, substitutions, and preparation options for menu items';
COMMENT ON TABLE "public"."combo_meals" IS 'Pre-built meal combinations with discounts';
COMMENT ON TABLE "public"."combo_meal_items" IS 'Items included in combo meals';
COMMENT ON TABLE "public"."combo_meal_options" IS 'Customizable options within combo meals'; 
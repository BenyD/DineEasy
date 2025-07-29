-- Fix foreign key constraints to allow proper cascade deletion from auth.users
-- This ensures that when a user is deleted, all related data is properly cleaned up

-- 1. Fix order_items -> menu_items foreign key (CASCADE DELETE)
ALTER TABLE order_items DROP CONSTRAINT order_items_menu_item_id_fkey;
ALTER TABLE order_items 
ADD CONSTRAINT order_items_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) 
REFERENCES menu_items(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 2. Fix menu_items -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE menu_items DROP CONSTRAINT menu_items_restaurant_id_fkey;
ALTER TABLE menu_items 
ADD CONSTRAINT menu_items_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 3. Fix menu_categories -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE menu_categories DROP CONSTRAINT menu_categories_restaurant_id_fkey;
ALTER TABLE menu_categories 
ADD CONSTRAINT menu_categories_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 4. Fix allergens -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE allergens DROP CONSTRAINT allergens_restaurant_id_fkey;
ALTER TABLE allergens 
ADD CONSTRAINT allergens_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 5. Fix tables -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE tables DROP CONSTRAINT tables_restaurant_id_fkey;
ALTER TABLE tables 
ADD CONSTRAINT tables_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 6. Fix orders -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE orders DROP CONSTRAINT orders_restaurant_id_fkey;
ALTER TABLE orders 
ADD CONSTRAINT orders_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 7. Fix payments -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE payments DROP CONSTRAINT payments_restaurant_id_fkey;
ALTER TABLE payments 
ADD CONSTRAINT payments_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 8. Fix feedback -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE feedback DROP CONSTRAINT feedback_restaurant_id_fkey;
ALTER TABLE feedback 
ADD CONSTRAINT feedback_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 9. Fix activity_logs -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE activity_logs DROP CONSTRAINT activity_logs_restaurant_id_fkey;
ALTER TABLE activity_logs 
ADD CONSTRAINT activity_logs_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 10. Fix notifications -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE notifications DROP CONSTRAINT notifications_restaurant_id_fkey;
ALTER TABLE notifications 
ADD CONSTRAINT notifications_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 11. Fix staff -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE staff DROP CONSTRAINT staff_restaurant_id_fkey;
ALTER TABLE staff 
ADD CONSTRAINT staff_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 12. Fix subscriptions -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_restaurant_id_fkey;
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 13. Fix restaurant_elements -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE restaurant_elements DROP CONSTRAINT restaurant_elements_restaurant_id_fkey;
ALTER TABLE restaurant_elements 
ADD CONSTRAINT restaurant_elements_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 14. Fix restaurant_stripe_logs -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE restaurant_stripe_logs DROP CONSTRAINT restaurant_stripe_logs_restaurant_id_fkey;
ALTER TABLE restaurant_stripe_logs 
ADD CONSTRAINT restaurant_stripe_logs_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 15. Fix google_business_reviews -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE google_business_reviews DROP CONSTRAINT google_business_reviews_restaurant_id_fkey;
ALTER TABLE google_business_reviews 
ADD CONSTRAINT google_business_reviews_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 16. Fix google_business_insights -> restaurants foreign key (CASCADE DELETE)
ALTER TABLE google_business_insights DROP CONSTRAINT google_business_insights_restaurant_id_fkey;
ALTER TABLE google_business_insights 
ADD CONSTRAINT google_business_insights_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 17. Fix order_items -> orders foreign key (CASCADE DELETE)
ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
ALTER TABLE order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES orders(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 18. Fix orders -> tables foreign key (SET NULL when table is deleted)
ALTER TABLE orders DROP CONSTRAINT orders_table_id_fkey;
ALTER TABLE orders 
ADD CONSTRAINT orders_table_id_fkey 
FOREIGN KEY (table_id) 
REFERENCES tables(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 19. Fix menu_items -> menu_categories foreign key (CASCADE DELETE)
ALTER TABLE menu_items DROP CONSTRAINT menu_items_category_id_fkey;
ALTER TABLE menu_items 
ADD CONSTRAINT menu_items_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES menu_categories(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 20. Fix menu_items_allergens -> menu_items foreign key (CASCADE DELETE)
ALTER TABLE menu_items_allergens DROP CONSTRAINT menu_items_allergens_menu_item_id_fkey;
ALTER TABLE menu_items_allergens 
ADD CONSTRAINT menu_items_allergens_menu_item_id_fkey 
FOREIGN KEY (menu_item_id) 
REFERENCES menu_items(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 21. Fix menu_items_allergens -> allergens foreign key (CASCADE DELETE)
ALTER TABLE menu_items_allergens DROP CONSTRAINT menu_items_allergens_allergen_id_fkey;
ALTER TABLE menu_items_allergens 
ADD CONSTRAINT menu_items_allergens_allergen_id_fkey 
FOREIGN KEY (allergen_id) 
REFERENCES allergens(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 22. Fix payments -> orders foreign key (CASCADE DELETE)
ALTER TABLE payments DROP CONSTRAINT payments_order_id_fkey;
ALTER TABLE payments 
ADD CONSTRAINT payments_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES orders(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 23. Fix feedback -> orders foreign key (SET NULL when order is deleted)
ALTER TABLE feedback DROP CONSTRAINT feedback_order_id_fkey;
ALTER TABLE feedback 
ADD CONSTRAINT feedback_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES orders(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;
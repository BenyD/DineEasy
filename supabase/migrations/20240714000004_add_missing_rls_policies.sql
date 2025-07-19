-- Add RLS policies for menu_categories table
create policy "Staff can manage menu categories"
  on menu_categories for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = menu_categories.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    )
  );

-- Add RLS policies for allergens table
create policy "Staff can manage allergens"
  on allergens for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = allergens.restaurant_id
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    )
  );

-- Add RLS policies for menu_items_allergens table
create policy "Staff can manage menu item allergens"
  on menu_items_allergens for all
  using (
    exists (
      select 1 from staff
      where staff.restaurant_id = (
        select restaurant_id from menu_items where id = menu_items_allergens.menu_item_id
      )
      and staff.user_id = auth.uid()
      and staff.is_active = true
      and staff.permissions && array['menu.manage']::text[]
    )
  ); 
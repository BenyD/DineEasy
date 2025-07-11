-- Create a temporary table to store existing subscriptions
create temporary table temp_subscriptions as
select * from subscriptions;

-- Drop existing subscriptions table constraints
alter table subscriptions
  drop constraint if exists subscriptions_restaurant_id_fkey;

-- Update existing subscriptions with new schema
update subscriptions
set
  id = stripe_subscription_id,
  internal_id = uuid_generate_v4()
where
  id is null or id = stripe_subscription_id;

-- Ensure all subscriptions have proper timestamps
update subscriptions
set
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

-- Add back foreign key constraint
alter table subscriptions
  add constraint subscriptions_restaurant_id_fkey
  foreign key (restaurant_id)
  references restaurants(id)
  on delete cascade;

-- Create index on stripe_subscription_id for faster lookups
create index if not exists idx_subscriptions_stripe_id
  on subscriptions(stripe_subscription_id);

-- Create index on restaurant_id for faster lookups
create index if not exists idx_subscriptions_restaurant_id
  on subscriptions(restaurant_id);

-- Verify and log any subscriptions without proper IDs
do $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from subscriptions
  where id is null or internal_id is null;

  if invalid_count > 0 then
    raise warning 'Found % subscriptions with missing IDs', invalid_count;
  end if;
end $$; 
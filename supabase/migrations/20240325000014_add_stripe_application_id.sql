-- Add stripe_application_id column to restaurants table for better Stripe Connect tracking
-- This will help us properly link account.application.authorized events to restaurants

-- Add the column
alter table restaurants add column if not exists stripe_application_id text;

-- Add index for faster lookups
create index if not exists idx_restaurants_stripe_application_id on restaurants(stripe_application_id);

-- Add comment for documentation
comment on column restaurants.stripe_application_id is 'Stripe Connect application ID for linking account.application.authorized events';

-- Create function to update restaurant with application ID
create or replace function update_restaurant_stripe_application(
  p_restaurant_id uuid,
  p_stripe_application_id text
)
returns void as $$
begin
  update restaurants
  set
    stripe_application_id = p_stripe_application_id,
    updated_at = now()
  where id = p_restaurant_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function update_restaurant_stripe_application(uuid, text) to authenticated;

-- Create function to get restaurant by application ID
create or replace function get_restaurant_by_stripe_application(p_stripe_application_id text)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  email text,
  stripe_account_id text,
  stripe_application_id text,
  stripe_account_enabled boolean
) as $$
begin
  return query
  select
    r.id,
    r.owner_id,
    r.name,
    r.email,
    r.stripe_account_id,
    r.stripe_application_id,
    r.stripe_account_enabled
  from restaurants r
  where r.stripe_application_id = p_stripe_application_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function get_restaurant_by_stripe_application(text) to authenticated;

-- Log the changes
do $$
begin
  raise log 'Added stripe_application_id column and related functions to restaurants table';
  raise log 'This will enable proper linking of account.application.authorized events';
end $$; 
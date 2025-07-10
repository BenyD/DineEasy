-- Add Stripe Connect fields to restaurants table
alter table restaurants
add column stripe_account_id text,
add column stripe_account_enabled boolean default false,
add column stripe_account_requirements jsonb,
add column stripe_account_created_at timestamp with time zone;

-- Create function to update restaurant when Stripe account is updated
create or replace function handle_stripe_account_update()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for Stripe account updates
create trigger stripe_account_updated
  before update of stripe_account_id, stripe_account_enabled, stripe_account_requirements
  on restaurants
  for each row
  execute function handle_stripe_account_update(); 
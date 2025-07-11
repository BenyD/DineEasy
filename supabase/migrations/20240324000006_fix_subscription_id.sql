-- Fix subscription ID column type
alter table subscriptions
  alter column id type text,
  alter column id set default null;

-- Add a new UUID column for internal reference
alter table subscriptions
  add column internal_id uuid default uuid_generate_v4() not null;

-- Make internal_id the primary key
alter table subscriptions
  drop constraint subscriptions_pkey,
  add primary key (internal_id);

-- Add unique constraint on id (stripe_subscription_id)
alter table subscriptions
  add constraint subscriptions_id_key unique (id);

-- Update the trigger for updated_at
drop trigger if exists update_subscriptions_updated_at on subscriptions;
create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function update_updated_at_column(); 
-- Fix subscription timestamp columns to handle null values from Stripe
-- Make current_period_start and current_period_end nullable since Stripe can send null values
alter table subscriptions
  alter column current_period_start drop not null,
  alter column current_period_end drop not null;

-- Add default values for created_at and updated_at if they're null
update subscriptions
set
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where created_at is null or updated_at is null;

-- Add a check constraint to ensure at least one of the period timestamps is set
-- This allows for trial subscriptions that might not have current_period_start/end
alter table subscriptions
  add constraint check_subscription_timestamps
  check (
    current_period_start is not null or 
    current_period_end is not null or 
    trial_start is not null or 
    trial_end is not null
  );

-- Add index for better performance on timestamp queries
create index if not exists idx_subscriptions_current_period_start 
  on subscriptions(current_period_start);

create index if not exists idx_subscriptions_current_period_end 
  on subscriptions(current_period_end);

create index if not exists idx_subscriptions_trial_end 
  on subscriptions(trial_end); 
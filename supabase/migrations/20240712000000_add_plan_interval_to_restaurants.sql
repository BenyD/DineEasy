-- Add plan and interval columns to restaurants for subscription sync
alter table restaurants add column if not exists plan subscription_plan;
alter table restaurants add column if not exists interval subscription_interval;
-- Optionally, add index for faster queries
create index if not exists idx_restaurants_plan on restaurants(plan);
create index if not exists idx_restaurants_interval on restaurants(interval); 
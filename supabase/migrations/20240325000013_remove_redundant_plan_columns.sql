-- Remove redundant plan and interval columns from restaurants table
-- since we get this data from the subscriptions table

-- Drop the indexes first
drop index if exists idx_restaurants_plan;
drop index if exists idx_restaurants_interval;

-- Remove the columns
alter table restaurants drop column if exists plan;
alter table restaurants drop column if exists interval;

-- Log the changes
do $$
begin
  raise log 'Removed redundant plan and interval columns from restaurants table';
  raise log 'Plan and interval data is now sourced from the subscriptions table';
end $$; 
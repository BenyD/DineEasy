-- Add support for additional currencies
-- Drop the existing currency enum and recreate it with new currencies
drop type if exists currency cascade;

create type currency as enum ('USD', 'CHF', 'EUR', 'GBP', 'INR', 'AUD');

-- Update the restaurants table to use the new currency enum
-- First check if the column exists, if not add it
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'restaurants' and column_name = 'currency'
  ) then
    alter table restaurants add column currency currency not null default 'USD';
  else
    alter table restaurants alter column currency type currency using currency::text::currency;
  end if;
end $$;

-- Add currency to subscriptions table for tracking subscription currency
alter table subscriptions 
  add column currency currency not null default 'USD';

-- Add currency to payments table for tracking payment currency
alter table payments 
  add column currency currency not null default 'USD';

-- Create index for currency-based queries
create index if not exists idx_subscriptions_currency 
  on subscriptions(currency);

create index if not exists idx_payments_currency 
  on payments(currency);

create index if not exists idx_restaurants_currency 
  on restaurants(currency); 
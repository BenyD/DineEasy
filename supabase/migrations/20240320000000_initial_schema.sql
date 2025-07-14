-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type restaurant_type as enum ('restaurant', 'cafe', 'bar', 'food-truck');
create type subscription_plan as enum ('starter', 'pro', 'elite');
create type subscription_interval as enum ('monthly', 'yearly');
create type currency as enum ('USD', 'CHF', 'EUR', 'GBP', 'INR', 'AUD', 'AED', 'SEK', 'CAD', 'NZD', 'LKR', 'SGD', 'MYR', 'THB', 'JPY', 'HKD', 'KRW');
create type price_range as enum ('$', '$$', '$$$', '$$$$');
create type order_status as enum ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type payment_method as enum ('cash', 'card', 'other');
create type table_status as enum ('available', 'occupied', 'reserved', 'unavailable');
create type staff_role as enum ('owner', 'manager', 'chef', 'server', 'cashier');
create type activity_type as enum ('order', 'menu', 'staff', 'table', 'payment', 'settings');
create type sentiment as enum ('positive', 'neutral', 'negative');

-- Create profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create restaurants table
create table restaurants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  slug text not null unique,
  description text,
  type restaurant_type not null,
  cuisine text,
  email text not null,
  phone text,
  website text,
  logo_url text,
  cover_url text,
  address text,
  city text,
  postal_code text,
  country text,
  currency currency not null default 'USD',
  tax_rate decimal(5,2) not null default 0,
  vat_number text,
  price_range price_range,
  seating_capacity integer,
  accepts_reservations boolean default false,
  delivery_available boolean default false,
  takeout_available boolean default false,
  opening_hours jsonb,
  subscription_status text,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  plan subscription_plan not null,
  interval subscription_interval not null,
  status text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create staff table
create table staff (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role staff_role not null,
  permissions text[] not null default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, user_id)
);

-- Create menu_categories table
create table menu_categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, name)
);

-- Create allergens table
create table allergens (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  name text not null,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, name)
);

-- Create menu_items table
create table menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  category_id uuid references menu_categories on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  preparation_time interval,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create menu_items_allergens junction table
create table menu_items_allergens (
  menu_item_id uuid references menu_items on delete cascade not null,
  allergen_id uuid references allergens on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (menu_item_id, allergen_id)
);

-- Create tables table
create table tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  number text not null,
  capacity integer not null,
  status table_status default 'available' not null,
  qr_code text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, number)
);

-- Create orders table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  table_id uuid references tables on delete set null,
  status order_status not null default 'pending',
  total_amount decimal(10,2) not null,
  tax_amount decimal(10,2) not null,
  tip_amount decimal(10,2) default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders on delete cascade not null,
  menu_item_id uuid references menu_items on delete set null not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table payments (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  order_id uuid references orders on delete cascade not null,
  amount decimal(10,2) not null,
  status payment_status not null default 'pending',
  method payment_method not null,
  stripe_payment_id text,
  refund_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create feedback table
create table feedback (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  order_id uuid references orders on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  sentiment sentiment not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create activity_logs table
create table activity_logs (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  type activity_type not null,
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table restaurants enable row level security;
alter table subscriptions enable row level security;
alter table staff enable row level security;
alter table menu_categories enable row level security;
alter table allergens enable row level security;
alter table menu_items enable row level security;
alter table menu_items_allergens enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table feedback enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_restaurants_updated_at
  before update on restaurants
  for each row
  execute function update_updated_at_column();

create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function update_updated_at_column();

create trigger update_staff_updated_at
  before update on staff
  for each row
  execute function update_updated_at_column();

create trigger update_menu_categories_updated_at
  before update on menu_categories
  for each row
  execute function update_updated_at_column();

create trigger update_allergens_updated_at
  before update on allergens
  for each row
  execute function update_updated_at_column();

create trigger update_menu_items_updated_at
  before update on menu_items
  for each row
  execute function update_updated_at_column();

create trigger update_tables_updated_at
  before update on tables
  for each row
  execute function update_updated_at_column();

create trigger update_orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at_column();

create trigger update_payments_updated_at
  before update on payments
  for each row
  execute function update_updated_at_column();

-- Add default owner staff record trigger
create or replace function create_owner_staff_record()
returns trigger as $$
begin
  insert into staff (restaurant_id, user_id, role, permissions)
  values (new.id, new.owner_id, 'owner', array['*']);
  return new;
end;
$$ language plpgsql;

create trigger create_owner_staff_after_restaurant
  after insert on restaurants
  for each row
  execute function create_owner_staff_record();

-- Add default profile record trigger
create or replace function create_user_profile()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql;

create trigger create_profile_after_user_signup
  after insert on auth.users
  for each row
  execute function create_user_profile(); 
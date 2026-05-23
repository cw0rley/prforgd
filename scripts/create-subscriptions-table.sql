-- Run this in the Supabase SQL Editor to create the subscriptions table

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text, -- 'monthly', 'yearly', or null (for grandfathered)
  status text not null default 'free', -- 'active', 'canceled', 'expired', 'grandfathered', 'free'
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can insert their own subscription (for grandfathering)
create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Users can update their own subscription
create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Service role can do anything (for Stripe webhooks)
-- This is handled by default when using the service_role key

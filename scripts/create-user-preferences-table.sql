-- Run this in the Supabase SQL Editor to create the per-user preferences table.
-- Stores lightweight UI preferences that should follow the account across
-- devices (e.g. the WODs-screen "Favs" / "My Gear" filter toggles) rather than
-- living in device-local storage.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

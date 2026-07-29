-- Run this in the Supabase SQL Editor to create the public athlete profiles table.
-- Backs the leaderboard: a public username plus the fields that drive divisions
-- (sex + birth_year → age group). Phase 1 keeps rows owner-only; a public read
-- policy (username/division only) is added in the leaderboard's Phase 3.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  sex text check (sex in ('M', 'F')),
  birth_year int check (birth_year between 1900 and 2100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Case-insensitive unique usernames (so "Fran" and "fran" can't both exist).
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Run this in the Supabase SQL Editor.
-- Leaderboard Phase 2: an opt-in flag marking a workout result as public so it
-- appears on the leaderboard. Nothing is public by default — the user explicitly
-- taps "Submit to leaderboard" on an Rx result. The public read policy that
-- exposes these rows (username/score/division only) is added in Phase 3.

alter table public.workout_results
  add column if not exists is_public boolean not null default false;

-- Helps the leaderboard queries that filter to public rows per WOD.
create index if not exists workout_results_public_idx
  on public.workout_results (wod_id)
  where is_public = true and deleted_at is null;

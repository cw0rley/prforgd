-- Soft-delete support for workout_results.
-- Lets a deletion propagate cleanly across devices: instead of hard-deleting a
-- row, we set deleted_at; every device filters those out and removes them locally.
--
-- Run this in the Supabase SQL Editor (project boyjkzbouqqvhnggcgun) BEFORE
-- deploying the matching app/sync code, since the code references deleted_at.

alter table public.workout_results
  add column if not exists deleted_at timestamptz;

-- Speeds up the "live rows" and "deleted rows" queries the sync does per user.
create index if not exists workout_results_deleted_at_idx
  on public.workout_results (user_id, deleted_at);

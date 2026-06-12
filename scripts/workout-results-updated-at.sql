-- Last-write-wins support for workout_results sync + realtime updates.
--
-- updated_at lets sync compare local vs cloud copies of the same row and keep
-- the newer one (instead of "local always wins", which could clobber an edit
-- made on another device). The client sends updated_at on every upsert, so we
-- intentionally do NOT add an auto-bump trigger — the client's edit time is the
-- source of truth.
--
-- Run in the Supabase SQL Editor (project boyjkzbouqqvhnggcgun). Safe to re-run.

alter table public.workout_results
  add column if not exists updated_at timestamptz;

update public.workout_results
  set updated_at = coalesce(created_at, now())
  where updated_at is null;

alter table public.workout_results
  alter column updated_at set default now();

-- Enable realtime so other devices get live updates (subscribeRealtime()).
do $$
begin
  alter publication supabase_realtime add table public.workout_results;
exception
  when duplicate_object then null; -- already added; ignore
end $$;

-- Run this in the Supabase SQL Editor.
-- Leaderboard Phase 3: a curated PUBLIC read layer.
--
-- This view is the ONLY thing readable by other users. It exposes only
-- leaderboard-safe fields — username, sex, a computed age division, the WOD, the
-- score, and the date — for results the athlete explicitly made public (Rx only,
-- not deleted). It never exposes email, notes, or the exact birth year (only the
-- derived division). The view is owned by postgres so it reads past the per-user
-- RLS on the base tables; the WHERE clause is what bounds exposure. (Supabase's
-- linter may flag this as a "security definer view" — that is intentional here:
-- we are deliberately publishing a narrow, non-PII projection.)

create or replace view public.leaderboard_entries as
select
  wr.id,
  p.username,
  p.sex,
  case
    when p.birth_year is null then null
    when (extract(year from now())::int - p.birth_year) < 35 then 'Open'
    when (extract(year from now())::int - p.birth_year) between 35 and 39 then '35-39'
    when (extract(year from now())::int - p.birth_year) between 40 and 44 then '40-44'
    when (extract(year from now())::int - p.birth_year) between 45 and 49 then '45-49'
    when (extract(year from now())::int - p.birth_year) between 50 and 54 then '50-54'
    when (extract(year from now())::int - p.birth_year) between 55 and 59 then '55-59'
    else '60+'
  end as age_division,
  wr.wod_id,
  wr.time_seconds,
  wr.rounds,
  wr.reps,
  wr.date
from public.workout_results wr
join public.profiles p on p.user_id = wr.user_id
where wr.is_public = true
  and wr.deleted_at is null
  and wr.rx = true;

-- Anyone (signed in, or anonymous for a future public leaderboard) can read it.
grant select on public.leaderboard_entries to anon, authenticated;

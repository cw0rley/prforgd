-- Run this in the Supabase SQL Editor (project boyjkzbouqqvhnggcgun) BEFORE
-- deploying the matching client code (src/storage/leaderboardStorage.ts).
--
-- Why this exists: the leaderboard used to fetch every public Rx row for a WOD
-- with no ORDER BY and no LIMIT, then dedupe and rank in the client. PostgREST
-- caps a response at max-rows (1000 by default), and WITHOUT an ORDER BY the
-- rows you get back are an arbitrary subset — so past 1000 rows on a single WOD
-- the client was ranking a random 1000 and the real fastest times could be
-- among the rows that were dropped. That shows up as a leaderboard that is
-- WRONG, not merely truncated, and it can differ between identical requests.
--
-- Doing the dedupe + ranking here removes the cap problem entirely: the
-- function ranks across every matching row inside Postgres and returns only the
-- rows the app actually displays.
--
-- The client still works without this function (it falls back to an explicitly
-- ordered, explicitly capped read of the view), but that fallback is only
-- correct for the top of the board, so run this.

-- Scoring, identical to score() in src/storage/leaderboardStorage.ts: lower is
-- better. A timed WOD ranks by fastest time_seconds; an AMRAP ranks by most
-- rounds+reps, negated so "more" sorts first alongside the time ordering. A
-- given WOD is one shape or the other, so the two never mix within a wod_id.
create or replace function public.get_leaderboard(
  p_wod_id text,
  p_sex text default null,
  p_age_division text default null,
  p_limit int default 500
)
returns setof public.leaderboard_entries
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with scored as (
    select
      le.*,
      case
        when le.time_seconds is not null then le.time_seconds::numeric
        else -(((coalesce(le.rounds, 0)) * 1000) + coalesce(le.reps, 0))::numeric
      end as score
    from public.leaderboard_entries le
    where le.wod_id = p_wod_id
      and (p_sex is null or le.sex = p_sex)
      and (p_age_division is null or le.age_division = p_age_division)
  ),
  -- Each athlete's best result only (usernames are unique). Ties inside one
  -- athlete break on the earliest date, then id, so the pick is deterministic.
  best as (
    select distinct on (s.username) s.*
    from scored s
    order by s.username, s.score, s.date, s.id
  )
  select
    b.id,
    b.username,
    b.sex,
    b.age_division,
    b.wod_id,
    b.time_seconds,
    b.rounds,
    b.reps,
    b.date
  from best b
  -- date then username break score ties, so two identical requests always
  -- return the same rows in the same order.
  order by b.score, b.date, b.username
  limit p_limit;
$$;

-- Same audience as the view itself: readable by signed-in users, and by anon
-- for a future public leaderboard. The function is security invoker, so the
-- caller still needs select on public.leaderboard_entries — the view's WHERE
-- clause remains the thing that bounds exposure.
grant execute on function public.get_leaderboard(text, text, text, int) to anon, authenticated;

-- The returned row type is public.leaderboard_entries, so if that view is ever
-- recreated with different columns this function must be re-run too.
--
-- If the app reports PGRST202 ("Could not find the function") after this runs,
-- PostgREST has not picked up the new function yet: Supabase reloads the schema
-- cache automatically within a few seconds, or you can force it from
-- Settings -> API -> "Reload schema cache". Verify with:
--
--   select rank, username, time_seconds, rounds, reps
--   from (
--     select row_number() over () as rank, * from public.get_leaderboard('murph')
--   ) t;

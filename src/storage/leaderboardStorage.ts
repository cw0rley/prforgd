import { supabase } from '../lib/supabase';

export const AGE_DIVISIONS = ['Open', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'] as const;
export type AgeDivision = (typeof AGE_DIVISIONS)[number];

// How many ranked athletes the board shows. The DB function dedupes before it
// limits, so this is a cap on athletes.
export const MAX_ATHLETES = 500;

// Row cap for the fallback read, which limits ROWS and dedupes afterwards — one
// prolific athlete can hold many rows, so it is deliberately well above
// MAX_ATHLETES. PostgREST's own max-rows (1000 by default) may clip it lower
// still; what makes that safe is the ORDER BY, which puts the best results
// first so a clipped read keeps the top of the board correct.
const FALLBACK_ROW_CAP = 2000;

export interface LeaderboardEntry {
  id: string;
  username: string;
  sex: 'M' | 'F' | null;
  ageDivision: string | null;
  wodId: string;
  timeSeconds: number | null;
  rounds: number | null;
  reps: number | null;
  date: string;
  rank: number;
}

// Lower = better. Timed WODs rank by fastest time; AMRAPs by most rounds+reps
// (negated so "more" sorts first alongside the time ordering).
// Mirrored in SQL by get_leaderboard — keep the two in step.
export function score(e: { timeSeconds: number | null; rounds: number | null; reps: number | null }): number {
  if (e.timeSeconds != null) return e.timeSeconds;
  return -(((e.rounds || 0) * 1000) + (e.reps || 0));
}

function toEntry(r: any): LeaderboardEntry {
  return {
    id: r.id,
    username: r.username,
    sex: r.sex,
    ageDivision: r.age_division,
    wodId: r.wod_id,
    timeSeconds: r.time_seconds,
    rounds: r.rounds,
    reps: r.reps,
    date: r.date,
    rank: 0,
  };
}

// Dedupe view rows to each athlete's best result and number them 1..n (ties get
// distinct, sequential ranks, as they always have). Rows already deduped and
// ordered by get_leaderboard pass through unchanged: the dedupe is a no-op and
// the sort is stable, so the database's tie-breaking survives.
export function rankRows(rows: any[]): LeaderboardEntry[] {
  const bestByUser = new Map<string, LeaderboardEntry>();
  for (const r of rows) {
    const e = toEntry(r);
    const cur = bestByUser.get(e.username);
    if (!cur || score(e) < score(cur)) bestByUser.set(e.username, e);
  }

  const ranked = Array.from(bestByUser.values())
    .sort((a, b) => score(a) - score(b))
    .slice(0, MAX_ATHLETES);
  ranked.forEach((e, i) => { e.rank = i + 1; });
  return ranked;
}

// Fallback for when get_leaderboard is not deployed: read the view directly.
//
// The ordering is what makes this safe rather than merely truncated. Without an
// ORDER BY, PostgREST returns an arbitrary subset once the result set exceeds
// max-rows, so the fastest times could be among the dropped rows and the board
// would be wrong (and could differ between identical requests). Ordered
// best-first, a clipped read still yields correct top ranks. The ordering holds
// for both WOD shapes: a WOD is either timed (time_seconds set, rounds/reps
// null) or an AMRAP (the reverse). date and id break ties deterministically.
async function fetchRowsFromView(
  wodId: string,
  filters?: { sex?: 'M' | 'F'; ageDivision?: AgeDivision }
): Promise<any[] | null> {
  let q = supabase.from('leaderboard_entries').select('*').eq('wod_id', wodId);
  if (filters?.sex) q = q.eq('sex', filters.sex);
  if (filters?.ageDivision) q = q.eq('age_division', filters.ageDivision);

  const { data, error } = await q
    .order('time_seconds', { ascending: true, nullsFirst: false })
    .order('rounds', { ascending: false, nullsFirst: false })
    .order('reps', { ascending: false, nullsFirst: false })
    .order('date', { ascending: true })
    .order('id', { ascending: true })
    .limit(FALLBACK_ROW_CAP);

  if (error || !data) return null;
  return data as any[];
}

// Fetch the public leaderboard for a WOD (Rx only, via the leaderboard_entries
// view), deduped to each athlete's best result and ranked. Optional Sex / age
// division filters. Returns [] on error or when nothing has been submitted.
//
// Ranks come from the database (scripts/create-leaderboard-rank-function.sql),
// which dedupes and orders across every matching row before it limits — so
// correctness does not depend on the result set staying under PostgREST's
// max-rows cap. If that function is missing (the SQL is applied by hand, and a
// client build can reach users before it has been), we fall back to an ordered,
// capped read of the view.
export async function getLeaderboard(
  wodId: string,
  filters?: { sex?: 'M' | 'F'; ageDivision?: AgeDivision }
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_wod_id: wodId,
    p_sex: filters?.sex ?? null,
    p_age_division: filters?.ageDivision ?? null,
    p_limit: MAX_ATHLETES,
  });

  const rows = !error && data ? (data as any[]) : await fetchRowsFromView(wodId, filters);
  if (!rows) return [];
  return rankRows(rows);
}

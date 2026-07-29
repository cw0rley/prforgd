import { supabase } from '../lib/supabase';

export const AGE_DIVISIONS = ['Open', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'] as const;
export type AgeDivision = (typeof AGE_DIVISIONS)[number];

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
function score(e: { timeSeconds: number | null; rounds: number | null; reps: number | null }): number {
  if (e.timeSeconds != null) return e.timeSeconds;
  return -(((e.rounds || 0) * 1000) + (e.reps || 0));
}

// Fetch the public leaderboard for a WOD (Rx only, via the leaderboard_entries
// view), deduped to each athlete's best result and ranked. Optional Sex / age
// division filters. Returns [] on error or when nothing has been submitted.
export async function getLeaderboard(
  wodId: string,
  filters?: { sex?: 'M' | 'F'; ageDivision?: AgeDivision }
): Promise<LeaderboardEntry[]> {
  let q = supabase.from('leaderboard_entries').select('*').eq('wod_id', wodId);
  if (filters?.sex) q = q.eq('sex', filters.sex);
  if (filters?.ageDivision) q = q.eq('age_division', filters.ageDivision);

  const { data, error } = await q;
  if (error || !data) return [];

  // Keep only each athlete's best (usernames are unique).
  const bestByUser = new Map<string, LeaderboardEntry>();
  for (const r of data as any[]) {
    const e: LeaderboardEntry = {
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
    const cur = bestByUser.get(e.username);
    if (!cur || score(e) < score(cur)) bestByUser.set(e.username, e);
  }

  const ranked = Array.from(bestByUser.values()).sort((a, b) => score(a) - score(b));
  ranked.forEach((e, i) => { e.rank = i + 1; });
  return ranked;
}

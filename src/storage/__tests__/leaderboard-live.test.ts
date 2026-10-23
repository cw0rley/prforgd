// Checks the leaderboard read path against the LIVE Supabase project, the way
// the drift test does: the anon key is public and ships in every client build,
// so this needs no secrets, and it skips rather than fails when Supabase is
// unreachable (on a plane, or from a sandbox whose network policy blocks it).
//
// It is here because the ranking fix is only half code. The other half is
// scripts/create-leaderboard-rank-function.sql, applied BY HAND like every
// other migration in this repo, and the ordering in the fallback read is a
// PostgREST query that no local unit test can prove is valid. So this runs the
// real getLeaderboard against the real view and asserts what only the live
// instance can answer: that the columns and ordering are accepted, that the
// result is deterministic and best-first, and — once the function is deployed —
// that its ranking agrees with the client-side ranking it replaced.

// Swap the app's React Native client for a plain Node one: same project, same
// public key, no AsyncStorage.
jest.mock('../../lib/supabase', () => {
  const { createClient } = require('@supabase/supabase-js');
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../../lib/supabaseConfig');
  return {
    supabase: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  };
});

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabaseConfig';
import { MAX_ATHLETES, LeaderboardEntry, getLeaderboard, rankRows, score } from '../leaderboardStorage';

jest.setTimeout(60_000);

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// PostgREST's max-rows ceiling. A read that comes back at or above this may
// have been clipped, which is the whole reason the ranking moved into the DB.
const MAX_ROWS = 1000;

async function view(query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard_entries?${query}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`leaderboard_entries: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

let online = true;
let deployed = true;
let wodId: string | null = null;
let viewRows: any[] = [];
let board: LeaderboardEntry[] = [];

beforeAll(async () => {
  try {
    // Pick the WOD with the most public Rx rows — the one closest to the cap.
    const all = await view(`select=wod_id&limit=${MAX_ROWS * 10}`);
    const counts = new Map<string, number>();
    for (const r of all) counts.set(r.wod_id, (counts.get(r.wod_id) || 0) + 1);
    const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!busiest) {
      console.warn('\n  [leaderboard] no public Rx results yet, skipping live checks\n');
      wodId = null;
      return;
    }
    wodId = busiest[0];
    viewRows = await view(`select=*&wod_id=eq.${encodeURIComponent(wodId)}&limit=${MAX_ROWS * 10}`);

    // Which path is getLeaderboard going to take? Report it either way, because
    // "the SQL was never run" is a silent, correct-looking degradation.
    const { supabase } = jest.requireMock('../../lib/supabase') as any;
    const { error } = await supabase.rpc('get_leaderboard', { p_wod_id: wodId, p_limit: MAX_ATHLETES });
    if (error) {
      deployed = false;
      console.warn(
        `\n  [leaderboard] public.get_leaderboard did not answer (${error.code || ''} ${error.message}) — ` +
          'the app is on the fallback read, which only ranks the top of the board correctly. ' +
          'Run scripts/create-leaderboard-rank-function.sql in the Supabase SQL Editor.\n'
      );
    }

    board = await getLeaderboard(wodId);
  } catch (err: any) {
    online = false;
    console.warn(`\n  [leaderboard] Supabase unreachable, skipping live checks: ${err.message}\n`);
  }
});

/** No-ops (rather than fails) when Supabase is unreachable or has no entries. */
function check(name: string, fn: () => void | Promise<void>) {
  it(name, async () => {
    if (!online || !wodId) return;
    await fn();
  });
}

/** Also no-ops when the ranking function has not been applied yet. */
function checkRpc(name: string, fn: () => void | Promise<void>) {
  check(name, async () => {
    if (!deployed) return;
    await fn();
  });
}

describe('live leaderboard read path', () => {
  check('the view still has the columns the client maps', () => {
    expect(Object.keys(viewRows[0]).sort()).toEqual(
      ['age_division', 'date', 'id', 'reps', 'rounds', 'sex', 'time_seconds', 'username', 'wod_id'].sort()
    );
  });

  check('getLeaderboard returns a board at all (the ordering is accepted)', () => {
    // A rejected order= or a renamed column comes back as an error, which
    // getLeaderboard swallows into [] — so an empty board on a WOD that has
    // rows means the query, not the data, is wrong.
    expect(viewRows.length).toBeGreaterThan(0);
    expect(board.length).toBeGreaterThan(0);
  });

  check('one row per athlete, ranked 1..n, best first', () => {
    const usernames = board.map((e) => e.username);
    expect(new Set(usernames).size).toBe(usernames.length);
    expect(board.map((e) => e.rank)).toEqual(board.map((_, i) => i + 1));

    const scores = board.map(score);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });

  check('identical requests return identical boards', async () => {
    const again = await getLeaderboard(wodId!);
    expect(again.map((e) => e.id)).toEqual(board.map((e) => e.id));
  });

  check('the board matches the ranking computed from every row', () => {
    if (viewRows.length >= MAX_ROWS || board.length >= MAX_ATHLETES) {
      // Our own reference read may have been clipped, or the board is capped, so
      // the tail is legitimately ambiguous — which is the very failure mode the
      // DB function exists to remove.
      console.warn(
        `\n  [leaderboard] ${wodId} has ${viewRows.length}+ rows / a full board; the reference ` +
          'read may be clipped too, so only the board\'s own shape was checked.\n'
      );
      return;
    }

    const expected = rankRows(viewRows);
    const key = (e: { username: string; timeSeconds: number | null; rounds: number | null; reps: number | null }) =>
      `${e.username}|${score(e)}`;
    // Compared as a sorted set of (athlete, score), so a different-but-valid
    // order among athletes tied on score is not a failure.
    expect(board.map(key).sort()).toEqual(expected.map(key).sort());
  });

  check('the sex filter narrows the board', async () => {
    const female = await getLeaderboard(wodId!, { sex: 'F' });
    expect(female.every((e) => e.sex === 'F')).toBe(true);
    expect(female.map((e) => e.rank)).toEqual(female.map((_, i) => i + 1));

    // A subset of the unfiltered board, unless that board is itself capped.
    if (board.length < MAX_ATHLETES) {
      const unfiltered = new Set(board.map((e) => e.username));
      expect(female.every((e) => unfiltered.has(e.username))).toBe(true);
    }
  });

  checkRpc('get_leaderboard dedupes and orders in the database', async () => {
    const { supabase } = jest.requireMock('../../lib/supabase') as any;
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_wod_id: wodId,
      p_limit: MAX_ATHLETES,
    });
    expect(error).toBeNull();

    const usernames = (data as any[]).map((r) => r.username);
    expect(new Set(usernames).size).toBe(usernames.length);

    const scores = (data as any[]).map((r) =>
      score({ timeSeconds: r.time_seconds, rounds: r.rounds, reps: r.reps })
    );
    expect(scores).toEqual([...scores].sort((a, b) => a - b));

    // The function returns the view's row type; the client maps it unchanged.
    expect(Object.keys((data as any[])[0]).sort()).toEqual(Object.keys(viewRows[0]).sort());
  });

  checkRpc('get_leaderboard respects p_limit', async () => {
    const { supabase } = jest.requireMock('../../lib/supabase') as any;
    const { data, error } = await supabase.rpc('get_leaderboard', { p_wod_id: wodId, p_limit: 1 });
    expect(error).toBeNull();
    expect((data as any[]).length).toBeLessThanOrEqual(1);
    if ((data as any[]).length) expect((data as any[])[0].username).toBe(board[0].username);
  });
});

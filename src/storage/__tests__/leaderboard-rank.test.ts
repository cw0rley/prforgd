// Regression tests for the leaderboard's ranking bug: the query used to go out
// with neither ORDER BY nor LIMIT, so once a WOD had more public Rx rows than
// PostgREST's max-rows cap (1000 by default) the client ranked an ARBITRARY
// 1000 of them — the real fastest times could be among the dropped rows, which
// made the board wrong rather than merely short, and the subset could change
// between identical requests.
//
// So these assert two things: ranking comes from the database when
// get_leaderboard is deployed, and the fallback read is ordered best-first and
// explicitly capped, so a clipped response still ranks the top of the board
// correctly.

// --- In-memory Supabase that honours .order()/.limit() like PostgREST does ---
jest.mock('../../lib/supabase', () => {
  const state = {
    // By default the RPC is missing, i.e. the SQL has not been run yet.
    rpcResult: { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } } as any,
    viewRows: [] as any[],
    maxRows: 1000, // PostgREST's server-side ceiling
    lastRpc: null as any,
    lastQuery: null as any,
  };

  function compare(a: any, b: any, orders: [string, any][]): number {
    for (const [col, opts] of orders) {
      const asc = opts?.ascending !== false;
      // Postgres defaults: ASC -> NULLS LAST, DESC -> NULLS FIRST.
      const nullsFirst = opts?.nullsFirst ?? !asc;
      const av = a[col];
      const bv = b[col];
      if (av == null && bv == null) continue;
      if (av == null || bv == null) return (av == null ? 1 : -1) * (nullsFirst ? -1 : 1);
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
    }
    return 0;
  }

  function from(_table: string) {
    const q = { filters: [] as [string, any][], orders: [] as [string, any][], limit: null as number | null };

    function exec() {
      state.lastQuery = q;
      let rows = state.viewRows.filter((r) => q.filters.every(([c, v]) => r[c] === v));
      if (q.orders.length) rows = [...rows].sort((a, b) => compare(a, b, q.orders));
      // No ORDER BY means the server is free to return any subset — model that
      // as the worst case, which is what the old code tripped over.
      else rows = [...rows].reverse();
      rows = rows.slice(0, Math.min(q.limit ?? state.maxRows, state.maxRows));
      return Promise.resolve({ data: rows.map((r) => ({ ...r })), error: null });
    }

    const builder: any = {
      select: () => builder,
      eq: (c: string, v: any) => { q.filters.push([c, v]); return builder; },
      order: (c: string, o: any) => { q.orders.push([c, o]); return builder; },
      limit: (n: number) => { q.limit = n; return builder; },
      then: (res: any, rej: any) => exec().then(res, rej),
    };
    return builder;
  }

  return {
    supabase: {
      from,
      rpc: (name: string, args: any) => {
        state.lastRpc = { name, args };
        return Promise.resolve(state.rpcResult);
      },
    },
    __state: state,
  };
});

import { MAX_ATHLETES, getLeaderboard, rankRows, score } from '../leaderboardStorage';

const { __state: state } = jest.requireMock('../../lib/supabase') as any;

let nextId = 0;
function row(over: Partial<Record<string, any>> = {}) {
  nextId += 1;
  return {
    id: `r${String(nextId).padStart(5, '0')}`,
    username: `athlete${nextId}`,
    sex: 'M',
    age_division: 'Open',
    wod_id: 'murph',
    time_seconds: null,
    rounds: null,
    reps: null,
    date: '2026-01-01T12:00:00.000Z',
    ...over,
  };
}

beforeEach(() => {
  nextId = 0;
  state.viewRows = [];
  state.maxRows = 1000;
  state.rpcResult = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
  state.lastRpc = null;
  state.lastQuery = null;
});

describe('ranking in the database', () => {
  it('asks get_leaderboard for the filtered, capped board', async () => {
    state.rpcResult = { data: [], error: null };

    await getLeaderboard('murph', { sex: 'F', ageDivision: '40-44' });

    expect(state.lastRpc.name).toBe('get_leaderboard');
    expect(state.lastRpc.args).toEqual({
      p_wod_id: 'murph',
      p_sex: 'F',
      p_age_division: '40-44',
      p_limit: MAX_ATHLETES,
    });
    // The RPC answered, so the view must not have been queried as well.
    expect(state.lastQuery).toBeNull();
  });

  it('passes nulls, not undefined, when no filters are set', async () => {
    state.rpcResult = { data: [], error: null };
    await getLeaderboard('murph');
    expect(state.lastRpc.args.p_sex).toBeNull();
    expect(state.lastRpc.args.p_age_division).toBeNull();
  });

  it('keeps the order the database returned, including its tie-breaking', async () => {
    // Already deduped and ordered by get_leaderboard: two athletes tied on
    // score, ordered by date. Re-ranking must not disturb that.
    state.rpcResult = {
      data: [
        row({ username: 'fast', time_seconds: 1800 }),
        row({ username: 'tied-earlier', time_seconds: 2400, date: '2026-01-01T12:00:00.000Z' }),
        row({ username: 'tied-later', time_seconds: 2400, date: '2026-03-01T12:00:00.000Z' }),
      ],
      error: null,
    };

    const board = await getLeaderboard('murph');

    expect(board.map((e) => [e.rank, e.username])).toEqual([
      [1, 'fast'],
      [2, 'tied-earlier'],
      [3, 'tied-later'],
    ]);
  });
});

describe('fallback read of the view', () => {
  it('is used when get_leaderboard is not deployed, ordered best-first and capped', async () => {
    state.viewRows = [row({ username: 'b', time_seconds: 2400 }), row({ username: 'a', time_seconds: 1800 })];

    const board = await getLeaderboard('murph', { sex: 'M' });

    expect(state.lastQuery).not.toBeNull();
    expect(state.lastQuery.filters).toEqual([['wod_id', 'murph'], ['sex', 'M']]);
    expect(state.lastQuery.limit).toBeGreaterThan(0);
    // Timed first ascending, then AMRAP rounds/reps descending, then stable
    // tie-breakers — the ordering that makes a clipped response safe.
    expect(state.lastQuery.orders.map(([c]: [string, any]) => c)).toEqual([
      'time_seconds',
      'rounds',
      'reps',
      'date',
      'id',
    ]);
    const byCol = new Map<string, any>(state.lastQuery.orders);
    expect(byCol.get('time_seconds')).toMatchObject({ ascending: true, nullsFirst: false });
    expect(byCol.get('rounds')).toMatchObject({ ascending: false, nullsFirst: false });
    expect(byCol.get('reps')).toMatchObject({ ascending: false, nullsFirst: false });
    expect(board.map((e) => e.username)).toEqual(['a', 'b']);
  });

  it('returns [] when the view read also fails', async () => {
    const { supabase } = jest.requireMock('../../lib/supabase') as any;
    const realFrom = supabase.from;
    supabase.from = () => ({
      select: () => supabase.from(),
      eq: () => supabase.from(),
      order: () => supabase.from(),
      limit: () => supabase.from(),
      then: (res: any) => Promise.resolve({ data: null, error: { message: 'offline' } }).then(res),
    });
    try {
      await expect(getLeaderboard('murph')).resolves.toEqual([]);
    } finally {
      supabase.from = realFrom;
    }
  });

  it('ranks the true fastest times even when the response is clipped at max-rows', async () => {
    // 1200 rows on one WOD: more than the server will return. The 10 genuinely
    // fastest are appended last, which is exactly where an unordered read used
    // to lose them.
    for (let i = 0; i < 1200; i += 1) {
      state.viewRows.push(row({ username: `slow${i}`, time_seconds: 3000 + i }));
    }
    const fastest: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const username = `elite${i}`;
      fastest.push(username);
      state.viewRows.push(row({ username, time_seconds: 1500 + i }));
    }

    const board = await getLeaderboard('murph');

    expect(board.slice(0, 10).map((e) => e.username)).toEqual(fastest);
    expect(board[0].rank).toBe(1);
    expect(board.map((e) => e.timeSeconds)).toEqual([...board.map((e) => e.timeSeconds)].sort((a, b) => a! - b!));
  });

  it('returns the same rows in the same order for identical requests', async () => {
    for (let i = 0; i < 1200; i += 1) {
      // Everyone tied on score, so only the explicit tie-breakers can settle it.
      state.viewRows.push(row({ username: `athlete${i}`, time_seconds: 2400 }));
    }

    const first = await getLeaderboard('murph');
    const second = await getLeaderboard('murph');

    expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id));
  });
});

describe('dedupe and scoring', () => {
  it('keeps each athlete best result only', () => {
    const board = rankRows([
      row({ username: 'pat', time_seconds: 2400 }),
      row({ username: 'pat', time_seconds: 1900 }),
      row({ username: 'pat', time_seconds: 2100 }),
      row({ username: 'sam', time_seconds: 2000 }),
    ]);

    expect(board.map((e) => [e.rank, e.username, e.timeSeconds])).toEqual([
      [1, 'pat', 1900],
      [2, 'sam', 2000],
    ]);
  });

  it('ranks AMRAPs by most rounds then most reps', () => {
    const board = rankRows([
      row({ username: 'c', rounds: 12, reps: 4 }),
      row({ username: 'a', rounds: 20, reps: 0 }),
      row({ username: 'b', rounds: 12, reps: 9 }),
    ]);

    expect(board.map((e) => e.username)).toEqual(['a', 'b', 'c']);
  });

  it('scores a missing rounds/reps as zero rather than NaN', () => {
    // -0 because the AMRAP branch negates; it still sorts as zero.
    expect(score({ timeSeconds: null, rounds: null, reps: null })).toBe(-0);
    expect(score({ timeSeconds: null, rounds: 3, reps: null })).toBe(-3000);
    expect(score({ timeSeconds: 1800, rounds: null, reps: null })).toBe(1800);
  });
});

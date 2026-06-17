// Regression test for the workout data-loss bug: a workout saved *during* a
// sync's network round-trip used to be overwritten by the reconciler's stale
// merged write and never reach the cloud. These tests reproduce that exact race
// and assert the just-saved workout survives both locally and in the cloud.

// --- In-memory AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => (k in store ? store[k] : null),
      setItem: async (k: string, v: string) => { store[k] = v; },
      removeItem: async (k: string) => { delete store[k]; },
      __reset: () => { store = {}; },
    },
  };
});

// --- In-memory Supabase with a controllable select delay (the "network window") ---
jest.mock('../supabase', () => {
  type Row = Record<string, any>;
  const cloud: Record<string, Row[]> = { workout_results: [], favorites: [], user_equipment: [] };
  let session: any = { user: { id: 'user-1' } };
  let selectDelayMs = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function from(table: string) {
    const state: any = { op: 'select', filters: [] as [string, any][], inFilter: null as any, single: false, rows: null, patch: null, onConflict: null };
    const matches = (row: Row) =>
      state.filters.every(([c, v]: [string, any]) => row[c] === v) &&
      (!state.inFilter || state.inFilter.vals.includes(row[state.inFilter.col]));

    async function exec() {
      if (state.op === 'select' && selectDelayMs) await sleep(selectDelayMs);
      const rows = cloud[table];
      if (state.op === 'select') {
        const data = rows.filter(matches).map((r) => ({ ...r }));
        return state.single ? { data: data[0] ?? null, error: null } : { data, error: null };
      }
      if (state.op === 'upsert') {
        const keys = String(state.onConflict || 'id').split(',');
        for (const r of state.rows) {
          const i = rows.findIndex((x) => keys.every((k) => x[k] === r[k]));
          if (i >= 0) rows[i] = { ...rows[i], ...r };
          else rows.push({ ...r });
        }
        return { error: null };
      }
      if (state.op === 'update') {
        for (const r of rows) if (matches(r)) Object.assign(r, state.patch);
        return { error: null };
      }
      if (state.op === 'delete') {
        cloud[table] = rows.filter((r) => !matches(r));
        return { error: null };
      }
      return { data: null, error: null };
    }

    const builder: any = {
      select() { state.op = 'select'; return builder; },
      upsert(r: Row[], opts: any) { state.op = 'upsert'; state.rows = r; state.onConflict = opts?.onConflict; return builder; },
      update(patch: Row) { state.op = 'update'; state.patch = patch; return builder; },
      delete() { state.op = 'delete'; return builder; },
      eq(c: string, v: any) { state.filters.push([c, v]); return builder; },
      in(c: string, vals: any[]) { state.inFilter = { col: c, vals }; return builder; },
      maybeSingle() { state.single = true; return exec(); },
      then(res: any, rej: any) { return exec().then(res, rej); },
    };
    return builder;
  }

  return {
    __esModule: true,
    supabase: {
      from,
      auth: { getSession: async () => ({ data: { session } }) },
      __cloud: cloud,
      __setSession: (s: any) => { session = s; },
      __setSelectDelay: (ms: number) => { selectDelayMs = ms; },
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { writeJSONFor, KEYS } from '../localStore';
import { syncNow } from '../sync';
import { getResults, saveResult } from '../../storage/workoutStorage';
import type { WorkoutResult } from '../../storage/workoutStorage';

const sb = supabase as any;
const USER = 'user-1';

function workout(id: string, wodId = 'the-don'): WorkoutResult {
  return {
    id, wodId, date: '2026-06-16T16:00:00.000Z', timeSeconds: 1200,
    notes: '', completed: true, rx: true, isPR: false,
  };
}

beforeEach(async () => {
  (AsyncStorage as any).__reset();
  sb.__cloud.workout_results.length = 0;
  sb.__cloud.favorites.length = 0;
  sb.__cloud.user_equipment.length = 0;
  sb.__setSession({ user: { id: USER } });
  sb.__setSelectDelay(0);
});

test('a workout saved DURING an in-flight sync is not lost (local + cloud)', async () => {
  // Pre-existing workout A, already synced on both sides.
  const A = { ...workout('11111111-1111-4111-a111-111111111111', 'fran'), updatedAt: '2026-06-15T10:00:00.000Z' };
  await writeJSONFor(KEYS.results, USER, [A]);
  sb.__cloud.workout_results.push({
    id: A.id, user_id: USER, wod_id: A.wodId, date: A.date, time_seconds: A.timeSeconds,
    rounds: null, reps: null, round_times: null, notes: '', completed: true, rx: true, is_pr: false,
    updated_at: A.updatedAt,
  });

  // Open a network window so the save lands mid-sync.
  sb.__setSelectDelay(100);
  const syncPromise = syncNow();

  // Log "The Don" while the reconciler is still fetching from the cloud.
  const DON = workout('22222222-2222-4222-a222-222222222222', 'the-don');
  await saveResult(DON);

  await syncPromise;

  // It must survive locally...
  const local = await getResults();
  expect(local.map((r) => r.id)).toContain(DON.id);
  // ...and have reached the cloud.
  expect(sb.__cloud.workout_results.map((r: any) => r.id)).toContain(DON.id);
});

test('saveResult uploads immediately, before any reconcile runs', async () => {
  const DON = workout('33333333-3333-4333-a333-333333333333', 'the-don');
  await saveResult(DON);
  // pushResultNow fires synchronously inside saveResult; let microtasks flush.
  await new Promise((r) => setTimeout(r, 0));
  expect(sb.__cloud.workout_results.map((r: any) => r.id)).toContain(DON.id);
});

test('concurrent saves do not clobber each other', async () => {
  sb.__setSelectDelay(50);
  const sync = syncNow();
  const a = saveResult(workout('44444444-4444-4444-a444-444444444444', 'grace'));
  const b = saveResult(workout('55555555-5555-4555-a555-555555555555', 'isabel'));
  await Promise.all([a, b, sync]);
  const ids = (await getResults()).map((r) => r.id);
  expect(ids).toContain('44444444-4444-4444-a444-444444444444');
  expect(ids).toContain('55555555-5555-4555-a555-555555555555');
});

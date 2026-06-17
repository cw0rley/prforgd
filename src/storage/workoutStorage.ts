import {
  KEYS,
  readJSON,
  writeJSON,
  markDirty,
  withLock,
} from '../lib/localStore';

export interface RoundTime {
  round: number;
  splitSeconds: number; // time for this round only
  cumulativeSeconds: number; // total elapsed at end of this round
}

export interface WorkoutResult {
  id: string;
  wodId: string;
  date: string; // ISO string
  timeSeconds?: number; // total time for "for time" and "rounds-for-time" WODs
  rounds?: number; // for AMRAPs
  reps?: number; // for AMRAPs (extra reps beyond full rounds)
  roundTimes?: RoundTime[]; // per-round split times
  wodName?: string; // for custom WODs
  wodDescription?: string; // for custom WODs (to replay)
  notes: string;
  completed: boolean; // finished the full workout?
  rx: boolean; // did it at prescribed weights/movements?
  isPR: boolean;
  favorite?: boolean;
  updatedAt?: string; // ISO; drives last-write-wins during sync
}

// Fire-and-forget cloud sync after a local mutation (no-op when logged out).
function triggerSync(): void {
  try {
    const { requestSync } = require('../lib/sync');
    requestSync();
  } catch {
    // sync module unavailable — local write already succeeded
  }
}

// Fire-and-forget immediate cloud upload of a single saved result (no-op when
// logged out). Belt-and-suspenders so a just-logged workout is safe in the
// cloud instantly, not only after the debounced reconciler runs.
function pushNow(result: WorkoutResult): void {
  try {
    const { pushResultNow } = require('../lib/sync');
    void pushResultNow(result);
  } catch {
    // sync module unavailable — local write already succeeded
  }
}

export async function getDeletedIds(): Promise<string[]> {
  return readJSON<string[]>(KEYS.resultsDeleted, []);
}

async function addDeletedId(id: string): Promise<void> {
  const ids = await getDeletedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await writeJSON(KEYS.resultsDeleted, ids);
  }
}

export async function getResults(): Promise<WorkoutResult[]> {
  return readJSON<WorkoutResult[]>(KEYS.results, []);
}

export async function saveResult(result: WorkoutResult): Promise<void> {
  // Locked read-modify-write so a concurrent sync can't overwrite this save
  // (and vice-versa). Guard against a double-save of the same id too.
  let stamped: WorkoutResult | null = null;
  await withLock(KEYS.results, async () => {
    const results = await getResults();
    if (results.some((r) => r.id === result.id)) return;
    stamped = { ...result, updatedAt: new Date().toISOString() };
    results.push(stamped);
    await writeJSON(KEYS.results, results);
    await markDirty();
  });
  if (stamped) pushNow(stamped); // immediate cloud upload (safety net)
  triggerSync();
}

export async function getResultsForWod(wodId: string): Promise<WorkoutResult[]> {
  const results = await getResults();
  return results
    .filter((r) => r.wodId === wodId)
    .sort((a, b) => workoutDateMs(b.date) - workoutDateMs(a.date));
}

export async function getPRForWod(wodId: string): Promise<WorkoutResult | null> {
  const results = await getResultsForWod(wodId);
  const rxResults = results.filter((r) => r.rx);

  if (rxResults.length === 0) return null;

  // For "for time" WODs, PR is the fastest time
  const timedResults = rxResults.filter((r) => r.timeSeconds !== undefined);
  if (timedResults.length > 0) {
    return timedResults.reduce((best, r) =>
      r.timeSeconds! < best.timeSeconds! ? r : best
    );
  }

  // For AMRAPs, PR is the most rounds+reps
  const amrapResults = rxResults.filter((r) => r.rounds !== undefined);
  if (amrapResults.length > 0) {
    return amrapResults.reduce((best, r) => {
      const rScore = (r.rounds || 0) * 1000 + (r.reps || 0);
      const bScore = (best.rounds || 0) * 1000 + (best.reps || 0);
      return rScore > bScore ? r : best;
    });
  }

  return null;
}

export async function toggleFavorite(resultId: string): Promise<boolean> {
  const results = await getResults();
  const result = results.find((r) => r.id === resultId);
  if (!result) return false;
  result.favorite = !result.favorite;
  await writeJSON(KEYS.results, results);
  return result.favorite; // result-level flag is local-only (no cloud column)
}

export async function deleteResult(resultId: string): Promise<void> {
  await withLock(KEYS.results, async () => {
    const results = await getResults();
    const filtered = results.filter((r) => r.id !== resultId);
    await writeJSON(KEYS.results, filtered);

    // Record a tombstone so a later sync won't bring it back, then reconcile
    // (which soft-deletes it in the cloud). If offline, the tombstone persists
    // and the next sync retries the cloud delete.
    await addDeletedId(resultId);
    await markDirty();
  });
  triggerSync();
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Tolerant date parsing. The phone's JS engine (Hermes) is stricter than a
// browser and rejects some legacy date strings (e.g. Postgres-style
// "2024-01-15 10:00:00+00" with a space) as Invalid Date. Normalize the common
// cases so old records don't render as "Invalid Date" or break sorting.
export function parseWorkoutDate(s?: string | null): Date | null {
  if (!s) return null;
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Replace the date/time separating space with 'T' (Postgres timestamp format).
  d = new Date(String(s).replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;
  return null;
}

// Display helper: a localized date string, or an em dash when unparseable.
export function formatWorkoutDate(s?: string | null): string {
  const d = parseWorkoutDate(s);
  return d ? d.toLocaleDateString() : '—';
}

// Sort key: ms since epoch, or 0 for unparseable dates so they sort oldest
// (to the bottom) rather than NaN-floating to the top.
export function workoutDateMs(s?: string | null): number {
  const d = parseWorkoutDate(s);
  return d ? d.getTime() : 0;
}

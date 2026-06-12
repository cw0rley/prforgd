import {
  KEYS,
  readJSON,
  writeJSON,
  markDirty,
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
  const results = await getResults();
  results.push({ ...result, updatedAt: new Date().toISOString() });
  await writeJSON(KEYS.results, results);
  await markDirty();
  triggerSync();
}

export async function getResultsForWod(wodId: string): Promise<WorkoutResult[]> {
  const results = await getResults();
  return results
    .filter((r) => r.wodId === wodId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  const results = await getResults();
  const filtered = results.filter((r) => r.id !== resultId);
  await writeJSON(KEYS.results, filtered);

  // Record a tombstone so a later sync won't bring it back, then reconcile
  // (which soft-deletes it in the cloud). If offline, the tombstone persists
  // and the next sync retries the cloud delete.
  await addDeletedId(resultId);
  await markDirty();
  triggerSync();
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

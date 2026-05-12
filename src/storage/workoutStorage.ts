import AsyncStorage from '@react-native-async-storage/async-storage';

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
  notes: string;
  completed: boolean; // finished the full workout?
  rx: boolean; // did it at prescribed weights/movements?
  isPR: boolean;
}

const RESULTS_KEY = 'workout_results';

export async function getResults(): Promise<WorkoutResult[]> {
  const data = await AsyncStorage.getItem(RESULTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveResult(result: WorkoutResult): Promise<void> {
  const results = await getResults();
  results.push(result);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(results));
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

export async function deleteResult(resultId: string): Promise<void> {
  const results = await getResults();
  const filtered = results.filter((r) => r.id !== resultId);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(filtered));
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

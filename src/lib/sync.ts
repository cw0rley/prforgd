import { supabase } from './supabase';
import { WorkoutResult } from '../storage/workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Workout Results ---
export async function syncResultsToCloud(userId: string) {
  const localData = await AsyncStorage.getItem('workout_results');
  const localResults: WorkoutResult[] = localData ? JSON.parse(localData) : [];
  if (localResults.length === 0) return;

  const rows = localResults.map((r) => ({
    user_id: userId,
    wod_id: r.wodId,
    wod_name: r.wodName || null,
    wod_description: r.wodDescription || null,
    date: r.date,
    time_seconds: r.timeSeconds || null,
    rounds: r.rounds || null,
    reps: r.reps || null,
    round_times: r.roundTimes || null,
    notes: r.notes,
    completed: r.completed !== false,
    rx: r.rx,
    is_pr: r.isPR,
  }));

  const { error } = await supabase.from('workout_results').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Sync results error:', error);
}

export async function fetchResultsFromCloud(userId: string): Promise<WorkoutResult[]> {
  const { data, error } = await supabase
    .from('workout_results')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Fetch results error:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    wodId: r.wod_id,
    wodName: r.wod_name,
    wodDescription: r.wod_description,
    date: r.date,
    timeSeconds: r.time_seconds,
    rounds: r.rounds,
    reps: r.reps,
    roundTimes: r.round_times,
    notes: r.notes || '',
    completed: r.completed,
    rx: r.rx,
    isPR: r.is_pr,
  }));
}

export async function saveResultToCloud(userId: string, result: WorkoutResult) {
  const { error } = await supabase.from('workout_results').insert({
    user_id: userId,
    wod_id: result.wodId,
    wod_name: result.wodName || null,
    wod_description: result.wodDescription || null,
    date: result.date,
    time_seconds: result.timeSeconds || null,
    rounds: result.rounds || null,
    reps: result.reps || null,
    round_times: result.roundTimes || null,
    notes: result.notes,
    completed: result.completed !== false,
    rx: result.rx,
    is_pr: result.isPR,
  });
  if (error) console.error('Save result to cloud error:', error);
}

export async function deleteResultFromCloud(resultId: string) {
  const { error } = await supabase.from('workout_results').delete().eq('id', resultId);
  if (error) console.error('Delete result from cloud error:', error);
}

// --- Favorites ---
export async function syncFavoritesToCloud(userId: string) {
  const localData = await AsyncStorage.getItem('favorite_wods');
  const localFavs: string[] = localData ? JSON.parse(localData) : [];
  if (localFavs.length === 0) return;

  const rows = localFavs.map((wodId) => ({ user_id: userId, wod_id: wodId }));
  const { error } = await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,wod_id' });
  if (error) console.error('Sync favorites error:', error);
}

export async function fetchFavoritesFromCloud(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('wod_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Fetch favorites error:', error);
    return [];
  }

  return (data || []).map((r: any) => r.wod_id);
}

export async function toggleFavoriteCloud(userId: string, wodId: string, isFav: boolean) {
  if (isFav) {
    await supabase.from('favorites').insert({ user_id: userId, wod_id: wodId });
  } else {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('wod_id', wodId);
  }
}

// --- Equipment ---
export async function syncEquipmentToCloud(userId: string) {
  const localData = await AsyncStorage.getItem('user_equipment');
  const equipment: string[] = localData ? JSON.parse(localData) : [];

  const { error } = await supabase.from('user_equipment').upsert(
    { user_id: userId, equipment, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) console.error('Sync equipment error:', error);
}

export async function fetchEquipmentFromCloud(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_equipment')
    .select('equipment')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Fetch equipment error:', error);
    return [];
  }

  return data?.equipment || [];
}

// --- Full sync ---
export async function fullSyncToCloud(userId: string) {
  await Promise.all([
    syncResultsToCloud(userId),
    syncFavoritesToCloud(userId),
    syncEquipmentToCloud(userId),
  ]);
}

export async function fullSyncFromCloud(userId: string) {
  const [results, favs, equipment] = await Promise.all([
    fetchResultsFromCloud(userId),
    fetchFavoritesFromCloud(userId),
    fetchEquipmentFromCloud(userId),
  ]);

  await AsyncStorage.setItem('workout_results', JSON.stringify(results));
  await AsyncStorage.setItem('favorite_wods', JSON.stringify(favs));
  await AsyncStorage.setItem('user_equipment', JSON.stringify(equipment));
}

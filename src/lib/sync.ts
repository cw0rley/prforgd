import { supabase } from './supabase';
import { WorkoutResult } from '../storage/workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUUID(id: string): string {
  if (UUID_REGEX.test(id)) return id;
  // Convert non-UUID ids (e.g. Date.now() timestamps) to a deterministic UUID
  const hex = id.padStart(32, '0').slice(-32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

// --- Workout Results ---
export async function syncResultsToCloud(userId: string) {
  const localData = await AsyncStorage.getItem('workout_results');
  const localResults: WorkoutResult[] = localData ? JSON.parse(localData) : [];
  if (localResults.length === 0) return;

  const rows = localResults.map((r) => ({
    id: r.id,
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
  const { error } = await supabase.from('workout_results').upsert({
    id: result.id,
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

// --- Full sync (merge by unique id, no data loss) ---
export interface SyncStats {
  uploaded: number;
  downloaded: number;
  totalWorkouts: number;
  totalFavorites: number;
  error?: string;
}

export async function fullSync(userId: string): Promise<SyncStats> {
  const stats: SyncStats = { uploaded: 0, downloaded: 0, totalWorkouts: 0, totalFavorites: 0 };

  try {
    // --- Workout results: true merge by id ---
    const localResultsData = await AsyncStorage.getItem('workout_results');
    let localResults: WorkoutResult[] = localResultsData ? JSON.parse(localResultsData) : [];
    const cloudResults = await fetchResultsFromCloud(userId);

    // Fix any non-UUID ids before merging
    let idsFixed = false;
    localResults = localResults.map((r) => {
      const fixedId = ensureUUID(r.id);
      if (fixedId !== r.id) { idsFixed = true; return { ...r, id: fixedId }; }
      return r;
    });
    if (idsFixed) {
      await AsyncStorage.setItem('workout_results', JSON.stringify(localResults));
    }

    // Tombstones: ids deleted locally. Remove them from the cloud (retry in case
    // the delete happened offline) and never merge them back into local storage.
    const deletedData = await AsyncStorage.getItem('workout_results_deleted');
    const deletedIds: string[] = deletedData ? JSON.parse(deletedData) : [];
    const deletedSet = new Set(deletedIds);
    for (const id of deletedIds) {
      if (cloudResults.some((r) => r.id === id)) {
        await supabase.from('workout_results').delete().eq('id', id);
      }
    }

    // Build merged map keyed by id — local-only results get uploaded, cloud-only stay.
    // Skip tombstoned ids so deleted results are not resurrected.
    const mergedMap = new Map<string, WorkoutResult>();
    for (const r of cloudResults) if (!deletedSet.has(r.id)) mergedMap.set(r.id, r);
    for (const r of localResults) if (!deletedSet.has(r.id)) mergedMap.set(r.id, r); // local wins on conflict

    // Upload any results not in cloud
    const cloudIds = new Set(cloudResults.map((r) => r.id));
    const localOnly = localResults.filter((r) => !cloudIds.has(r.id));
    const uploadErrors: string[] = [];
    for (const r of localOnly) {
      const { error } = await supabase.from('workout_results').upsert({
        id: r.id,
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
      });
      if (error) uploadErrors.push(error.message);
      else stats.uploaded++;
    }
    if (uploadErrors.length > 0) {
      stats.error = `Upload failed (${uploadErrors.length}): ${uploadErrors[0]}`;
    }

    // Download = cloud results not in local (excluding tombstoned/deleted ids)
    const localIds = new Set(localResults.map((r) => r.id));
    stats.downloaded = cloudResults.filter((r) => !localIds.has(r.id) && !deletedSet.has(r.id)).length;

    // Save merged set locally
    const merged = Array.from(mergedMap.values());
    await AsyncStorage.setItem('workout_results', JSON.stringify(merged));
    stats.totalWorkouts = merged.length;

    // --- Merge favorites (union of both) ---
    const localFavsData = await AsyncStorage.getItem('favorite_wods');
    const localFavs: string[] = localFavsData ? JSON.parse(localFavsData) : [];
    const cloudFavs = await fetchFavoritesFromCloud(userId);

    const mergedFavs = Array.from(new Set([...localFavs, ...cloudFavs]));
    await AsyncStorage.setItem('favorite_wods', JSON.stringify(mergedFavs));
    stats.totalFavorites = mergedFavs.length;

    // Upload any local favs not in cloud
    const cloudFavSet = new Set(cloudFavs);
    for (const wodId of localFavs) {
      if (!cloudFavSet.has(wodId)) {
        await toggleFavoriteCloud(userId, wodId, true);
      }
    }

    // --- Equipment: merge (upload local, then pull cloud as source of truth) ---
    const localEquipData = await AsyncStorage.getItem('user_equipment');
    const localEquipment: string[] = localEquipData ? JSON.parse(localEquipData) : [];

    if (localEquipment.length > 0) {
      await syncEquipmentToCloud(userId);
    }

    const cloudEquipment = await fetchEquipmentFromCloud(userId);
    if (cloudEquipment.length > 0) {
      const mergedEquip = Array.from(new Set([...localEquipment, ...cloudEquipment]));
      await AsyncStorage.setItem('user_equipment', JSON.stringify(mergedEquip));
    }
  } catch (err: any) {
    stats.error = err.message || 'Sync failed';
  }

  return stats;
}

import { supabase } from './supabase';
import { WorkoutResult } from '../storage/workoutStorage';
import {
  KEYS,
  ANON_NS,
  getUserId,
  readJSONFor,
  writeJSONFor,
  markDirty,
  clearDirty,
  setLastSynced,
} from './localStore';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUUID(id: string): string {
  if (UUID_REGEX.test(id)) return id;
  // Convert non-UUID ids (e.g. Date.now() timestamps) to a deterministic UUID
  const hex = id.padStart(32, '0').slice(-32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// Effective last-modified time for a local record (legacy rows lack updatedAt).
function localUpdatedAt(r: WorkoutResult): string {
  return r.updatedAt || r.date || '1970-01-01T00:00:00.000Z';
}

function toRow(r: WorkoutResult, userId: string) {
  return {
    id: ensureUUID(r.id),
    user_id: userId,
    wod_id: r.wodId,
    wod_name: r.wodName || null,
    wod_description: r.wodDescription || null,
    date: r.date,
    time_seconds: r.timeSeconds ?? null,
    rounds: r.rounds ?? null,
    reps: r.reps ?? null,
    round_times: r.roundTimes || null,
    notes: r.notes,
    completed: r.completed !== false,
    rx: r.rx,
    is_pr: r.isPR,
    updated_at: localUpdatedAt(r),
  };
}

function fromRow(row: any): WorkoutResult {
  return {
    id: row.id,
    wodId: row.wod_id,
    wodName: row.wod_name ?? undefined,
    wodDescription: row.wod_description ?? undefined,
    date: row.date,
    timeSeconds: row.time_seconds ?? undefined,
    rounds: row.rounds ?? undefined,
    reps: row.reps ?? undefined,
    roundTimes: row.round_times ?? undefined,
    notes: row.notes || '',
    completed: row.completed,
    rx: row.rx,
    isPR: row.is_pr,
    updatedAt: row.updated_at ?? undefined,
  };
}

export interface SyncStats {
  uploaded: number;
  downloaded: number;
  totalWorkouts: number;
  totalFavorites: number;
  skipped?: boolean; // not logged in
  error?: string;
}

// Screens subscribe to this to re-read local storage after a sync changes it
// (e.g. data pulled from another device). Without it, a background sync updates
// storage but the visible list keeps showing stale data until you navigate.
type Listener = () => void;
const syncListeners = new Set<Listener>();
export function onSynced(cb: Listener): () => void {
  syncListeners.add(cb);
  return () => { syncListeners.delete(cb); };
}
function notifySynced(): void {
  for (const cb of syncListeners) {
    try { cb(); } catch { /* a bad listener shouldn't break sync */ }
  }
}

// --- single-flight + debounce -------------------------------------------------
let inFlight: Promise<SyncStats> | null = null;
let rerunRequested = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Fire-and-forget, debounced sync. Mutations call this; it coalesces bursts of
// changes into one network round-trip and never throws into the caller.
export function requestSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, 1200);
}

// The single reconciler. Push local changes, pull cloud changes, merge with
// last-write-wins. Used by every trigger (login, foreground, mutations, the
// manual button). Safe to call concurrently — runs are serialized and a
// request made while one is running schedules exactly one re-run.
export function syncNow(): Promise<SyncStats> {
  if (inFlight) {
    rerunRequested = true;
    return inFlight;
  }
  inFlight = doSync().finally(() => {
    inFlight = null;
    if (rerunRequested) {
      rerunRequested = false;
      void syncNow();
    }
  });
  return inFlight;
}

async function doSync(): Promise<SyncStats> {
  const stats: SyncStats = { uploaded: 0, downloaded: 0, totalWorkouts: 0, totalFavorites: 0 };
  const userId = await getUserId();
  if (!userId) {
    stats.skipped = true;
    return stats; // logged out: local-only, nothing to reconcile
  }
  const ns = userId;

  try {
    await reconcileResults(userId, ns, stats);
    await reconcileFavorites(userId, ns, stats);
    await reconcileEquipment(userId, ns);

    await clearDirty(ns);
    await setLastSynced(ns, new Date().toISOString());
    notifySynced(); // let any open screens re-read the freshly merged data
  } catch (err: any) {
    // Leave the dirty flag set so the next trigger retries.
    stats.error = err?.message || 'Sync failed';
  }

  return stats;
}

// --- workout results: LWW merge + tombstones ---------------------------------
async function reconcileResults(userId: string, ns: string, stats: SyncStats): Promise<void> {
  let local = await readJSONFor<WorkoutResult[]>(KEYS.results, ns, []);

  // Normalize any legacy non-UUID ids (the merged set written below persists them).
  local = local.map((r) => {
    const fixed = ensureUUID(r.id);
    return fixed !== r.id ? { ...r, id: fixed } : r;
  });

  const localTombstones = await readJSONFor<string[]>(KEYS.resultsDeleted, ns, []);

  // Fetch the user's cloud rows (including soft-deleted ones).
  const { data: cloudRows, error: fetchErr } = await supabase
    .from('workout_results')
    .select('*')
    .eq('user_id', userId);
  if (fetchErr) throw new Error(fetchErr.message);

  const serverDeletedIds = (cloudRows || []).filter((r: any) => r.deleted_at).map((r: any) => r.id);
  const deletedSet = new Set<string>([...localTombstones, ...serverDeletedIds]);

  // Push any local tombstones the server hasn't recorded yet.
  for (const id of localTombstones) {
    if (!serverDeletedIds.includes(id)) {
      const { error } = await supabase
        .from('workout_results')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    }
  }

  const cloudLive = new Map<string, WorkoutResult>();
  for (const row of cloudRows || []) {
    if (row.deleted_at) continue;
    if (deletedSet.has(row.id)) continue;
    cloudLive.set(row.id, fromRow(row));
  }
  const localLive = new Map<string, WorkoutResult>();
  for (const r of local) {
    if (deletedSet.has(r.id)) continue;
    localLive.set(r.id, r);
  }

  const merged = new Map<string, WorkoutResult>();
  const toPush: WorkoutResult[] = [];

  const allIds = new Set<string>([...cloudLive.keys(), ...localLive.keys()]);
  for (const id of allIds) {
    const l = localLive.get(id);
    const c = cloudLive.get(id);
    if (l && !c) {
      merged.set(id, l);
      toPush.push(l); // cloud is missing this row
    } else if (c && !l) {
      merged.set(id, c); // download only
      stats.downloaded++;
    } else if (l && c) {
      // Last-write-wins by updatedAt.
      if (localUpdatedAt(l) > localUpdatedAt(c)) {
        merged.set(id, l);
        toPush.push(l);
      } else {
        merged.set(id, c);
      }
    }
  }

  // Push winners that originated/updated locally.
  if (toPush.length > 0) {
    const { error } = await supabase
      .from('workout_results')
      .upsert(toPush.map((r) => toRow(r, userId)), { onConflict: 'user_id,id' });
    if (error) throw new Error(error.message);
    stats.uploaded += toPush.length;
  }

  // Re-read tombstones right before writing: a delete that landed *during*
  // this sync (after we snapshotted the cloud) must not be resurrected by our
  // now-stale merged set. The delete also scheduled a rerun that will push its
  // soft-delete to the cloud.
  const freshTombs = await readJSONFor<string[]>(KEYS.resultsDeleted, ns, []);
  for (const id of freshTombs) deletedSet.add(id);
  const mergedArr = Array.from(merged.values()).filter((r) => !deletedSet.has(r.id));
  await writeJSONFor(KEYS.results, ns, mergedArr);
  stats.totalWorkouts = mergedArr.length;

  // Remember the union of deletions so this device won't resurrect them.
  await writeJSONFor(KEYS.resultsDeleted, ns, Array.from(deletedSet));
}

// --- favorites: union minus tombstones ---------------------------------------
async function reconcileFavorites(userId: string, ns: string, stats: SyncStats): Promise<void> {
  const localFavs = await readJSONFor<string[]>(KEYS.favorites, ns, []);
  const favTombstones = await readJSONFor<string[]>(KEYS.favoritesDeleted, ns, []);
  const tombSet = new Set(favTombstones);

  const { data: cloudRows, error } = await supabase
    .from('favorites')
    .select('wod_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  const cloudFavs: string[] = (cloudRows || []).map((r: any) => r.wod_id);

  const merged = Array.from(new Set([...localFavs, ...cloudFavs])).filter((id) => !tombSet.has(id));
  const mergedSet = new Set(merged);
  const cloudSet = new Set(cloudFavs);

  // Insert merged favorites missing from the cloud.
  const toInsert = merged.filter((id) => !cloudSet.has(id));
  if (toInsert.length > 0) {
    const { error: insErr } = await supabase
      .from('favorites')
      .upsert(toInsert.map((wod_id) => ({ user_id: userId, wod_id })), { onConflict: 'user_id,wod_id' });
    if (insErr) throw new Error(insErr.message);
  }

  // Remove tombstoned favorites still present in the cloud.
  const toDelete = cloudFavs.filter((id) => tombSet.has(id));
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .in('wod_id', toDelete);
    if (delErr) throw new Error(delErr.message);
  }

  await writeJSONFor(KEYS.favorites, ns, Array.from(mergedSet));
  stats.totalFavorites = mergedSet.size;
}

// --- equipment: single row, last-write-wins by updated_at --------------------
async function reconcileEquipment(userId: string, ns: string): Promise<void> {
  const localEquip = await readJSONFor<string[]>(KEYS.equipment, ns, []);
  const localUpdated = await readJSONFor<string | null>(KEYS.equipmentUpdatedAt, ns, null);

  const { data: cloudRow, error } = await supabase
    .from('user_equipment')
    .select('equipment, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const cloudEquip: string[] = cloudRow?.equipment || [];
  const cloudUpdated: string | null = cloudRow?.updated_at || null;

  const localTs = localUpdated || '1970-01-01T00:00:00.000Z';
  const cloudTs = cloudUpdated || '1970-01-01T00:00:00.000Z';

  if (cloudRow == null || localTs > cloudTs) {
    // No cloud row yet, or local is newer — push local up.
    const ts = localUpdated || new Date().toISOString();
    const { error: upErr } = await supabase
      .from('user_equipment')
      .upsert({ user_id: userId, equipment: localEquip, updated_at: ts }, { onConflict: 'user_id' });
    if (upErr) throw new Error(upErr.message);
    await writeJSONFor(KEYS.equipmentUpdatedAt, ns, ts);
  } else {
    // Cloud is newer (or tied) — adopt it locally.
    await writeJSONFor(KEYS.equipment, ns, cloudEquip);
    await writeJSONFor(KEYS.equipmentUpdatedAt, ns, cloudTs);
  }
}

// --- login: merge anonymous (logged-out) data into the user's bucket ---------
export async function mergeAnonIntoUser(userId: string): Promise<void> {
  // Workouts: union by id (anon entries the user logged before signing in).
  const anonResults = await readJSONFor<WorkoutResult[]>(KEYS.results, ANON_NS, []);
  if (anonResults.length > 0) {
    const userResults = await readJSONFor<WorkoutResult[]>(KEYS.results, userId, []);
    const byId = new Map<string, WorkoutResult>();
    for (const r of userResults) byId.set(r.id, r);
    for (const r of anonResults) if (!byId.has(r.id)) byId.set(r.id, r);
    await writeJSONFor(KEYS.results, userId, Array.from(byId.values()));
  }

  // Workout deletions made while logged out: carry the tombstones over so the
  // next sync soft-deletes those rows in the account too.
  const anonResultTombs = await readJSONFor<string[]>(KEYS.resultsDeleted, ANON_NS, []);
  if (anonResultTombs.length > 0) {
    const userResultTombs = await readJSONFor<string[]>(KEYS.resultsDeleted, userId, []);
    await writeJSONFor(
      KEYS.resultsDeleted,
      userId,
      Array.from(new Set([...userResultTombs, ...anonResultTombs]))
    );
  }

  // Favorites: union.
  const anonFavs = await readJSONFor<string[]>(KEYS.favorites, ANON_NS, []);
  if (anonFavs.length > 0) {
    const userFavs = await readJSONFor<string[]>(KEYS.favorites, userId, []);
    await writeJSONFor(KEYS.favorites, userId, Array.from(new Set([...userFavs, ...anonFavs])));
  }

  // Favorite un-favorites made while logged out: carry tombstones over too.
  const anonFavTombs = await readJSONFor<string[]>(KEYS.favoritesDeleted, ANON_NS, []);
  if (anonFavTombs.length > 0) {
    const userFavTombs = await readJSONFor<string[]>(KEYS.favoritesDeleted, userId, []);
    await writeJSONFor(
      KEYS.favoritesDeleted,
      userId,
      Array.from(new Set([...userFavTombs, ...anonFavTombs]))
    );
  }

  // Equipment: only adopt anon equipment if the user has none yet.
  const anonEquip = await readJSONFor<string[]>(KEYS.equipment, ANON_NS, []);
  const userEquip = await readJSONFor<string[]>(KEYS.equipment, userId, []);
  if (anonEquip.length > 0 && userEquip.length === 0) {
    await writeJSONFor(KEYS.equipment, userId, anonEquip);
    await writeJSONFor(KEYS.equipmentUpdatedAt, userId, new Date().toISOString());
  }

  // Clear the anon bucket (data + tombstones) so it can't leak into another
  // account later.
  await writeJSONFor(KEYS.results, ANON_NS, []);
  await writeJSONFor(KEYS.resultsDeleted, ANON_NS, []);
  await writeJSONFor(KEYS.favorites, ANON_NS, []);
  await writeJSONFor(KEYS.favoritesDeleted, ANON_NS, []);
  await writeJSONFor(KEYS.equipment, ANON_NS, []);

  await markDirty();
}

// --- realtime: live cross-device updates -------------------------------------
// Requires the table to be in the realtime publication on Supabase:
//   alter publication supabase_realtime add table workout_results;
// If it isn't, the channel simply never fires — harmless.
export function subscribeRealtime(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`sync:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workout_results', filter: `user_id=eq.${userId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

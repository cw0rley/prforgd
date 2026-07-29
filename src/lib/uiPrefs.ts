import { readJSON, writeJSON, getUserId } from './localStore';
import { supabase } from './supabase';

// WODs-screen filter toggles. Stored per-user: a fast local copy (namespaced by
// user id, so it never bleeds across accounts on a shared device) plus a cloud
// copy in `user_preferences` so the choice follows the account across devices.
export interface FilterPrefs {
  filterFavorites: boolean;
  filterEquipment: boolean;
}

const DEFAULTS: FilterPrefs = { filterFavorites: false, filterEquipment: false };
const BASE = 'ui_filter_prefs';

// Instant, offline-safe read of the current user's cached prefs.
export async function getFilterPrefs(): Promise<FilterPrefs> {
  return { ...DEFAULTS, ...(await readJSON<Partial<FilterPrefs>>(BASE, {})) };
}

// Best-effort pull from the cloud for a signed-in user; refreshes the local
// cache. Returns the prefs if it fetched them, else null (logged out, offline,
// or the table isn't provisioned yet).
export async function pullFilterPrefs(): Promise<FilterPrefs | null> {
  const uid = await getUserId();
  if (!uid) return null;
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('prefs')
      .eq('user_id', uid)
      .maybeSingle();
    if (error || !data?.prefs) return null;
    const prefs = { ...DEFAULTS, ...(data.prefs as Partial<FilterPrefs>) };
    await writeJSON(BASE, prefs);
    return prefs;
  } catch {
    return null;
  }
}

// Update prefs: write the local cache immediately, then best-effort push to the
// cloud so it syncs to the user's other devices.
export async function setFilterPrefs(patch: Partial<FilterPrefs>): Promise<FilterPrefs> {
  const next = { ...(await getFilterPrefs()), ...patch };
  await writeJSON(BASE, next);
  const uid = await getUserId();
  if (uid) {
    try {
      await supabase.from('user_preferences').upsert(
        { user_id: uid, prefs: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch {
      // Offline or table missing — the local cache still holds the choice.
    }
  }
  return next;
}

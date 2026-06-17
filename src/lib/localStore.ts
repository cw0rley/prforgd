import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Per-user local storage namespacing.
//
// The phone is local-first: everything is written to AsyncStorage and works
// offline; the cloud is a per-user copy. Historically the local keys were
// global (one shared bucket per device), so data from one account could leak
// into / collide with another account's cloud rows when multiple people (or
// the same person across re-created accounts) used one device.
//
// We now namespace every per-user key by the signed-in user's id, or 'anon'
// when logged out. getResults/getFavorites/etc. resolve the namespace at call
// time, so screens never need to know who is signed in.
// ---------------------------------------------------------------------------

export const ANON_NS = 'anon';

// Base keys (the namespace is appended as `${base}:${ns}`).
export const KEYS = {
  results: 'workout_results',
  resultsDeleted: 'workout_results_deleted',
  favorites: 'favorite_wods',
  favoritesDeleted: 'favorite_wods_deleted',
  equipment: 'user_equipment',
  equipmentUpdatedAt: 'user_equipment_updated_at',
} as const;

// Per-namespace sync bookkeeping.
const DIRTY_KEY = 'sync_dirty'; // `${DIRTY_KEY}:${ns}` -> 'true' when there are unpushed local changes
const LAST_SYNCED_KEY = 'sync_last'; // `${LAST_SYNCED_KEY}:${ns}` -> ISO timestamp of last successful sync
const LEGACY_MIGRATED_KEY = 'storage_migrated_v2'; // one-shot flag for the legacy-key migration

export function nsKey(base: string, ns: string): string {
  return `${base}:${ns}`;
}

// ---------------------------------------------------------------------------
// Per-key async mutex.
//
// Storage is read-modify-write (read the whole array, change it, write it
// back). A workout save and the sync reconciler both do this on the same key;
// if they interleave, one's write silently clobbers the other's — which is how
// a freshly-logged workout could vanish. withLock serializes the critical
// section per base key so those read-modify-write blocks can't overlap.
// ---------------------------------------------------------------------------
const lockChains = new Map<string, Promise<unknown>>();
export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = lockChains.get(key) ?? Promise.resolve();
  // Each link waits for the previous one, regardless of its outcome.
  const next = prev.catch(() => {}).then(fn);
  // Store a never-rejecting tail so a thrown fn can't poison the chain.
  lockChains.set(key, next.then(() => {}, () => {}));
  return next;
}

// Resolve the current namespace from the active Supabase session.
export async function getNamespace(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? ANON_NS;
  } catch {
    return ANON_NS;
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// --- JSON helpers scoped to the current namespace ---
export async function readJSON<T>(base: string, fallback: T): Promise<T> {
  const ns = await getNamespace();
  const raw = await AsyncStorage.getItem(nsKey(base, ns));
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function writeJSON(base: string, value: unknown): Promise<void> {
  const ns = await getNamespace();
  await AsyncStorage.setItem(nsKey(base, ns), JSON.stringify(value));
}

// Same as readJSON/writeJSON but for an explicit namespace (used by the
// login-time merge of anonymous data into the user's bucket).
export async function readJSONFor<T>(base: string, ns: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(nsKey(base, ns));
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function writeJSONFor(base: string, ns: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(nsKey(base, ns), JSON.stringify(value));
}

// --- Dirty flag + last-synced (per namespace) ---
export async function markDirty(): Promise<void> {
  const ns = await getNamespace();
  if (ns === ANON_NS) return; // nothing to sync when logged out
  await AsyncStorage.setItem(nsKey(DIRTY_KEY, ns), 'true');
}

export async function isDirty(ns: string): Promise<boolean> {
  return (await AsyncStorage.getItem(nsKey(DIRTY_KEY, ns))) === 'true';
}

export async function clearDirty(ns: string): Promise<void> {
  await AsyncStorage.removeItem(nsKey(DIRTY_KEY, ns));
}

export async function setLastSynced(ns: string, iso: string): Promise<void> {
  await AsyncStorage.setItem(nsKey(LAST_SYNCED_KEY, ns), iso);
}

export async function getLastSynced(ns: string): Promise<string | null> {
  return AsyncStorage.getItem(nsKey(LAST_SYNCED_KEY, ns));
}

// One-shot migration of the old global (un-namespaced) keys into the current
// namespace. Runs at app start. If a session is already restored the data is
// assumed to belong to that user; otherwise it lands in the anon bucket and
// will merge into the user's bucket on their next login.
export async function migrateLegacyStorage(): Promise<void> {
  if ((await AsyncStorage.getItem(LEGACY_MIGRATED_KEY)) === 'true') return;

  const ns = await getNamespace();
  const bases = [
    KEYS.results,
    KEYS.resultsDeleted,
    KEYS.favorites,
    KEYS.equipment,
  ];

  for (const base of bases) {
    const legacy = await AsyncStorage.getItem(base); // old global key
    if (legacy == null) continue;
    const targetKey = nsKey(base, ns);
    // Don't clobber data already written under the namespaced key.
    if ((await AsyncStorage.getItem(targetKey)) == null) {
      await AsyncStorage.setItem(targetKey, legacy);
    }
    await AsyncStorage.removeItem(base);
  }

  await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
}

import { KEYS, readJSON, writeJSON, markDirty } from '../lib/localStore';

function triggerSync(): void {
  try {
    const { requestSync } = require('../lib/sync');
    requestSync();
  } catch {
    // sync module unavailable — local write already succeeded
  }
}

export async function getFavorites(): Promise<string[]> {
  return readJSON<string[]>(KEYS.favorites, []);
}

export async function toggleFavorite(wodId: string): Promise<boolean> {
  const favs = await getFavorites();
  const isFav = favs.includes(wodId);
  const updated = isFav ? favs.filter((id) => id !== wodId) : [...favs, wodId];
  await writeJSON(KEYS.favorites, updated);

  // Keep a tombstone set in step so un-favoriting propagates (and a re-favorite
  // clears the tombstone) rather than being resurrected by the union merge.
  const tombstones = await readJSON<string[]>(KEYS.favoritesDeleted, []);
  const tombSet = new Set(tombstones);
  if (isFav) tombSet.add(wodId);
  else tombSet.delete(wodId);
  await writeJSON(KEYS.favoritesDeleted, Array.from(tombSet));

  await markDirty();
  triggerSync();
  return !isFav;
}

export async function isFavorite(wodId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(wodId);
}

/**
 * Data layer for workouts, movements, and equipment.
 * Fetches from Supabase on app load, caches locally via AsyncStorage.
 * Falls back to cached data (or bundled static data) when offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { heroWods as staticWods, HeroWod, WodType } from './heroWods';
import { movements as staticMovements, Movement, movementAliases as staticAliases } from './movements';
import { allEquipment as staticEquipment, movementEquipment as staticMovementEquipment, Equipment } from './equipment';

const CACHE_KEYS = {
  workouts: 'supabase_workouts',
  movements: 'supabase_movements',
  aliases: 'supabase_aliases',
  equipment: 'supabase_equipment',
  movementEquipment: 'supabase_movement_equipment',
  lastSync: 'supabase_last_sync',
};

// In-memory cache (populated on init)
let _workouts: HeroWod[] = staticWods;
let _movements: Movement[] = staticMovements;
let _aliases: Record<string, string> = staticAliases;
let _equipment: Equipment[] = staticEquipment;
let _movementEquipment: Record<string, string[]> = staticMovementEquipment;
let _initialized = false;

/**
 * Initialize data from Supabase. Call once on app startup.
 * Loads from cache first (instant), then syncs from Supabase in background.
 */
export async function initWorkoutData(): Promise<void> {
  if (_initialized) return;

  // 1. Load from cache (instant startup)
  await loadFromCache();
  _initialized = true;

  // 2. Sync from Supabase in background
  syncFromSupabase().catch((err) => {
    console.warn('Background sync failed, using cached data:', err.message);
  });
}

async function loadFromCache(): Promise<void> {
  try {
    const [workoutsJson, movementsJson, aliasesJson, equipmentJson, meJson] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.workouts),
      AsyncStorage.getItem(CACHE_KEYS.movements),
      AsyncStorage.getItem(CACHE_KEYS.aliases),
      AsyncStorage.getItem(CACHE_KEYS.equipment),
      AsyncStorage.getItem(CACHE_KEYS.movementEquipment),
    ]);

    if (workoutsJson) _workouts = JSON.parse(workoutsJson);
    if (movementsJson) _movements = JSON.parse(movementsJson);
    if (aliasesJson) _aliases = JSON.parse(aliasesJson);
    if (equipmentJson) _equipment = JSON.parse(equipmentJson);
    if (meJson) _movementEquipment = JSON.parse(meJson);
  } catch {
    // Cache read failed, static data is already loaded
  }
}

async function syncFromSupabase(): Promise<void> {
  const results = await Promise.all([
    fetchWorkouts(),
    fetchMovements(),
    fetchAliases(),
    fetchEquipment(),
    fetchMovementEquipment(),
  ]);

  // Only update cache if at least workouts succeeded
  if (results[0]) {
    await AsyncStorage.setItem(CACHE_KEYS.lastSync, new Date().toISOString());
  }
}

async function fetchWorkouts(): Promise<boolean> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('name');

  if (error || !data) return false;

  _workouts = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    hero: row.hero || '',
    description: row.description || '',
    type: row.type as WodType,
    timeCap: row.time_cap ?? undefined,
    totalRounds: row.total_rounds ?? undefined,
    movements: row.movements || [],
    workout: row.workout,
    category: row.category,
    group: row.group ?? undefined,
  }));

  await AsyncStorage.setItem(CACHE_KEYS.workouts, JSON.stringify(_workouts));
  return true;
}

async function fetchMovements(): Promise<boolean> {
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .order('name');

  if (error || !data) return false;

  _movements = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    videoUrl: row.video_url || '',
    category: row.category,
  }));

  await AsyncStorage.setItem(CACHE_KEYS.movements, JSON.stringify(_movements));
  return true;
}

async function fetchAliases(): Promise<boolean> {
  const { data, error } = await supabase
    .from('movement_aliases')
    .select('*');

  if (error || !data) return false;

  _aliases = {};
  for (const row of data) {
    _aliases[row.alias] = row.target_name;
  }

  await AsyncStorage.setItem(CACHE_KEYS.aliases, JSON.stringify(_aliases));
  return true;
}

async function fetchEquipment(): Promise<boolean> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('name');

  if (error || !data) return false;

  _equipment = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    icon: row.icon || '--',
  }));

  await AsyncStorage.setItem(CACHE_KEYS.equipment, JSON.stringify(_equipment));
  return true;
}

async function fetchMovementEquipment(): Promise<boolean> {
  const { data, error } = await supabase
    .from('movement_equipment')
    .select('*');

  if (error || !data) return false;

  _movementEquipment = {};
  for (const row of data) {
    if (!_movementEquipment[row.movement_name]) {
      _movementEquipment[row.movement_name] = [];
    }
    _movementEquipment[row.movement_name].push(row.equipment_id);
  }

  await AsyncStorage.setItem(CACHE_KEYS.movementEquipment, JSON.stringify(_movementEquipment));
  return true;
}

// ============================================
// Public API — drop-in replacements
// ============================================

/** All workouts (replaces heroWods import) */
export function getWorkouts(): HeroWod[] {
  return _workouts;
}

/** All movements (replaces movements import) */
export function getMovements(): Movement[] {
  return _movements;
}

/** All equipment (replaces allEquipment import) */
export function getEquipment(): Equipment[] {
  return _equipment;
}

/** Movement-to-equipment mapping (replaces movementEquipment import) */
export function getMovementEquipment(): Record<string, string[]> {
  return _movementEquipment;
}

/** Find a movement by name, checking aliases (replaces findMovement) */
export function findMovement(name: string): Movement | undefined {
  // Check alias first
  if (name in _aliases) {
    const target = _aliases[name];
    if (!target) return undefined;
    const found = _movements.find((m) => m.name === target);
    if (found) return found;
  }

  const exact = _movements.find((m) => m.name === name);
  if (exact) return exact;

  const lower = name.toLowerCase();
  return _movements.find((m) => m.name.toLowerCase() === lower);
}

/** Get equipment needed for a set of movements (replaces getWodEquipment) */
export function getWodEquipment(movements: string[]): string[] {
  const equipmentSet = new Set<string>();
  for (const movement of movements) {
    const equip = _movementEquipment[movement];
    if (equip) equip.forEach((e) => equipmentSet.add(e));
  }
  return Array.from(equipmentSet);
}

/** Check if a WOD can be done with available equipment (replaces canDoWod) */
export function canDoWod(wodMovements: string[], userEquipment: string[]): boolean {
  const required = getWodEquipment(wodMovements);
  return required.every((e) => userEquipment.includes(e));
}

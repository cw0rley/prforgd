/**
 * Seed script: migrates data from flat files (heroWods.ts, movements.ts, equipment.ts)
 * into Supabase tables.
 *
 * Usage: npx tsx scripts/seed-supabase.ts
 *
 * Prerequisites:
 * - Run sql/create-workouts-table.sql in Supabase SQL Editor first
 * - npm install @supabase/supabase-js (already installed)
 */

import ws from 'ws';
// @ts-ignore - polyfill WebSocket for Node.js 20
globalThis.WebSocket = ws as any;

import { createClient } from '@supabase/supabase-js';
import { heroWods } from '../src/data/heroWods';
import { movements, movementAliases } from '../src/data/movements';
import { allEquipment, movementEquipment } from '../src/data/equipment';

// Use service role key for write access (anon key is read-only via RLS)
const SUPABASE_URL = 'https://boyjkzbouqqvhnggcgun.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var before running this script.');
  console.error('Find it in Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  realtime: { transport: undefined as any },
  auth: { persistSession: false },
});

async function seedWorkouts() {
  console.log(`Seeding ${heroWods.length} workouts...`);

  const rows = heroWods.map((w) => ({
    id: w.id,
    name: w.name,
    hero: w.hero || '',
    description: w.description || '',
    type: w.type,
    time_cap: w.timeCap ?? null,
    total_rounds: w.totalRounds ?? null,
    movements: w.movements,
    workout: w.workout,
    category: w.category,
    group: w.group ?? (w.category === 'benchmark' ? 'benchmark' : 'hero'),
    verified: false,
  }));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from('workouts').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error seeding workouts batch ${i}:`, error.message);
      return false;
    }
  }
  console.log(`  ✓ ${rows.length} workouts seeded`);
  return true;
}

async function seedMovements() {
  console.log(`Seeding ${movements.length} movements...`);

  const rows = movements.map((m) => ({
    id: m.id,
    name: m.name,
    video_url: m.videoUrl || '',
    category: m.category,
  }));

  const { error } = await supabase.from('movements').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error seeding movements:', error.message);
    return false;
  }
  console.log(`  ✓ ${rows.length} movements seeded`);
  return true;
}

async function seedAliases() {
  const aliases = Object.entries(movementAliases);
  console.log(`Seeding ${aliases.length} movement aliases...`);
  const rows = aliases.map(([alias, target]) => ({
    alias,
    target_name: target,
  }));

  const { error } = await supabase.from('movement_aliases').upsert(rows, { onConflict: 'alias' });
  if (error) {
    console.error('Error seeding aliases:', error.message);
    return false;
  }
  console.log(`  ✓ ${aliases.length} aliases seeded`);
  return true;
}

async function seedEquipment() {
  console.log(`Seeding ${allEquipment.length} equipment items...`);

  const rows = allEquipment.map((e) => ({
    id: e.id,
    name: e.name,
    icon: e.icon,
  }));

  const { error } = await supabase.from('equipment').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Error seeding equipment:', error.message);
    return false;
  }
  console.log(`  ✓ ${allEquipment.length} equipment items seeded`);
  return true;
}

async function seedMovementEquipment() {
  const entries = Object.entries(movementEquipment);
  console.log(`Seeding ${entries.length} movement-equipment mappings...`);

  const rows: { movement_name: string; equipment_id: string }[] = [];
  for (const [movementName, equipIds] of entries) {
    for (const equipId of equipIds) {
      rows.push({ movement_name: movementName, equipment_id: equipId });
    }
  }

  // Clear existing and re-insert (no upsert on composite key easily)
  await supabase.from('movement_equipment').delete().neq('movement_name', '');

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from('movement_equipment').insert(batch);
    if (error) {
      console.error(`Error seeding movement_equipment batch ${i}:`, error.message);
      return false;
    }
  }
  console.log(`  ✓ ${rows.length} movement-equipment mappings seeded`);
  return true;
}

async function main() {
  console.log('Starting Supabase seed...\n');

  const results = await Promise.all([
    seedWorkouts(),
    seedMovements(),
    seedEquipment(),
  ]);

  if (results.every(Boolean)) {
    // These depend on equipment/movements being seeded first
    await seedAliases();
    await seedMovementEquipment();
    console.log('\nSeed complete!');
  } else {
    console.error('\nSeed failed. Fix errors above and re-run.');
    process.exit(1);
  }
}

main();

/**
 * Guards the static data files against the live Supabase tables.
 *
 * The app reads workouts/movements/equipment from Supabase at runtime and the
 * static files in src/data are only the offline fallback — but the fetch in
 * workoutData.ts REPLACES each collection wholesale rather than merging. So the
 * two must stay identical, and drift breaks things quietly in both directions:
 *
 *   - in static but not in Supabase -> the item VANISHES for every online user,
 *     while still looking correct in the code (this is what nearly happened
 *     with the Cluster movement, whose SQL has to be run by hand)
 *   - in Supabase but not in static -> the offline fallback silently serves
 *     stale data (this is what happened to the Joshua H. Reeves weight)
 *
 * Needs no secrets: the anon key is public and ships in every client build.
 * Skips rather than fails when Supabase is unreachable, so `npm test` still
 * works on a plane.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabaseConfig';
import { heroWods as staticWods } from '../heroWods';
import { movements as staticMovements, movementAliases as staticAliases } from '../movements';
import { allEquipment as staticEquipment, movementEquipment as staticMovementEquipment } from '../equipment';

jest.setTimeout(60_000);

// PostgREST caps page size; ask for more than we could plausibly have so a
// silent truncation shows up as a drift failure rather than passing quietly.
const PAGE = 10_000;

async function table(name: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=${PAGE}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/** Readable two-way set diff, truncated so a big failure is still legible. */
function diff(label: string, inStatic: Set<string>, inDb: Set<string>): string[] {
  const problems: string[] = [];
  const show = (xs: string[]) =>
    xs.sort().slice(0, 15).join(', ') + (xs.length > 15 ? ` … (+${xs.length - 15} more)` : '');

  const missingFromDb = [...inStatic].filter((k) => !inDb.has(k));
  const missingFromStatic = [...inDb].filter((k) => !inStatic.has(k));

  if (missingFromDb.length) {
    problems.push(
      `${label}: ${missingFromDb.length} in static but NOT in Supabase ` +
        `(these VANISH for online users — run the matching scripts/*.sql): ${show(missingFromDb)}`
    );
  }
  if (missingFromStatic.length) {
    problems.push(
      `${label}: ${missingFromStatic.length} in Supabase but NOT in static ` +
        `(offline fallback is stale — update src/data): ${show(missingFromStatic)}`
    );
  }
  return problems;
}

let online = true;
let db: {
  workouts: any[];
  movements: any[];
  aliases: any[];
  equipment: any[];
  movementEquipment: any[];
};

beforeAll(async () => {
  try {
    const [workouts, movements, aliases, equipment, movementEquipment] = await Promise.all([
      table('workouts'),
      table('movements'),
      table('movement_aliases'),
      table('equipment'),
      table('movement_equipment'),
    ]);
    db = { workouts, movements, aliases, equipment, movementEquipment };
  } catch (err: any) {
    online = false;
    console.warn(`\n  [drift] Supabase unreachable, skipping drift checks: ${err.message}\n`);
  }
});

/** Wraps a check so it no-ops (rather than fails) when we could not reach Supabase. */
function check(name: string, fn: () => void) {
  it(name, () => {
    if (!online) return;
    fn();
  });
}

describe('static data matches live Supabase', () => {
  check('workout ids match', () => {
    expect(
      diff('workouts', new Set(staticWods.map((w) => w.id)), new Set(db.workouts.map((r) => r.id)))
    ).toEqual([]);
  });

  check('movement ids match', () => {
    expect(
      diff(
        'movements',
        new Set(staticMovements.map((m) => m.id)),
        new Set(db.movements.map((r) => r.id))
      )
    ).toEqual([]);
  });

  check('movement video urls and categories match', () => {
    const byId = new Map(db.movements.map((r) => [r.id, r]));
    const mismatches = staticMovements
      .filter((m) => byId.has(m.id))
      .flatMap((m) => {
        const row = byId.get(m.id)!;
        const out: string[] = [];
        if ((row.video_url || '') !== (m.videoUrl || '')) {
          out.push(`${m.id}: video static="${m.videoUrl}" db="${row.video_url}"`);
        }
        if (row.category !== m.category) {
          out.push(`${m.id}: category static="${m.category}" db="${row.category}"`);
        }
        if (row.name !== m.name) {
          out.push(`${m.id}: name static="${m.name}" db="${row.name}"`);
        }
        return out;
      });
    expect(mismatches).toEqual([]);
  });

  check('equipment ids match', () => {
    expect(
      diff(
        'equipment',
        new Set(staticEquipment.map((e) => e.id)),
        new Set(db.equipment.map((r) => r.id))
      )
    ).toEqual([]);
  });

  check('movement aliases match', () => {
    const dbPairs = new Set(db.aliases.map((r) => `${r.alias} -> ${r.target_name}`));
    const staticPairs = new Set(Object.entries(staticAliases).map(([a, t]) => `${a} -> ${t}`));
    expect(diff('aliases', staticPairs, dbPairs)).toEqual([]);
  });

  check('movement-to-equipment mapping matches', () => {
    const dbPairs = new Set(db.movementEquipment.map((r) => `${r.movement_name} -> ${r.equipment_id}`));
    const staticPairs = new Set(
      Object.entries(staticMovementEquipment).flatMap(([m, eq]) =>
        (eq as string[]).map((e) => `${m} -> ${e}`)
      )
    );
    expect(diff('movement_equipment', staticPairs, dbPairs)).toEqual([]);
  });
});

import { KEYS, readJSON, writeJSON, markDirty } from '../lib/localStore';

function triggerSync(): void {
  try {
    const { requestSync } = require('../lib/sync');
    requestSync();
  } catch {
    // sync module unavailable — local write already succeeded
  }
}

export async function getUserEquipment(): Promise<string[]> {
  return readJSON<string[]>(KEYS.equipment, []);
}

export async function saveUserEquipment(equipment: string[]): Promise<void> {
  await writeJSON(KEYS.equipment, equipment);
  // Stamp the local edit time so sync's last-write-wins picks the newer side.
  await writeJSON(KEYS.equipmentUpdatedAt, new Date().toISOString());
  await markDirty();
  triggerSync();
}

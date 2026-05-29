import { movements } from '../src/data/movements';
import { writeFileSync } from 'fs';

function esc(s: string): string {
  return '"' + s.replace(/"/g, '""') + '"';
}

const lines = ['Movement,Category,Video URL'];
for (const m of movements) {
  lines.push([esc(m.name), m.category, m.videoUrl].join(','));
}

writeFileSync('../data/prforgd-movements.csv', lines.join('\n'));
console.log(`${movements.length} movements written`);

import { heroWods } from '../src/data/heroWods';
import { writeFileSync } from 'fs';

function esc(s: string): string {
  return '"' + s.replace(/"/g, '""') + '"';
}

const lines = ['Workout,Description'];
for (const w of heroWods) {
  lines.push([
    esc(w.name),
    esc(w.workout.replace(/\n/g, ' | ')),
  ].join(','));
}

const outPath = '../data/prforgd-workouts-new.csv';
writeFileSync(outPath, lines.join('\n'));
console.log(`${heroWods.length} workouts written to ${outPath}`);

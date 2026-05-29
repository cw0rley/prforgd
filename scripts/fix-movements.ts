import { heroWods } from '../src/data/heroWods';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Ordered from most specific to least specific to avoid partial matches
const movementPatterns: [RegExp, string][] = [
  [/sumo deadlift high pull/i, 'Sumo Deadlift High Pull'],
  [/single-arm dumbbell snatch|alternating dumbbell snatch/i, 'Dumbbell Snatch'],
  [/dumbbell squat clean|db squat clean/i, 'Dumbbell Squat Clean'],
  [/dumbbell split clean/i, 'Dumbbell Split Clean'],
  [/dumbbell thruster/i, 'Dumbbell Thruster'],
  [/dumbbell snatch/i, 'Dumbbell Snatch'],
  [/hang power clean/i, 'Hang Power Clean'],
  [/hang squat clean/i, 'Hang Squat Clean'],
  [/squat clean/i, 'Squat Clean'],
  [/power clean/i, 'Power Clean'],
  [/clean\s*&\s*jerk|clean-and-jerk|clean and jerk/i, 'Clean-and-Jerk'],
  [/power snatch/i, 'Power Snatch'],
  [/overhead squat/i, 'Overhead Squat'],
  [/front squat/i, 'Front Squat'],
  [/back squat/i, 'Back Squat'],
  [/air squat/i, 'Air Squat'],
  [/handstand push-up|handstand push up|hspu/i, 'Handstand Push-Up'],
  [/ring push-up/i, 'Ring Push-Up'],
  [/strict press/i, 'Strict Press'],
  [/push press/i, 'Push Press'],
  [/push jerk/i, 'Push Jerk'],
  [/bench press/i, 'Bench Press'],
  [/turkish get-up/i, 'Turkish Get-Up'],
  [/chest-to-bar pull-up|chest to bar/i, 'Chest-to-Bar Pull-Up'],
  [/strict pull-up/i, 'Strict Pull-Up'],
  [/l-pull-up/i, 'L-Pull-Up'],
  [/pull-up|pull up/i, 'Pull-Up'],
  [/ring dip/i, 'Ring Dip'],
  [/muscle-up|muscle up/i, 'Muscle-Up'],
  [/toes-to-bar|toes to bar/i, 'Toes-to-Bar'],
  [/knees-to-elbow/i, 'Knees-to-Elbows'],
  [/ghd sit-up/i, 'GHD Sit-Up'],
  [/sit-up|sit up/i, 'Sit-Up'],
  [/push-up|push up|pushup/i, 'Push-Up'],
  [/wall ball/i, 'Wall Ball'],
  [/box jump/i, 'Box Jump'],
  [/double-under|double under/i, 'Double-Under'],
  [/kettlebell swing/i, 'Kettlebell Swing'],
  [/kettlebell clean/i, 'Kettlebell Clean'],
  [/rope climb/i, 'Rope Climb'],
  [/back extension/i, 'Back Extension'],
  [/bear crawl/i, 'Bear Crawl'],
  [/broad jump/i, 'Standing Broad Jump'],
  [/farmer/i, "Farmer's Walk"],
  [/body blaster/i, 'Body Blaster'],
  [/renegade row/i, 'Renegade Row'],
  [/deadlift/i, 'Deadlift'],
  [/thruster/i, 'Thruster'],
  [/snatch/i, 'Snatch'],
  [/clean/i, 'Clean'],
  [/jerk/i, 'Jerk'],
  [/burpee/i, 'Burpee'],
  [/run|sprint|mile/i, 'Run'],
  [/row(?![\w])/i, 'Row'],
  [/swim/i, 'Swim'],
];

function extractMovements(workout: string): string[] {
  const found: string[] = [];
  let remaining = workout;

  for (const [pattern, name] of movementPatterns) {
    if (pattern.test(remaining)) {
      found.push(name);
      // Remove matched text to avoid double-counting
      remaining = remaining.replace(new RegExp(pattern, 'gi'), '___');
    }
  }

  return found;
}

// Read the source file
const filePath = join(__dirname, '..', 'src', 'data', 'heroWods.ts');
let source = readFileSync(filePath, 'utf8');
let fixCount = 0;

for (const wod of heroWods) {
  const extracted = extractMovements(wod.workout);
  const oldMovements = wod.movements;

  // Check if they differ
  const oldSet = new Set(oldMovements);
  const newSet = new Set(extracted);
  const same = oldMovements.length === extracted.length && oldMovements.every(m => newSet.has(m));

  if (!same) {
    fixCount++;
    const oldStr = `movements: [${oldMovements.map(m => `'${m.replace(/'/g, "\\'")}'`).join(', ')}]`;
    const newStr = `movements: [${extracted.map(m => `'${m.replace(/'/g, "\\'")}'`).join(', ')}]`;

    if (source.includes(oldStr)) {
      // Only replace the first occurrence to be safe
      source = source.replace(oldStr, newStr);
      console.log(`Fixed: ${wod.name}`);
      console.log(`  Old: [${oldMovements.join(', ')}]`);
      console.log(`  New: [${extracted.join(', ')}]`);
      console.log('');
    } else {
      console.log(`MANUAL FIX NEEDED: ${wod.name} - could not find movements string in source`);
      console.log(`  Old: [${oldMovements.join(', ')}]`);
      console.log(`  New: [${extracted.join(', ')}]`);
      console.log('');
    }
  }
}

writeFileSync(filePath, source);
console.log(`\nFixed ${fixCount} WODs`);

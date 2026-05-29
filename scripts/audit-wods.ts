import { heroWods } from '../src/data/heroWods';

// Check if a movement name appears (or a reasonable variant) in the workout text
function movementInWorkout(movement: string, workout: string): boolean {
  const w = workout.toLowerCase();
  const m = movement.toLowerCase();

  // Direct match
  if (w.includes(m)) return true;

  // Common variants
  const variants: Record<string, string[]> = {
    'run': ['run', 'sprint', 'mile'],
    'pull-up': ['pull-up', 'pull up', 'pullup'],
    'push-up': ['push-up', 'push up', 'pushup'],
    'air squat': ['air squat', 'squats'],
    'box jump': ['box jump'],
    'wall ball': ['wall ball'],
    'kettlebell swing': ['kettlebell swing', 'kb swing'],
    'double-under': ['double-under', 'double under'],
    'muscle-up': ['muscle-up', 'muscle up'],
    'handstand push-up': ['handstand push-up', 'handstand push up', 'hspu'],
    'rope climb': ['rope climb'],
    'burpee': ['burpee'],
    'deadlift': ['deadlift'],
    'clean': ['clean'],
    'thruster': ['thruster'],
    'snatch': ['snatch'],
    'squat clean': ['squat clean'],
    'power clean': ['power clean'],
    'push jerk': ['push jerk'],
    'front squat': ['front squat'],
    'back squat': ['back squat'],
    'overhead squat': ['overhead squat'],
    'sit-up': ['sit-up', 'sit up'],
    'knees-to-elbows': ['knees-to-elbows', 'knees to elbows'],
    'ghd sit-up': ['ghd sit-up', 'ghd'],
    'ring dip': ['ring dip'],
    'bench press': ['bench press'],
    'back extension': ['back extension'],
    'row': ['row'],
    'clean-and-jerk': ['clean-and-jerk', 'clean & jerk', 'clean and jerk'],
    'push press': ['push press'],
    'sprint': ['sprint'],
    'turkish get-up': ['turkish get-up', 'turkish get up'],
    'dumbbell split clean': ['dumbbell split clean', 'split clean'],
    'bear crawl': ['bear crawl'],
    'standing broad jump': ['broad jump'],
    'sumo deadlift high pull': ['sumo deadlift high pull', 'sdlhp'],
    'hang clean': ['hang clean', 'hang power clean'],
    'dumbbell squat clean': ['dumbbell squat clean', 'db squat clean'],
    'farmer\'s walk': ['farmer'],
    'body blaster': ['body blaster'],
    'l-pull-up': ['l-pull-up', 'l pull'],
    'toes-to-bar': ['toes-to-bar', 'toes to bar'],
    'pistol': ['pistol'],
    'weighted pull-up': ['weighted pull'],
    'barbell row': ['barbell row'],
  };

  const checks = variants[m] || [m];
  return checks.some(v => w.includes(v));
}

// Extract movement-like words from workout text
function extractMovementsFromText(workout: string): string[] {
  const found: string[] = [];
  const w = workout.toLowerCase();

  const knownMovements = [
    'run', 'sprint', 'mile run', 'pull-up', 'push-up', 'air squat', 'box jump',
    'wall ball', 'kettlebell swing', 'double-under', 'muscle-up', 'handstand push-up',
    'rope climb', 'burpee', 'deadlift', 'clean & jerk', 'clean-and-jerk',
    'thruster', 'snatch', 'power snatch', 'squat clean', 'power clean',
    'push jerk', 'front squat', 'back squat', 'overhead squat', 'sit-up',
    'knees-to-elbows', 'ghd sit-up', 'ring dip', 'bench press', 'back extension',
    'row', 'push press', 'turkish get-up', 'bear crawl', 'broad jump',
    'sumo deadlift high pull', 'hang power clean', 'farmer', 'toes-to-bar',
    'l-pull-up', 'dumbbell snatch', 'dumbbell thruster', 'ring push-up',
    'renegade row', 'chest-to-bar', 'strict pull-up', 'strict press',
    'single-arm dumbbell snatch',
  ];

  for (const m of knownMovements) {
    if (w.includes(m)) found.push(m);
  }
  return found;
}

console.log('=== MOVEMENT MISMATCH AUDIT ===\n');

let issues = 0;
for (const wod of heroWods) {
  const problems: string[] = [];

  // Check: movements listed but NOT in workout text
  for (const m of wod.movements) {
    if (!movementInWorkout(m, wod.workout)) {
      problems.push(`  Listed movement "${m}" NOT found in workout text`);
    }
  }

  // Check: movements in workout text but NOT in movements array
  const textMovements = extractMovementsFromText(wod.workout);
  const movLower = wod.movements.map(m => m.toLowerCase());

  for (const tm of textMovements) {
    // Check if any listed movement covers this text movement
    const covered = movLower.some(m => {
      if (tm.includes(m) || m.includes(tm)) return true;
      // run covers sprint, mile run
      if (m === 'run' && (tm === 'sprint' || tm === 'mile run')) return true;
      if (m === 'sprint' && tm === 'run') return true;
      if (m === 'clean' && tm.includes('clean')) return true;
      if (m === 'pull-up' && (tm === 'chest-to-bar' || tm === 'strict pull-up' || tm === 'l-pull-up')) return true;
      if (m === 'push-up' && tm === 'ring push-up') return true;
      if (m === 'snatch' && tm.includes('snatch')) return true;
      if (m === 'squat' && tm.includes('squat')) return true;
      if (m === 'air squat' && tm.includes('squat')) return true;
      if (m === 'row' && tm === 'renegade row') return true;
      if (m === 'press' && tm.includes('press')) return true;
      return false;
    });
    if (!covered) {
      problems.push(`  Workout text has "${tm}" but NOT in movements array`);
    }
  }

  if (problems.length > 0) {
    issues++;
    console.log(`${wod.name} (${wod.id})`);
    console.log(`  Movements: [${wod.movements.join(', ')}]`);
    console.log(`  Workout: ${wod.workout.replace(/\n/g, ' | ')}`);
    for (const p of problems) console.log(p);
    console.log('');
  }
}

console.log(`\n=== ${issues} WODs with potential issues out of ${heroWods.length} ===`);

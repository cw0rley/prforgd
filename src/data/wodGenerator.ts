import { movements } from './movements';
import { movementEquipment } from './equipment';

export type GeneratedWodType = 'for-time' | 'amrap' | 'emom' | 'rounds-for-time';

export interface GeneratedWod {
  type: GeneratedWodType;
  timeCap?: number;
  totalRounds?: number;
  movements: { name: string; reps: number; weight?: string }[];
  description: string;
  name?: string;
}

export interface WarmupRoutine {
  movements: { name: string; reps: number | string }[];
  description: string;
}

const repSchemes: Record<string, number[]> = {
  barbell: [3, 5, 7, 9, 12, 15, 21],
  gymnastic: [3, 5, 7, 10, 15, 20],
  kettlebell: [8, 10, 12, 15, 21],
  bodyweight: [10, 15, 20, 25, 30, 50],
  cardio: [1],
  other: [10, 15, 20],
};

const cardioDistances: Record<string, string[]> = {
  Run: ['200m', '400m', '800m'],
  Row: ['250m', '500m', '1000m'],
  Swim: ['100m', '200m'],
};

const wodTypes: { type: GeneratedWodType; label: string }[] = [
  { type: 'for-time', label: 'For Time' },
  { type: 'amrap', label: 'AMRAP' },
  { type: 'rounds-for-time', label: 'Rounds For Time' },
  { type: 'emom', label: 'EMOM' },
];

const amrapTimes = [8, 10, 12, 15, 20];
const emomTimes = [8, 10, 12, 16, 20];
const roundCounts = [3, 4, 5, 6];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAvailableMovements(userEquipment: string[]): typeof movements {
  return movements.filter((m) => {
    const required = movementEquipment[m.name];
    if (required === undefined) return false; // unlisted = exclude
    if (required.length === 0) return true; // no equipment needed (bodyweight)
    return required.every((e) => userEquipment.includes(e));
  });
}

function pickMovements(available: typeof movements, count: number): typeof movements {
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  // Try to get diverse categories
  const categories = new Set<string>();
  const picked: typeof movements = [];

  for (const m of shuffled) {
    if (picked.length >= count) break;
    if (!categories.has(m.category) || picked.length >= count - 1) {
      picked.push(m);
      categories.add(m.category);
    }
  }

  // Fill if needed
  for (const m of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(m)) picked.push(m);
  }

  return picked.slice(0, count);
}

export function generateWod(userEquipment: string[]): GeneratedWod {
  const available = getAvailableMovements(userEquipment);
  if (available.length < 2) {
    return {
      type: 'for-time',
      movements: [
        { name: 'Air Squat', reps: 100 },
        { name: 'Push-Up', reps: 100 },
        { name: 'Sit-Up', reps: 100 },
      ],
      description: 'For Time:\n100 Air Squats\n100 Push-Ups\n100 Sit-Ups\n\n(Add more equipment for varied WODs)',
    };
  }

  const wodType = pick(wodTypes);
  const movementCount = pick([2, 3, 3, 4]);
  const selected = pickMovements(available, movementCount);

  const wodMovements = selected.map((m) => {
    if (m.category === 'cardio') {
      const distances = cardioDistances[m.name] || ['400m'];
      return { name: m.name, reps: 1, weight: pick(distances) };
    }
    const reps = pick(repSchemes[m.category] || repSchemes.bodyweight);
    return { name: m.name, reps };
  });

  let description = '';
  let timeCap: number | undefined;
  let totalRounds: number | undefined;

  switch (wodType.type) {
    case 'for-time':
      description = 'For Time:\n' + wodMovements
        .map((m) => m.weight ? `${m.weight} ${m.name}` : `${m.reps} ${m.name}${m.reps > 1 ? 's' : ''}`)
        .join('\n');
      break;

    case 'amrap':
      timeCap = pick(amrapTimes);
      description = `AMRAP in ${timeCap} minutes:\n` + wodMovements
        .map((m) => m.weight ? `${m.weight} ${m.name}` : `${m.reps} ${m.name}${m.reps > 1 ? 's' : ''}`)
        .join('\n');
      break;

    case 'rounds-for-time':
      totalRounds = pick(roundCounts);
      description = `${totalRounds} Rounds For Time:\n` + wodMovements
        .map((m) => m.weight ? `${m.weight} ${m.name}` : `${m.reps} ${m.name}${m.reps > 1 ? 's' : ''}`)
        .join('\n');
      break;

    case 'emom':
      timeCap = pick(emomTimes);
      description = `EMOM ${timeCap} minutes:\n` + wodMovements
        .map((m, i) => {
          const minute = i % 2 === 0 ? 'Odd' : 'Even';
          if (wodMovements.length <= 2) {
            return `${minute}: ${m.weight ? `${m.weight} ${m.name}` : `${m.reps} ${m.name}${m.reps > 1 ? 's' : ''}`}`;
          }
          return m.weight ? `${m.weight} ${m.name}` : `${m.reps} ${m.name}${m.reps > 1 ? 's' : ''}`;
        })
        .join('\n');
      break;
  }

  return {
    type: wodType.type,
    timeCap,
    totalRounds,
    movements: wodMovements,
    description,
  };
}

// Warmup generator
const warmupMovements = {
  general: [
    { name: 'Jumping Jacks', reps: '30' },
    { name: 'High Knees', reps: '20 each' },
    { name: 'Butt Kickers', reps: '20 each' },
    { name: 'Arm Circles', reps: '10 each way' },
    { name: 'Leg Swings', reps: '10 each' },
    { name: 'Inchworms', reps: '5' },
    { name: 'World\'s Greatest Stretch', reps: '5 each side' },
    { name: 'Hip Circles', reps: '10 each way' },
    { name: 'Shoulder Pass-Throughs', reps: '10' },
    { name: 'Cat-Cow Stretch', reps: '10' },
  ],
  upper: [
    { name: 'Arm Circles (small to big)', reps: '10 each way' },
    { name: 'Band Pull-Aparts', reps: '15' },
    { name: 'Push-Up to Down Dog', reps: '8' },
    { name: 'Scapular Push-Ups', reps: '10' },
    { name: 'Shoulder Dislocates', reps: '10' },
    { name: 'Banded Shoulder Stretch', reps: '30 sec each' },
    { name: 'Tricep Stretch', reps: '30 sec each' },
    { name: 'Wrist Circles', reps: '10 each way' },
  ],
  lower: [
    { name: 'Air Squats', reps: '15' },
    { name: 'Walking Lunges', reps: '10 each' },
    { name: 'Glute Bridges', reps: '15' },
    { name: 'Cossack Squats', reps: '5 each' },
    { name: 'Single-Leg RDL', reps: '8 each' },
    { name: 'Ankle Circles', reps: '10 each' },
    { name: 'Pigeon Stretch', reps: '30 sec each' },
    { name: 'Couch Stretch', reps: '30 sec each' },
  ],
  core: [
    { name: 'Plank Hold', reps: '30 sec' },
    { name: 'Dead Bugs', reps: '10 each' },
    { name: 'Hollow Body Hold', reps: '20 sec' },
    { name: 'Superman Hold', reps: '20 sec' },
    { name: 'Side Plank', reps: '20 sec each' },
    { name: 'Bird Dogs', reps: '8 each' },
  ],
};

export type WarmupFocus = 'general' | 'upper' | 'lower' | 'full';

export function generateWarmup(focus: WarmupFocus): WarmupRoutine {
  const picked: { name: string; reps: number | string }[] = [];

  // Always start with 2-3 general movements
  const general = [...warmupMovements.general].sort(() => Math.random() - 0.5);
  picked.push(...general.slice(0, 3));

  if (focus === 'upper' || focus === 'full') {
    const upper = [...warmupMovements.upper].sort(() => Math.random() - 0.5);
    picked.push(...upper.slice(0, 3));
  }

  if (focus === 'lower' || focus === 'full') {
    const lower = [...warmupMovements.lower].sort(() => Math.random() - 0.5);
    picked.push(...lower.slice(0, 3));
  }

  if (focus === 'general' || focus === 'full') {
    const core = [...warmupMovements.core].sort(() => Math.random() - 0.5);
    picked.push(...core.slice(0, 2));
  }

  const description = picked
    .map((m) => `${m.reps} ${m.name}`)
    .join('\n');

  return {
    movements: picked,
    description,
  };
}

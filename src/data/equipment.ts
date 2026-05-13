export interface Equipment {
  id: string;
  name: string;
  icon: string;
}

export const allEquipment: Equipment[] = [
  { id: 'barbell', name: 'Barbell & Plates', icon: '🏋️' },
  { id: 'pullup-bar', name: 'Pull-Up Bar', icon: '🔩' },
  { id: 'kettlebell', name: 'Kettlebell', icon: '🔔' },
  { id: 'dumbbells', name: 'Dumbbells', icon: '💪' },
  { id: 'box', name: 'Box', icon: '📦' },
  { id: 'rings', name: 'Rings', icon: '⭕' },
  { id: 'rope', name: 'Rope', icon: '🪢' },
  { id: 'rower', name: 'Rower', icon: '🚣' },
  { id: 'ghd', name: 'GHD', icon: '🪑' },
  { id: 'wall-ball', name: 'Wall Ball', icon: '⚽' },
  { id: 'jump-rope', name: 'Jump Rope', icon: '〰️' },
  { id: 'bench', name: 'Bench', icon: '🛋️' },
  { id: 'run-space', name: 'Running Space', icon: '🏃' },
  { id: 'pool', name: 'Pool', icon: '🏊' },
];

// Map each movement to the equipment it requires
export const movementEquipment: Record<string, string[]> = {
  // Barbell movements
  'Deadlift': ['barbell'],
  'Back Squat': ['barbell'],
  'Front Squat': ['barbell'],
  'Overhead Squat': ['barbell'],
  'Thruster': ['barbell'],
  'Power Clean': ['barbell'],
  'Squat Clean': ['barbell'],
  'Hang Clean': ['barbell'],
  'Clean': ['barbell'],
  'Clean & Jerk': ['barbell'],
  'Push Jerk': ['barbell'],
  'Push Press': ['barbell'],
  'Shoulder Press': ['barbell'],
  'Shoulder-to-Overhead': ['barbell'],
  'Power Snatch': ['barbell'],
  'Snatch': ['barbell'],
  'Sumo Deadlift High Pull': ['barbell'],
  'Bench Press': ['barbell', 'bench'],
  'Barbell Row': ['barbell'],

  // Gymnastic movements
  'Pull-Up': ['pullup-bar'],
  'Chest-to-Bar Pull-Up': ['pullup-bar'],
  'Muscle-Up': ['rings'],
  'Ring Dip': ['rings'],
  'Ring Row': ['rings'],
  'Handstand Push-Up': [],
  'Rope Climb': ['rope'],
  'Knees-to-Elbows': ['pullup-bar'],
  'Toes-to-Bar': ['pullup-bar'],
  'L-Pull-Up': ['pullup-bar'],

  // Bodyweight
  'Push-Up': [],
  'Air Squat': [],
  'Burpee': [],
  'Sit-Up': [],
  'GHD Sit-Up': ['ghd'],
  'Back Extension': ['ghd'],
  'Box Jump': ['box'],
  'Walking Lunge': [],
  'Pistol': [],
  'Pistol (Single-Leg Squat)': [],
  'Double-Under': ['jump-rope'],
  'Wall Ball': ['wall-ball'],
  'Turkish Get-Up': ['kettlebell'],

  // Kettlebell / Dumbbell
  'Kettlebell Swing': ['kettlebell'],
  'Kettlebell Clean': ['kettlebell'],
  'Kettlebell Snatch': ['kettlebell'],
  'Dumbbell Snatch': ['dumbbells'],
  'Dumbbell Squat Clean': ['dumbbells'],
  'Dumbbell Thruster': ['dumbbells'],
  'Dumbbell Split Clean': ['dumbbells'],
  'Dumbbell Push Press': ['dumbbells'],
  'Dumbbell Lunge': ['dumbbells'],

  // Cardio
  'Run': ['run-space'],
  'Row': ['rower'],
  'Swim': ['pool'],
};

// Get all equipment needed for a WOD
export function getWodEquipment(movements: string[]): string[] {
  const equipmentSet = new Set<string>();
  for (const movement of movements) {
    const equip = movementEquipment[movement];
    if (equip) {
      equip.forEach((e) => equipmentSet.add(e));
    }
  }
  return Array.from(equipmentSet);
}

// Check if a WOD can be done with available equipment
export function canDoWod(wodMovements: string[], userEquipment: string[]): boolean {
  const required = getWodEquipment(wodMovements);
  return required.every((e) => userEquipment.includes(e));
}

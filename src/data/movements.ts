export interface Movement {
  id: string;
  name: string;
  videoUrl: string;
  category: 'barbell' | 'gymnastic' | 'kettlebell' | 'bodyweight' | 'cardio' | 'other';
}

export const movements: Movement[] = [
  // Barbell
  { id: 'deadlift', name: 'Deadlift', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', category: 'barbell' },
  { id: 'back-squat', name: 'Back Squat', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', category: 'barbell' },
  { id: 'front-squat', name: 'Front Squat', videoUrl: 'https://www.youtube.com/watch?v=m4ytaCJZpl0', category: 'barbell' },
  { id: 'overhead-squat', name: 'Overhead Squat', videoUrl: 'https://www.youtube.com/watch?v=RD_vUnqwqqI', category: 'barbell' },
  { id: 'thruster', name: 'Thruster', videoUrl: 'https://www.youtube.com/watch?v=aea5BGj9a8Y', category: 'barbell' },
  { id: 'power-clean', name: 'Power Clean', videoUrl: 'https://www.youtube.com/watch?v=c-TD6-GESQk', category: 'barbell' },
  { id: 'squat-clean', name: 'Squat Clean', videoUrl: 'https://www.youtube.com/watch?v=Ty14ogq_Vok', category: 'barbell' },
  { id: 'hang-clean', name: 'Hang Clean', videoUrl: 'https://www.youtube.com/watch?v=8IYt7AtP8BI', category: 'barbell' },
  { id: 'clean-and-jerk', name: 'Clean & Jerk', videoUrl: 'https://www.youtube.com/watch?v=c-TD6-GESQk', category: 'barbell' },
  { id: 'push-jerk', name: 'Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=Cw0YyyJ8Tgw', category: 'barbell' },
  { id: 'push-press', name: 'Push Press', videoUrl: 'https://www.youtube.com/watch?v=X6-DMh-t4nQ', category: 'barbell' },
  { id: 'shoulder-press', name: 'Shoulder Press', videoUrl: 'https://www.youtube.com/watch?v=xe19t2Y5jAA', category: 'barbell' },
  { id: 'power-snatch', name: 'Power Snatch', videoUrl: 'https://www.youtube.com/watch?v=9xQp2sldyts', category: 'barbell' },
  { id: 'snatch', name: 'Snatch', videoUrl: 'https://www.youtube.com/watch?v=9xQp2sldyts', category: 'barbell' },
  { id: 'sumo-deadlift-high-pull', name: 'Sumo Deadlift High Pull', videoUrl: 'https://www.youtube.com/watch?v=o6QniJ9FaGA', category: 'barbell' },
  { id: 'bench-press', name: 'Bench Press', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', category: 'barbell' },
  { id: 'barbell-row', name: 'Barbell Row', videoUrl: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', category: 'barbell' },

  // Gymnastic
  { id: 'pull-up', name: 'Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=HRV5YKKaeVw', category: 'gymnastic' },
  { id: 'chest-to-bar', name: 'Chest-to-Bar Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=2fL4B_EcG0M', category: 'gymnastic' },
  { id: 'muscle-up', name: 'Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=astSQRh2sLo', category: 'gymnastic' },
  { id: 'ring-dip', name: 'Ring Dip', videoUrl: 'https://www.youtube.com/watch?v=k3F8JswkVnI', category: 'gymnastic' },
  { id: 'handstand-push-up', name: 'Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=oBqkLDfQcIo', category: 'gymnastic' },
  { id: 'rope-climb', name: 'Rope Climb', videoUrl: 'https://www.youtube.com/watch?v=iaBVSJm78ko', category: 'gymnastic' },
  { id: 'knees-to-elbows', name: 'Knees-to-Elbows', videoUrl: 'https://www.youtube.com/watch?v=_03pCKOv4l4', category: 'gymnastic' },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', videoUrl: 'https://www.youtube.com/watch?v=_03pCKOv4l4', category: 'gymnastic' },
  { id: 'l-pull-up', name: 'L-Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=HRV5YKKaeVw', category: 'gymnastic' },

  // Bodyweight
  { id: 'push-up', name: 'Push-Up', videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4', category: 'bodyweight' },
  { id: 'air-squat', name: 'Air Squat', videoUrl: 'https://www.youtube.com/watch?v=C_VtOYc6j5c', category: 'bodyweight' },
  { id: 'burpee', name: 'Burpee', videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU', category: 'bodyweight' },
  { id: 'sit-up', name: 'Sit-Up', videoUrl: 'https://www.youtube.com/watch?v=1fbU_MkV7NE', category: 'bodyweight' },
  { id: 'ghd-sit-up', name: 'GHD Sit-Up', videoUrl: 'https://www.youtube.com/watch?v=1fbU_MkV7NE', category: 'bodyweight' },
  { id: 'back-extension', name: 'Back Extension', videoUrl: 'https://www.youtube.com/watch?v=ph3pddpKzzk', category: 'bodyweight' },
  { id: 'box-jump', name: 'Box Jump', videoUrl: 'https://www.youtube.com/watch?v=hxldG9FX4j4', category: 'bodyweight' },
  { id: 'walking-lunge', name: 'Walking Lunge', videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', category: 'bodyweight' },
  { id: 'pistol', name: 'Pistol (Single-Leg Squat)', videoUrl: 'https://www.youtube.com/watch?v=It3yvU0fomI', category: 'bodyweight' },
  { id: 'double-under', name: 'Double-Under', videoUrl: 'https://www.youtube.com/watch?v=82jNjCC_d4Q', category: 'bodyweight' },
  { id: 'wall-ball', name: 'Wall Ball', videoUrl: 'https://www.youtube.com/watch?v=fpUD0mcFp_0', category: 'bodyweight' },
  { id: 'turkish-get-up', name: 'Turkish Get-Up', videoUrl: 'https://www.youtube.com/watch?v=0bWRPC6--Kk', category: 'bodyweight' },

  // Kettlebell
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', videoUrl: 'https://www.youtube.com/watch?v=zBIWpPfc6NY', category: 'kettlebell' },
  { id: 'kettlebell-clean', name: 'Kettlebell Clean', videoUrl: 'https://www.youtube.com/watch?v=zBIWpPfc6NY', category: 'kettlebell' },
  { id: 'kettlebell-snatch', name: 'Kettlebell Snatch', videoUrl: 'https://www.youtube.com/watch?v=zBIWpPfc6NY', category: 'kettlebell' },
  { id: 'dumbbell-snatch', name: 'Dumbbell Snatch', videoUrl: 'https://www.youtube.com/watch?v=2YedyLmkDRE', category: 'kettlebell' },
  { id: 'dumbbell-squat-clean', name: 'Dumbbell Squat Clean', videoUrl: 'https://www.youtube.com/watch?v=2YedyLmkDRE', category: 'kettlebell' },
  { id: 'dumbbell-thruster', name: 'Dumbbell Thruster', videoUrl: 'https://www.youtube.com/watch?v=2YedyLmkDRE', category: 'kettlebell' },

  // Cardio
  { id: 'run', name: 'Run', videoUrl: '', category: 'cardio' },
  { id: 'row', name: 'Row', videoUrl: 'https://www.youtube.com/watch?v=sP6UW9auMco', category: 'cardio' },
  { id: 'swim', name: 'Swim', videoUrl: '', category: 'cardio' },
];

export function findMovement(name: string): Movement | undefined {
  const lower = name.toLowerCase().replace(/[^a-z ]/g, '');
  return movements.find((m) => {
    const mLower = m.name.toLowerCase().replace(/[^a-z ]/g, '');
    return lower.includes(mLower) || mLower.includes(lower);
  });
}

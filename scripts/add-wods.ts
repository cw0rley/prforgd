import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const newWods = [
  // === MISSING POPULAR HERO WODS ===
  {
    id: 'jerry',
    name: 'Jerry',
    hero: 'SGM Jerry Dwayne Patton, US Army',
    description: 'In honor of Sergeant Major Jerry Dwayne Patton, 40, who died on October 15, 2008, during High Altitude High Opening parachute training.',
    type: 'for-time',
    movements: ['Run', 'Row'],
    workout: 'For Time:\n1 mile Run\n2,000m Row\n1 mile Run',
    category: 'army',
  },
  {
    id: 'chad',
    name: 'Chad',
    hero: 'Navy SEAL Chad Wilkinson',
    description: 'In honor of Navy SEAL Chad Wilkinson. This workout raises awareness for veteran mental health.',
    type: 'for-time',
    movements: ['Box Step-Up'],
    workout: 'For Time:\n1,000 Box Step-Ups (20 in)\nWearing a 45/35 lb ruck',
    category: 'navy',
  },
  {
    id: 'angie',
    name: 'Angie',
    hero: 'CrossFit Benchmark',
    description: 'One of the original CrossFit benchmark "Girl" WODs. A grueling test of bodyweight endurance.',
    type: 'for-time',
    movements: ['Pull-Up', 'Push-Up', 'Sit-Up', 'Air Squat'],
    workout: 'For Time:\n100 Pull-Ups\n100 Push-Ups\n100 Sit-Ups\n100 Air Squats',
    category: 'benchmark',
    group: 'girl',
  },
  {
    id: 'candy',
    name: 'Candy',
    hero: 'CrossFit Benchmark',
    description: 'A CrossFit benchmark "Girl" WOD testing bodyweight gymnastics endurance.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Pull-Up', 'Push-Up', 'Air Squat'],
    workout: '5 Rounds For Time:\n20 Pull-Ups\n40 Push-Ups\n60 Air Squats',
    category: 'benchmark',
    group: 'girl',
  },
  {
    id: 'hope',
    name: 'Hope',
    hero: 'CrossFit Benchmark',
    description: 'A Fight Gone Bad-style benchmark WOD. Three rounds of five stations.',
    type: 'rounds-for-time',
    totalRounds: 3,
    movements: ['Burpee', 'Power Snatch', 'Box Jump', 'Thruster', 'Chest-to-Bar Pull-Up'],
    workout: '3 Rounds of "Fight Gone Bad" style:\nBurpees\nPower Snatches (75/55 lb)\nBox Jumps (24/20 in)\nThrusters (75/55 lb)\nChest-to-Bar Pull-Ups\n\n1 minute at each station, 1 minute rest between rounds. Score = total reps.',
    category: 'benchmark',
    group: 'girl',
  },
  {
    id: 'maggie',
    name: 'Maggie',
    hero: 'CrossFit Benchmark',
    description: 'A CrossFit benchmark "Girl" WOD featuring advanced gymnastics movements.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Handstand Push-Up', 'Pull-Up', 'Pistol'],
    workout: '5 Rounds For Time:\n20 Handstand Push-Ups\n40 Pull-Ups\n60 Pistols',
    category: 'benchmark',
    group: 'girl',
  },
  {
    id: 'roy',
    name: 'Roy',
    hero: 'SGT Michael C. Roy, USMC',
    description: 'In honor of Marine Sergeant Michael C. Roy, 25, of North Fort Myers, FL, who was killed on July 8, 2009, in Nimroz Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Deadlift', 'Box Jump', 'Pull-Up'],
    workout: '5 Rounds For Time:\n15 Deadlifts (225/155 lb)\n20 Box Jumps (24/20 in)\n25 Pull-Ups',
    category: 'marines',
  },
  {
    id: 'ryan',
    name: 'Ryan',
    hero: 'FF Ryan Hummert, Maplewood MO',
    description: 'In honor of Maplewood, Missouri firefighter Ryan Hummert, 22, who was killed by a sniper on August 21, 2008.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Muscle-Up', 'Burpee'],
    workout: '5 Rounds For Time:\n7 Muscle-Ups\n21 Burpees',
    category: 'firefighter',
  },
  {
    id: 'jared',
    name: 'Jared',
    hero: 'MSG Jared N. Van Aalst, US Army',
    description: 'In honor of Army Master Sergeant Jared N. Van Aalst, 34, of Laconia, NH, who was killed on August 4, 2010, in Kunduz Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 4,
    movements: ['Run', 'Pull-Up', 'Push-Up'],
    workout: '4 Rounds For Time:\n800m Run\n40 Pull-Ups\n70 Push-Ups',
    category: 'army',
  },
  {
    id: 'danny',
    name: 'Danny',
    hero: 'SGT Daniel Sakai, Oakland SWAT',
    description: 'In honor of Oakland SWAT Sergeant Daniel Sakai who was killed in the line of duty on March 21, 2009.',
    type: 'amrap',
    timeCap: 20,
    movements: ['Box Jump', 'Push Press', 'Pull-Up'],
    workout: 'AMRAP in 20 minutes:\n30 Box Jumps (24/20 in)\n20 Push Presses (115/75 lb)\n30 Pull-Ups',
    category: 'leo',
  },
  {
    id: 'hidalgo',
    name: 'Hidalgo',
    hero: '1LT Daren M. Hidalgo, US Army',
    description: 'In honor of Army 1st Lieutenant Daren M. Hidalgo, 24, of Waukesha, WI, who was killed on February 20, 2011, in Wardak Province, Afghanistan.',
    type: 'for-time',
    movements: ['Run', 'Squat Clean', 'Box Jump', 'Walking Lunge'],
    workout: 'For Time:\n2 mile Run\nRest 2 minutes\n20 Squat Cleans (135/95 lb)\n20 Box Jumps (24/20 in)\n20 Walking Lunges (45/25 lb plate overhead)\n20 Box Jumps (24/20 in)\n20 Squat Cleans (135/95 lb)\nRest 2 minutes\n2 mile Run\n\nOptional: 20 lb vest',
    category: 'army',
  },
  {
    id: 'holbrook',
    name: 'Holbrook',
    hero: 'CPT Jason Holbrook, US Army',
    description: 'In honor of Army Captain Jason Holbrook, 28, of Burnet, TX, who was killed on July 29, 2010, in Tsagay, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 10,
    movements: ['Thruster', 'Pull-Up', 'Run'],
    workout: '10 Rounds (rest 1 min between):\n5 Thrusters (115/75 lb)\n10 Pull-Ups\n100m Sprint',
    category: 'army',
  },
  {
    id: 'collin',
    name: 'Collin',
    hero: 'CPO Collin Trent Thomas, USN',
    description: 'In honor of Navy Special Warfare Operator Chief Collin Trent Thomas, 33, who was killed on August 18, 2010, in Zabul Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 6,
    movements: ['Sandbag Carry', 'Push Press', 'Box Jump', 'Sumo Deadlift High Pull'],
    workout: '6 Rounds For Time:\n400m Sandbag Carry (50/35 lb)\n12 Push Presses (115/75 lb)\n12 Box Jumps (24/20 in)\n12 Sumo Deadlift High Pulls (95/65 lb)',
    category: 'navy',
  },
  {
    id: 'bull',
    name: 'Bull',
    hero: 'CPT Brandon "Bull" Barrett, USMC',
    description: 'In honor of Marine Captain Brandon "Bull" Barrett, 27, of Marion, IN, who was killed on May 5, 2010, in Helmand Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 2,
    movements: ['Double-Under', 'Overhead Squat', 'Pull-Up', 'Run'],
    workout: '2 Rounds For Time:\n200 Double-Unders\n50 Overhead Squats (135/95 lb)\n50 Pull-Ups\n1 mile Run',
    category: 'marines',
  },
  {
    id: 'dallas-5',
    name: 'Dallas 5',
    hero: 'Five Officers, Dallas TX',
    description: 'In honor of the five officers killed on July 7, 2016, in Dallas, Texas: Brent Thompson, Patrick Zamarripa, Michael Krol, Lorne Ahrens, and Michael Smith.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Burpee', 'Deadlift', 'Box Jump', 'Turkish Get-Up', 'Snatch', 'Push-Up', 'Row'],
    workout: '5 Rounds of 5-minute stations (1 min rest between):\nStation 1: Burpees\nStation 2: 7 Deadlifts (155/105 lb) + 7 Box Jumps (24/20 in)\nStation 3: Turkish Get-Ups (40/25 lb dumbbell)\nStation 4: 7 Snatches (75/55 lb) + 7 Push-Ups\nStation 5: Row for Calories\n\nScore = total reps',
    category: 'leo',
  },
  {
    id: 'white',
    name: 'White',
    hero: '1LT Ashley White, US Army',
    description: 'In honor of Army 1st Lieutenant Ashley White, 24, of Alliance, OH, who was killed on October 22, 2011, in Kandahar Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Rope Climb', 'Toes-to-Bar', 'Walking Lunge', 'Run'],
    workout: '5 Rounds For Time:\n3 Rope Climbs (15 ft)\n10 Toes-to-Bar\n21 Walking Lunges (45/25 lb plate overhead)\n400m Run',
    category: 'army',
  },
  {
    id: 'rankel',
    name: 'Rankel',
    hero: 'SGT John Rankel, USMC',
    description: 'In honor of Marine Sergeant John Rankel, 23, of Speedway, IN, who was killed on June 7, 2010, in Helmand Province, Afghanistan.',
    type: 'amrap',
    timeCap: 20,
    movements: ['Deadlift', 'Burpee Pull-Up', 'Kettlebell Swing', 'Run'],
    workout: 'AMRAP in 20 minutes:\n6 Deadlifts (225/155 lb)\n7 Burpee Pull-Ups\n10 Kettlebell Swings (70/53 lb)\n200m Run',
    category: 'marines',
  },
  {
    id: 'moore',
    name: 'Moore',
    hero: 'Officer David S. Moore',
    description: 'In honor of Officer David S. Moore who was killed in the line of duty.',
    type: 'amrap',
    timeCap: 20,
    movements: ['Rope Climb', 'Run', 'Handstand Push-Up'],
    workout: 'AMRAP in 20 minutes:\n1 Rope Climb (15 ft)\n400m Run\nMax Rep Handstand Push-Ups',
    category: 'leo',
  },
  {
    id: 'marco',
    name: 'Marco',
    hero: 'CPL Marc T. Ryan, USMC',
    description: 'In honor of Marine Corporal Marc T. Ryan, 25, who was killed on November 15, 2004, in Ramadi, Iraq.',
    type: 'rounds-for-time',
    totalRounds: 3,
    movements: ['Pull-Up', 'Handstand Push-Up', 'Thruster'],
    workout: '3 Rounds For Time:\n21 Pull-Ups\n15 Handstand Push-Ups\n9 Thrusters (135/95 lb)',
    category: 'marines',
  },
  {
    id: 'donny',
    name: 'Donny',
    hero: 'SPC Donald L. Nichols, US Army',
    description: 'In honor of Army Specialist Donald L. Nichols, 21, of Shell Rock, IA, who was killed on January 15, 2008, in Taji, Iraq.',
    type: 'for-time',
    movements: ['Deadlift', 'Burpee'],
    workout: 'For Time:\n21 Deadlifts (225/155 lb)\n21 Burpees\n15 Deadlifts\n15 Burpees\n9 Deadlifts\n9 Burpees\n9 Deadlifts\n9 Burpees\n15 Deadlifts\n15 Burpees\n21 Deadlifts\n21 Burpees',
    category: 'army',
  },
  {
    id: 'wes',
    name: 'Wes',
    hero: 'LT Wesley Van Dorn, USN',
    description: 'In honor of Navy Lieutenant J. Wesley Van Dorn, 29, of Greensboro, NC, who was killed on January 8, 2012, in Khost Province, Afghanistan.',
    type: 'for-time',
    movements: ['Run', 'Pull-Up', 'Burpee Box Jump', 'Clean'],
    workout: 'For Time:\n800m Run with 25 lb plate\n14 Rounds of:\n  5 Pull-Ups\n  4 Burpee Box Jumps (24/20 in)\n  3 Cleans (185/125 lb)\n800m Run with 25 lb plate',
    category: 'navy',
  },
  {
    id: 'zeus',
    name: 'Zeus',
    hero: 'SPC David E. Hickman, US Army',
    description: 'In honor of Army Specialist David E. Hickman, 23, of Greensboro, NC, who was killed on November 14, 2011, in Baghdad, Iraq.',
    type: 'rounds-for-time',
    totalRounds: 3,
    movements: ['Wall Ball', 'Sumo Deadlift High Pull', 'Box Jump', 'Push Press', 'Row', 'Push-Up', 'Back Squat'],
    workout: '3 Rounds For Time:\n30 Wall Balls (20/14 lb)\n30 Sumo Deadlift High Pulls (75/55 lb)\n30 Box Jumps (20 in)\n30 Push Presses (75/55 lb)\n30 Calorie Row\n30 Push-Ups\n10 Back Squats (bodyweight)',
    category: 'army',
  },
];

// Read the source file
const filePath = join(__dirname, '..', 'src', 'data', 'heroWods.ts');
let source = readFileSync(filePath, 'utf8');

// Find the closing bracket of the array
const insertPoint = source.lastIndexOf('];');

const wodsCode = newWods.map(w => {
  let code = `  {\n`;
  code += `    id: '${w.id}',\n`;
  code += `    name: '${w.name.replace(/'/g, "\\'")}',\n`;
  code += `    hero: '${w.hero.replace(/'/g, "\\'")}',\n`;
  code += `    description: '${w.description.replace(/'/g, "\\'")}',\n`;
  code += `    type: '${w.type}',\n`;
  if ((w as any).timeCap) code += `    timeCap: ${(w as any).timeCap},\n`;
  if ((w as any).totalRounds) code += `    totalRounds: ${(w as any).totalRounds},\n`;
  code += `    movements: [${w.movements.map(m => `'${m.replace(/'/g, "\\'")}'`).join(', ')}],\n`;
  code += `    workout: '${w.workout.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',\n`;
  code += `    category: '${w.category}',\n`;
  if ((w as any).group) code += `    group: '${(w as any).group}',\n`;
  code += `  },`;
  return code;
}).join('\n');

const newSource = source.slice(0, insertPoint) + '\n  // ===== ADDITIONAL WODS =====\n' + wodsCode + '\n' + source.slice(insertPoint);

writeFileSync(filePath, newSource);
console.log(`Added ${newWods.length} new WODs`);

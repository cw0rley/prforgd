import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const newWods = [
  {
    id: 'adrian',
    name: 'Adrian',
    hero: 'SFC Adrian Elizalde, US Army',
    description: 'In honor of Army Sergeant 1st Class Adrian Elizalde, 30, of North Bend, OR, who was killed on August 23, 2007, in Baghdad, Iraq.',
    type: 'rounds-for-time',
    totalRounds: 7,
    movements: ['Wall Climb', 'Toes-to-Bar', 'Box Jump'],
    workout: '7 Rounds For Time:\n3 Forward Rolls\n5 Wall Climbs\n7 Toes-to-Bar\n9 Box Jumps (30/24 in)',
    category: 'army',
  },
  {
    id: 'bradley',
    name: 'Bradley',
    hero: 'SrA Bradley R. Smith, USAF',
    description: 'In honor of Air Force Senior Airman Bradley R. Smith, 24, of Troy, IL, who was killed on January 3, 2010, at Forward Operating Base Chapman, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 10,
    movements: ['Pull-Up', 'Burpee', 'Run'],
    workout: '10 Rounds:\n100m Sprint\n10 Pull-Ups\n100m Sprint\n10 Burpees\nRest 30 seconds',
    category: 'air-force',
  },
  {
    id: 'gaza',
    name: 'Gaza',
    hero: 'CPT Lucas "Gaza" Gruenther, USAF',
    description: 'In honor of Air Force Captain Lucas "Gaza" Gruenther, 32, of Colleyville, TX, who was killed on December 27, 2013, in Kabul, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Kettlebell Swing', 'Push-Up', 'Pull-Up', 'Box Jump', 'Run'],
    workout: '5 Rounds For Time:\n35 Kettlebell Swings (53/35 lb)\n30 Push-Ups\n25 Pull-Ups\n20 Box Jumps (30/24 in)\n1 mile Run',
    category: 'air-force',
  },
  {
    id: 'hall',
    name: 'Hall',
    hero: 'CPT Ryan P. Hall, USAF',
    description: 'In honor of Air Force Captain Ryan P. Hall, 30, of Champlin, MN, who was killed on March 30, 2012, in Kapisa Province, Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Clean', 'Kettlebell Snatch', 'Run'],
    workout: '5 Rounds (rest 2 min between):\n3 Cleans (225/155 lb)\n200m Sprint\n20 Kettlebell Snatches (53/35 lb)',
    category: 'air-force',
  },
  {
    id: 'josie',
    name: 'Josie',
    hero: 'Deputy U.S. Marshal Josie Wells',
    description: 'In honor of Deputy U.S. Marshal Josie Wells who was killed in the line of duty.',
    type: 'for-time',
    movements: ['Burpee', 'Power Clean', 'Front Squat', 'Run'],
    workout: 'For Time (wearing 20 lb vest):\n1 mile Run\n3 Rounds of:\n  30 Burpees\n  4 Power Cleans (155/105 lb)\n  6 Front Squats (155/105 lb)\n1 mile Run',
    category: 'leo',
  },
  {
    id: 'lee',
    name: 'Lee',
    hero: 'SSG Dick Alson Lee Jr., US Army',
    description: 'In honor of Army Staff Sergeant Dick Alson Lee Jr., 31, of Orange Park, FL, who was killed on April 26, 2016, in Afghanistan.',
    type: 'rounds-for-time',
    totalRounds: 5,
    movements: ['Run', 'Deadlift', 'Squat Clean', 'Push Jerk', 'Muscle-Up', 'Rope Climb'],
    workout: '5 Rounds For Time:\n400m Run\n1 Deadlift (345/230 lb)\n3 Squat Cleans (185/125 lb)\n5 Push Jerks (185/125 lb)\n3 Muscle-Ups\n1 Rope Climb (15 ft)',
    category: 'army',
  },
  {
    id: 'dork',
    name: 'Dork',
    hero: 'FF Michael Kennedy, Boston FD',
    description: 'In honor of Boston firefighter Michael Kennedy, 33, who was killed on March 26, 2014, while fighting a nine-alarm fire.',
    type: 'rounds-for-time',
    totalRounds: 6,
    movements: ['Double-Under', 'Kettlebell Swing', 'Burpee'],
    workout: '6 Rounds For Time:\n60 Double-Unders\n30 Kettlebell Swings (53/35 lb)\n15 Burpees',
    category: 'firefighter',
  },
  {
    id: 'walsh',
    name: 'Walsh',
    hero: '1LT Jonathan P. Walsh, US Army',
    description: 'In honor of Army 1st Lieutenant Jonathan P. Walsh, 28, of Cobb, CA, who was killed on July 7, 2007, in Baghdad, Iraq.',
    type: 'rounds-for-time',
    totalRounds: 4,
    movements: ['Burpee Pull-Up', 'Back Squat', 'Run'],
    workout: '4 Rounds For Time:\n22 Burpee Pull-Ups\n22 Back Squats (185/135 lb)\n200m Run with 45/25 lb plate overhead',
    category: 'army',
  },
  {
    id: 'del',
    name: 'Del',
    hero: '1LT Dimitri Del Castillo, US Army',
    description: 'In honor of Army 1st Lieutenant Dimitri Del Castillo, 24, of Tampa, FL, who was killed on June 25, 2011, in Kunar Province, Afghanistan.',
    type: 'for-time',
    movements: ['Burpee', 'Pull-Up', 'Handstand Push-Up', 'Chest-to-Bar Pull-Up', 'Run'],
    workout: 'For Time:\n25 Burpees\n400m Run with 20 lb medicine ball\n25 Weighted Pull-Ups (20 lb)\n400m Run with 20 lb ball\n25 Handstand Push-Ups\n400m Run with 20 lb ball\n25 Chest-to-Bar Pull-Ups\n400m Run with 20 lb ball\n25 Burpees',
    category: 'army',
  },
];

const filePath = join(__dirname, '..', 'src', 'data', 'heroWods.ts');
let source = readFileSync(filePath, 'utf8');

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

const newSource = source.slice(0, insertPoint) + '\n' + wodsCode + '\n' + source.slice(insertPoint);

writeFileSync(filePath, newSource);
console.log(`Added ${newWods.length} new WODs`);

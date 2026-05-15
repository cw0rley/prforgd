export interface Movement {
  id: string;
  name: string;
  videoUrl: string;
  category: 'barbell' | 'gymnastic' | 'kettlebell' | 'bodyweight' | 'cardio' | 'other';
}

export const movements: Movement[] = [
  // Barbell
  { id: 'back-squat', name: 'Back Squat', videoUrl: 'https://www.youtube.com/watch?v=QmZAiBqPvZw', category: 'barbell' },
  { id: 'barbell-front-rack-lunge', name: 'Barbell Front-Rack Lunge', videoUrl: 'https://www.youtube.com/watch?v=f3WLs_HutLw', category: 'barbell' },
  { id: 'barbell-row', name: 'Barbell Row', videoUrl: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', category: 'barbell' },
  { id: 'bench-press', name: 'Bench Press', videoUrl: 'https://www.youtube.com/watch?v=SCVCLChPQFY', category: 'barbell' },
  { id: 'clean', name: 'Clean', videoUrl: 'https://www.youtube.com/watch?v=Ty14ogq_Vok', category: 'barbell' },
  { id: 'clean-and-jerk', name: 'Clean & Jerk', videoUrl: 'https://www.youtube.com/watch?v=PjY1rH4_MOA', category: 'barbell' },
  { id: 'clean-and-push-jerk', name: 'Clean and Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=GqAEuwXQXRU', category: 'barbell' },
  { id: 'deadlift', name: 'Deadlift', videoUrl: 'https://www.youtube.com/watch?v=1ZXobu7JvvE', category: 'barbell' },
  { id: 'front-squat', name: 'Front Squat', videoUrl: 'https://www.youtube.com/watch?v=uYumuL_G_V0', category: 'barbell' },
  { id: 'good-morning', name: 'Good Morning', videoUrl: 'https://www.youtube.com/watch?v=YA-h3n9L4YU', category: 'barbell' },
  { id: 'hang-clean', name: 'Hang Clean', videoUrl: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ', category: 'barbell' },
  { id: 'hang-clean-push-jerk', name: 'Hang Clean and Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=KBpys4KTG5Q', category: 'barbell' },
  { id: 'hang-power-clean', name: 'Hang Power Clean', videoUrl: 'https://www.youtube.com/watch?v=0aP3tgKZcHQ', category: 'barbell' },
  { id: 'hang-power-clean-push-jerk', name: 'Hang Power Clean and Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=8IYt7AtP8BI', category: 'barbell' },
  { id: 'hang-power-snatch', name: 'Hang Power Snatch', videoUrl: 'https://www.youtube.com/watch?v=-mLzQdVAwlw', category: 'barbell' },
  { id: 'hang-snatch', name: 'Hang Snatch', videoUrl: 'https://www.youtube.com/watch?v=IucshEToDyM', category: 'barbell' },
  { id: 'knees-back-deadlift', name: 'Knees Back In Deadlift', videoUrl: 'https://www.youtube.com/watch?v=3mA9cnet-No', category: 'barbell' },
  { id: 'muscle-snatch', name: 'Muscle Snatch', videoUrl: 'https://www.youtube.com/watch?v=bJYzOo1cNqY', category: 'barbell' },
  { id: 'overhead-lunge', name: 'Overhead Lunge', videoUrl: 'https://www.youtube.com/watch?v=m6MczOv_Ayg', category: 'barbell' },
  { id: 'overhead-squat', name: 'Overhead Squat', videoUrl: 'https://www.youtube.com/watch?v=pn8mqlG0nkE', category: 'barbell' },
  { id: 'power-clean', name: 'Power Clean', videoUrl: 'https://www.youtube.com/watch?v=c-TD6-GESQk', category: 'barbell' },
  { id: 'power-clean-split-jerk', name: 'Power Clean and Split Jerk', videoUrl: 'https://www.youtube.com/watch?v=Sk1vhXhHO_A', category: 'barbell' },
  { id: 'power-snatch', name: 'Power Snatch', videoUrl: 'https://www.youtube.com/watch?v=TL8SMp7RdXQ', category: 'barbell' },
  { id: 'push-jerk', name: 'Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=VrHNJXoSyXw', category: 'barbell' },
  { id: 'push-press', name: 'Push Press', videoUrl: 'https://www.youtube.com/watch?v=iaBVSJm78ko', category: 'barbell' },
  { id: 'shoulder-press', name: 'Shoulder Press', videoUrl: 'https://www.youtube.com/watch?v=5yWaNOvgFCM', category: 'barbell' },
  { id: 'snatch', name: 'Snatch', videoUrl: 'https://www.youtube.com/watch?v=GhxhiehJcQY', category: 'barbell' },
  { id: 'snatch-balance', name: 'Snatch Balance', videoUrl: 'https://www.youtube.com/watch?v=XuFaD1sAVGI', category: 'barbell' },
  { id: 'sots-press', name: 'Sots Press', videoUrl: 'https://www.youtube.com/watch?v=eJ9MLnNV6FY', category: 'barbell' },
  { id: 'split-clean', name: 'Split Clean', videoUrl: 'https://www.youtube.com/watch?v=a5CR3Bi2Gc8', category: 'barbell' },
  { id: 'split-jerk', name: 'Split Jerk', videoUrl: 'https://www.youtube.com/watch?v=GUDkOtraHHY', category: 'barbell' },
  { id: 'split-snatch', name: 'Split Snatch', videoUrl: 'https://www.youtube.com/watch?v=VFdCGK8yk-8', category: 'barbell' },
  { id: 'squat-clean', name: 'Squat Clean', videoUrl: 'https://www.youtube.com/watch?v=Ty14ogq_Vok', category: 'barbell' },
  { id: 'squat-stance', name: 'Squat Stance', videoUrl: 'https://www.youtube.com/watch?v=Tw7F9n5fT4w', category: 'barbell' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', videoUrl: 'https://www.youtube.com/watch?v=wQHSYDSgDn8', category: 'barbell' },
  { id: 'sumo-deadlift-high-pull', name: 'Sumo Deadlift High Pull', videoUrl: 'https://www.youtube.com/watch?v=gh55vVlwlQg', category: 'barbell' },
  { id: 'thruster', name: 'Thruster', videoUrl: 'https://www.youtube.com/watch?v=L219ltL15zk', category: 'barbell' },
  { id: 'zercher-squat', name: 'Zercher Squat', videoUrl: 'https://www.youtube.com/watch?v=nwx6Ip7hd3I', category: 'barbell' },

  // Gymnastic
  { id: 'back-scale', name: 'Back Scale', videoUrl: 'https://www.youtube.com/watch?v=Arh2Q_prqvw', category: 'gymnastic' },
  { id: 'butterfly-pull-up', name: 'Butterfly Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=OenVG15QMj8', category: 'gymnastic' },
  { id: 'chest-to-wall-hspu', name: 'Chest-To-Wall Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=lkPPVyExFpU', category: 'gymnastic' },
  { id: 'chest-to-bar', name: 'Chest-to-Bar Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=xf69XHAs5w8', category: 'gymnastic' },
  { id: 'dip', name: 'Dip', videoUrl: 'https://www.youtube.com/watch?v=o2qX3Zb5mvg', category: 'gymnastic' },
  { id: 'forward-roll', name: 'Forward Roll From Support', videoUrl: 'https://www.youtube.com/watch?v=xF8ptIfnfBo', category: 'gymnastic' },
  { id: 'freestanding-hspu', name: 'Freestanding Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=aAErmRDDJKY', category: 'gymnastic' },
  { id: 'front-scale', name: 'Front Scale', videoUrl: 'https://www.youtube.com/watch?v=WgXaf7g0Pyo', category: 'gymnastic' },
  { id: 'glide-kip', name: 'Glide Kip', videoUrl: 'https://www.youtube.com/watch?v=6UYEyhFpN0s', category: 'gymnastic' },
  { id: 'handstand', name: 'Handstand', videoUrl: 'https://www.youtube.com/watch?v=_-9_46by2JI', category: 'gymnastic' },
  { id: 'handstand-pirouette', name: 'Handstand Pirouette', videoUrl: 'https://www.youtube.com/watch?v=tTnvKzRLCUk', category: 'gymnastic' },
  { id: 'handstand-push-up', name: 'Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=0wDEO6shVjc', category: 'gymnastic' },
  { id: 'hspu-variations', name: 'Handstand Push-Up Variations', videoUrl: 'https://www.youtube.com/watch?v=qbRbM6d5ddM', category: 'gymnastic' },
  { id: 'handstand-walk', name: 'Handstand Walk', videoUrl: 'https://www.youtube.com/watch?v=rPT_iR-TSvA', category: 'gymnastic' },
  { id: 'hanging-l-sit', name: 'Hanging L-Sit', videoUrl: 'https://www.youtube.com/watch?v=WHi1bvZLwlw', category: 'gymnastic' },
  { id: 'hollow-back-press', name: 'Hollow Back Press', videoUrl: 'https://www.youtube.com/watch?v=ql8zA6sEq6U', category: 'gymnastic' },
  { id: 'kipping-bar-muscle-up', name: 'Kipping Bar Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=OCg3UXgzftc', category: 'gymnastic' },
  { id: 'kipping-c2b', name: 'Kipping Chest-To-Bar Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=AyPTCEXTjOo', category: 'gymnastic' },
  { id: 'kipping-deficit-hspu', name: 'Kipping Deficit Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=DJA1t6Fp5WE', category: 'gymnastic' },
  { id: 'kipping-hspu', name: 'Kipping Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=9wIkPCS4Mbo', category: 'gymnastic' },
  { id: 'kipping-muscle-up', name: 'Kipping Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=o69WaY_7k2c', category: 'gymnastic' },
  { id: 'kipping-pull-up', name: 'Kipping Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=HRV5YKKaeVw', category: 'gymnastic' },
  { id: 'kipping-toes-to-bar', name: 'Kipping Toes-To-Bar', videoUrl: 'https://www.youtube.com/watch?v=6dHvTlsMvNY', category: 'gymnastic' },
  { id: 'knees-to-elbows', name: 'Knees-to-Elbows', videoUrl: 'https://www.youtube.com/watch?v=_DUlB4YpZRw', category: 'gymnastic' },
  { id: 'l-pull-up', name: 'L-Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=qeGS55RHBUU', category: 'gymnastic' },
  { id: 'l-sit', name: 'L-Sit', videoUrl: 'https://www.youtube.com/watch?v=_HbccxgnCg0', category: 'gymnastic' },
  { id: 'l-sit-rings', name: 'L-Sit On Rings', videoUrl: 'https://www.youtube.com/watch?v=lwcHmXvw-T4', category: 'gymnastic' },
  { id: 'l-sit-rope-climb', name: 'L-Sit Rope Climb', videoUrl: 'https://www.youtube.com/watch?v=Ewf8rqGRbrE', category: 'gymnastic' },
  { id: 'l-sit-shoulder-stand', name: 'L-Sit To Shoulder Stand', videoUrl: 'https://www.youtube.com/watch?v=OkIPCkXhBmY', category: 'gymnastic' },
  { id: 'legless-rope-climb', name: 'Legless Rope Climb', videoUrl: 'https://www.youtube.com/watch?v=rfr-Tw3Pxh8', category: 'gymnastic' },
  { id: 'muscle-up', name: 'Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=o69WaY_7k2c', category: 'gymnastic' },
  { id: 'planche-press', name: 'Planche Press', videoUrl: 'https://www.youtube.com/watch?v=z8mC1DND2kI', category: 'gymnastic' },
  { id: 'pull-over', name: 'Pull-Over', videoUrl: 'https://www.youtube.com/watch?v=faJDYEZmueM', category: 'gymnastic' },
  { id: 'pull-up', name: 'Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=HRV5YKKaeVw', category: 'gymnastic' },
  { id: 'pull-up-mod', name: 'Pull-Up Modification', videoUrl: 'https://www.youtube.com/watch?v=u5Af6gQa554', category: 'gymnastic' },
  { id: 'ring-dip', name: 'Ring Dip', videoUrl: 'https://www.youtube.com/watch?v=EznLCDBAPIU', category: 'gymnastic' },
  { id: 'ring-push-up', name: 'Ring Push-Up', videoUrl: 'https://www.youtube.com/watch?v=FRiiZRhapeU', category: 'gymnastic' },
  { id: 'ring-row', name: 'Ring Row', videoUrl: 'https://www.youtube.com/watch?v=sEAOZc77wk8', category: 'gymnastic' },
  { id: 'rope-climb', name: 'Rope Climb', videoUrl: 'https://www.youtube.com/watch?v=Pa4QUC9AvuA', category: 'gymnastic' },
  { id: 'rope-climb-basket', name: 'Rope Climb (Basket)', videoUrl: 'https://www.youtube.com/watch?v=Pa4QUC9AvuA', category: 'gymnastic' },
  { id: 'modified-rope-climb', name: 'Modified Rope Climb', videoUrl: 'https://www.youtube.com/watch?v=BsDRv1fiXIY', category: 'gymnastic' },
  { id: 'shoot-through', name: 'Shoot-Through', videoUrl: 'https://www.youtube.com/watch?v=sZ9fP4iOmFs', category: 'gymnastic' },
  { id: 'skin-cat', name: 'Skin Cat', videoUrl: 'https://www.youtube.com/watch?v=ABSpTs17ObA', category: 'gymnastic' },
  { id: 'straddle-press', name: 'Straddle Press To Handstand', videoUrl: 'https://www.youtube.com/watch?v=DRYQDMUVgYE', category: 'gymnastic' },
  { id: 'strict-bar-muscle-up', name: 'Strict Bar Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=o69WaY_7k2c', category: 'gymnastic' },
  { id: 'strict-c2b', name: 'Strict Chest-To-Bar Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=xf69XHAs5w8', category: 'gymnastic' },
  { id: 'strict-hspu', name: 'Strict Handstand Push-Up', videoUrl: 'https://www.youtube.com/watch?v=0wDEO6shVjc', category: 'gymnastic' },
  { id: 'strict-knees-to-elbows', name: 'Strict Knees-To-Elbows', videoUrl: 'https://www.youtube.com/watch?v=_DUlB4YpZRw', category: 'gymnastic' },
  { id: 'strict-muscle-up', name: 'Strict Muscle-Up', videoUrl: 'https://www.youtube.com/watch?v=vJTJFc2wmk4', category: 'gymnastic' },
  { id: 'strict-pull-up', name: 'Strict Pull-Up', videoUrl: 'https://www.youtube.com/watch?v=HRV5YKKaeVw', category: 'gymnastic' },
  { id: 'strict-toes-to-bar', name: 'Strict Toes-To-Bar', videoUrl: 'https://www.youtube.com/watch?v=xX9Hzi7Onnw', category: 'gymnastic' },
  { id: 'strict-toes-to-rings', name: 'Strict Toes-To-Rings', videoUrl: 'https://www.youtube.com/watch?v=1zp-B1Vb_Vs', category: 'gymnastic' },
  { id: 'swing-backward-roll', name: 'Swing To Backward Roll To Support', videoUrl: 'https://www.youtube.com/watch?v=nwpEUd_Yc_E', category: 'gymnastic' },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', videoUrl: 'https://www.youtube.com/watch?v=6dHvTlsMvNY', category: 'gymnastic' },
  { id: 'wall-walk', name: 'Wall Walk', videoUrl: 'https://www.youtube.com/watch?v=NK_OcHEm8yM', category: 'gymnastic' },
  { id: 'windshield-wiper', name: 'Windshield Wiper', videoUrl: 'https://www.youtube.com/watch?v=W2xdEDuR-dE', category: 'gymnastic' },

  // Bodyweight
  { id: 'abmat-sit-up', name: 'AbMat Sit-Up', videoUrl: 'https://www.youtube.com/watch?v=VIZX2Ru9qU8', category: 'bodyweight' },
  { id: 'air-squat', name: 'Air Squat', videoUrl: 'https://www.youtube.com/watch?v=rMvwVtlqjTE', category: 'bodyweight' },
  { id: 'bent-arm-bent-hip-bent-leg', name: 'Bent Arm, Bent Hip, Bent Leg Press', videoUrl: 'https://www.youtube.com/watch?v=LZkVY7OoTg8', category: 'bodyweight' },
  { id: 'bent-arm-bent-hip-straight-leg', name: 'Bent Arm, Bent Hip, Straight Leg Press', videoUrl: 'https://www.youtube.com/watch?v=KR6xWc2kZrM', category: 'bodyweight' },
  { id: 'box-jump', name: 'Box Jump', videoUrl: 'https://www.youtube.com/watch?v=NBY9-kTuHEk', category: 'bodyweight' },
  { id: 'box-step-up', name: 'Box Step-Up', videoUrl: 'https://www.youtube.com/watch?v=5qjqDHOUh-A', category: 'bodyweight' },
  { id: 'burpee', name: 'Burpee', videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU', category: 'bodyweight' },
  { id: 'burpee-box-jump-over', name: 'Burpee Box Jump-Over', videoUrl: 'https://www.youtube.com/watch?v=GLktGkmcvWE', category: 'bodyweight' },
  { id: 'double-under', name: 'Double-Under', videoUrl: 'https://www.youtube.com/watch?v=82jNjDS19lg', category: 'bodyweight' },
  { id: 'ghd-back-extension', name: 'GHD Back Extension', videoUrl: 'https://www.youtube.com/watch?v=ivDB23Kcv-A', category: 'bodyweight' },
  { id: 'ghd-hip-back-extension', name: 'GHD Hip And Back Extension', videoUrl: 'https://www.youtube.com/watch?v=RDNIPcmP5vs', category: 'bodyweight' },
  { id: 'ghd-hip-extension', name: 'GHD Hip Extension', videoUrl: 'https://www.youtube.com/watch?v=7X075Hrl5lE', category: 'bodyweight' },
  { id: 'ghd-all-extensions', name: 'GHD Hip, Back, And Hip-Back Extension', videoUrl: 'https://www.youtube.com/watch?v=uha4orxDqSM', category: 'bodyweight' },
  { id: 'ghd-sit-up', name: 'GHD Sit-Up', videoUrl: 'https://www.youtube.com/watch?v=oFwt7WfnPcc', category: 'bodyweight' },
  { id: 'back-extension', name: 'Back Extension', videoUrl: 'https://www.youtube.com/watch?v=ivDB23Kcv-A', category: 'bodyweight' },
  { id: 'inverted-burpee', name: 'Inverted Burpee', videoUrl: 'https://www.youtube.com/watch?v=M6_nkTKhaFY', category: 'bodyweight' },
  { id: 'midline-air-squat', name: 'Midline Stabilization In Air Squat', videoUrl: 'https://www.youtube.com/watch?v=UFWqO0Onbdg', category: 'bodyweight' },
  { id: 'pistol', name: 'Pistol (Single-Leg Squat)', videoUrl: 'https://www.youtube.com/watch?v=qDcniqddTeE', category: 'bodyweight' },
  { id: 'push-up', name: 'Push-Up', videoUrl: 'https://www.youtube.com/watch?v=0pkjOk0EiAk', category: 'bodyweight' },
  { id: 'single-under', name: 'Single-Under', videoUrl: 'https://www.youtube.com/watch?v=hCuXYrTOMxI', category: 'bodyweight' },
  { id: 'sit-up', name: 'Sit-Up', videoUrl: 'https://www.youtube.com/watch?v=VIZX2Ru9qU8', category: 'bodyweight' },
  { id: 'stiff-stiff-press', name: 'Stiff-Stiff Press', videoUrl: 'https://www.youtube.com/watch?v=uufr_sV9jY8', category: 'bodyweight' },
  { id: 'walking-lunge', name: 'Walking Lunge', videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', category: 'bodyweight' },
  { id: 'wall-ball', name: 'Wall Ball', videoUrl: 'https://www.youtube.com/watch?v=fpUD0mcFp_0', category: 'bodyweight' },

  // Kettlebell / Dumbbell
  { id: 'dumbbell-clean', name: 'Dumbbell Clean', videoUrl: 'https://www.youtube.com/watch?v=SYxObzJ3gn0', category: 'kettlebell' },
  { id: 'dumbbell-deadlift', name: 'Dumbbell Deadlift', videoUrl: 'https://www.youtube.com/watch?v=JNpUNRPQkAk', category: 'kettlebell' },
  { id: 'dumbbell-farmers-carry', name: 'Dumbbell Farmers Carry', videoUrl: 'https://www.youtube.com/watch?v=p5MNNosenJc', category: 'kettlebell' },
  { id: 'dumbbell-front-squat', name: 'Dumbbell Front Squat', videoUrl: 'https://www.youtube.com/watch?v=B86Zj72LwzA', category: 'kettlebell' },
  { id: 'dumbbell-front-rack-lunge', name: 'Dumbbell Front-Rack Lunge', videoUrl: 'https://www.youtube.com/watch?v=7EmwtpAI8cM', category: 'kettlebell' },
  { id: 'dumbbell-hang-clean', name: 'Dumbbell Hang Clean', videoUrl: 'https://www.youtube.com/watch?v=8r44xv_Aqbw', category: 'kettlebell' },
  { id: 'dumbbell-hang-power-clean', name: 'Dumbbell Hang Power Clean', videoUrl: 'https://www.youtube.com/watch?v=myc1taX-uBs', category: 'kettlebell' },
  { id: 'dumbbell-overhead-squat', name: 'Dumbbell Overhead Squat', videoUrl: 'https://www.youtube.com/watch?v=azumEfnk-GI', category: 'kettlebell' },
  { id: 'dumbbell-overhead-walking-lunge', name: 'Dumbbell Overhead Walking Lunge', videoUrl: 'https://www.youtube.com/watch?v=J3DxelcaaMU', category: 'kettlebell' },
  { id: 'dumbbell-power-clean', name: 'Dumbbell Power Clean', videoUrl: 'https://www.youtube.com/watch?v=viWI2rEt-HU', category: 'kettlebell' },
  { id: 'dumbbell-snatch', name: 'Dumbbell Power Snatch', videoUrl: 'https://www.youtube.com/watch?v=3mlhF3dptAo', category: 'kettlebell' },
  { id: 'dumbbell-push-jerk', name: 'Dumbbell Push Jerk', videoUrl: 'https://www.youtube.com/watch?v=rnN3pYswScE', category: 'kettlebell' },
  { id: 'dumbbell-push-press', name: 'Dumbbell Push Press', videoUrl: 'https://www.youtube.com/watch?v=4tCaD42ghlc', category: 'kettlebell' },
  { id: 'dumbbell-squat-clean', name: 'Dumbbell Squat Clean', videoUrl: 'https://www.youtube.com/watch?v=2YedyLmkDRE', category: 'kettlebell' },
  { id: 'dumbbell-squat-snatch', name: 'Dumbbell Squat Snatch', videoUrl: 'https://www.youtube.com/watch?v=3mlhF3dptAo', category: 'kettlebell' },
  { id: 'dumbbell-thruster', name: 'Dumbbell Thruster', videoUrl: 'https://www.youtube.com/watch?v=u3wKkZjE8QM', category: 'kettlebell' },
  { id: 'dumbbell-turkish-get-up', name: 'Dumbbell Turkish Get-Up', videoUrl: 'https://www.youtube.com/watch?v=saYKvqSscuY', category: 'kettlebell' },
  { id: 'kettlebell-snatch', name: 'Kettlebell Snatch', videoUrl: 'https://www.youtube.com/watch?v=Pm-b2XFeABA', category: 'kettlebell' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', videoUrl: 'https://www.youtube.com/watch?v=mKDIuUbH94Q', category: 'kettlebell' },
  { id: 'medicine-ball-clean', name: 'Medicine-Ball Clean', videoUrl: 'https://www.youtube.com/watch?v=KVGhkHSrDJo', category: 'kettlebell' },
  { id: 'medicine-ball-progression', name: 'Medicine Ball Progression', videoUrl: 'https://www.youtube.com/watch?v=TlneBvU4XFY', category: 'kettlebell' },
  { id: 'slam-ball', name: 'Slam Ball', videoUrl: 'https://www.youtube.com/watch?v=k9W6g9LvXDI', category: 'kettlebell' },
  { id: 'turkish-get-up', name: 'Turkish Get-Up', videoUrl: 'https://www.youtube.com/watch?v=saYKvqSscuY', category: 'kettlebell' },

  // Cardio
  { id: 'run', name: 'Run', videoUrl: '', category: 'cardio' },
  { id: 'row', name: 'Row', videoUrl: 'https://www.youtube.com/watch?v=fxfhQMbATCw', category: 'cardio' },
  { id: 'swim', name: 'Swim', videoUrl: '', category: 'cardio' },
];

// Direct name-to-movement overrides for WOD movement names that don't match exactly
const movementAliases: Record<string, string> = {
  'Pull-Up': 'Kipping Pull-Up',
  'Push-Up': 'Push-Up',
  'Sit-Up': 'AbMat Sit-Up',
  'Row': 'Row',
  'Squat Clean': 'Squat Clean',
  'Power Clean': 'Power Clean',
  'Hang Clean': 'Hang Clean',
  'Snatch': 'Snatch',
  'Power Snatch': 'Power Snatch',
  'Clean': 'Clean',
  'Muscle-Up': 'Kipping Muscle-Up',
  'Ring Dip': 'Ring Dip',
  'Rope Climb': 'Rope Climb',
  'Handstand Push-Up': 'Strict Handstand Push-Up',
  'Toes-to-Bar': 'Kipping Toes-To-Bar',
  'Back Extension': 'GHD Back Extension',
  'Dumbbell Snatch': 'Dumbbell Power Snatch',
  'Shoulder-to-Overhead': 'Push Press',
  'Weighted Pull-Up': 'Strict Pull-Up',
  'Bear Crawl': '',
  'Sprint': '',
  'Standing Broad Jump': '',
  'Dumbbell Lunge': 'Dumbbell Front-Rack Lunge',
  'Dumbbell Split Clean': 'Dumbbell Clean',
  'Clean & Jerk': 'Clean & Jerk',
  'Dumbell Push Press': 'Dumbbell Push Press',
  'Hang Squat Clean': 'Squat Clean',
  'Jerk': 'Split Jerk',
  'Pistol': 'Pistol (Single-Leg Squat)',
  'Squat': 'Air Squat',
};

export function findMovement(name: string): Movement | undefined {
  // Check alias first
  if (name in movementAliases) {
    const target = movementAliases[name];
    if (!target) return undefined; // explicitly no match
    const found = movements.find((m) => m.name === target);
    if (found) return found;
  }

  // Exact match
  const exact = movements.find((m) => m.name === name);
  if (exact) return exact;

  // Case-insensitive exact
  const lower = name.toLowerCase();
  const ciExact = movements.find((m) => m.name.toLowerCase() === lower);
  if (ciExact) return ciExact;

  // No match — don't guess
  return undefined;
}

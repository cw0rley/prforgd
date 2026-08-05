-- Add dumbbell snatch weight (55/35 lb) to "Joshua H. Reeves".
-- Run in Supabase SQL Editor (project boyjkzbouqqvhnggcgun).
-- The app reads workouts from this table at runtime; heroWods.ts is only the offline fallback.

update public.workouts
set workout = E'5 Rounds For Time:\n9 Toes-to-Bars\n22 Alternating Dumbbell Snatches (55/35 lb)\n7 Squat Cleans (135/95 lb)'
where id = 'joshua-h-reeves';

-- Verify:
-- select id, workout from public.workouts where id = 'joshua-h-reeves';

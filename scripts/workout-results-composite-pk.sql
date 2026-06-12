-- Make workout_results multi-tenant: primary key on (user_id, id) instead of id.
--
-- Why: sync uploads use upsert(onConflict). With a global PK on `id`, a local
-- workout whose id already exists in the cloud under a DIFFERENT user_id makes
-- the upsert attempt an UPDATE on a foreign-owned row, which RLS blocks with
-- "new row violates row-level security policy (USING expression) for table
-- workout_results". Keying on (user_id, id) means the same id under two users
-- is two distinct rows, so a colliding id just inserts a new row for the
-- current user instead of erroring.
--
-- Run this in the Supabase SQL Editor (project boyjkzbouqqvhnggcgun) BEFORE
-- deploying the matching sync code (which uses onConflict: 'user_id,id').

alter table public.workout_results drop constraint workout_results_pkey;
alter table public.workout_results add primary key (user_id, id);

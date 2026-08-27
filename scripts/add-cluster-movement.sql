-- Add the Cluster movement (barbell: squat clean straight into a thruster).
-- Static source of truth is src/data/movements.ts; this keeps the Supabase
-- `movements` table in sync. Idempotent via upsert on id.

insert into movements (id, name, video_url, category)
values ('cluster', 'Cluster', 'https://www.youtube.com/watch?v=XmoilY-pc-k', 'barbell')
on conflict (id) do update
  set name = excluded.name,
      video_url = excluded.video_url,
      category = excluded.category;

-- Equipment requirement: barbell & plates.
insert into movement_equipment (movement_name, equipment_id)
values ('Cluster', 'barbell')
on conflict do nothing;

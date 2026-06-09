-- Run this in Supabase SQL Editor
-- Creates all three data tables: workouts, movements, movement_equipment

-- ============================================
-- 1. WORKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hero TEXT DEFAULT '',
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('for-time', 'amrap', 'rounds-for-time', 'chipper', 'emom')),
  time_cap INTEGER,
  total_rounds INTEGER,
  movements TEXT[] NOT NULL DEFAULT '{}',
  workout TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('army', 'navy', 'marines', 'air-force', 'firefighter', 'leo', 'benchmark')),
  "group" TEXT CHECK ("group" IN ('hero', 'girl', 'benchmark')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workouts are publicly readable"
  ON workouts FOR SELECT USING (true);

CREATE INDEX idx_workouts_category ON workouts (category);
CREATE INDEX idx_workouts_group ON workouts ("group");
CREATE INDEX idx_workouts_type ON workouts (type);

-- ============================================
-- 2. MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  video_url TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('barbell', 'gymnastic', 'kettlebell', 'bodyweight', 'cardio', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movements are publicly readable"
  ON movements FOR SELECT USING (true);

CREATE INDEX idx_movements_category ON movements (category);

-- ============================================
-- 3. MOVEMENT ALIASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movement_aliases (
  alias TEXT PRIMARY KEY,
  target_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movement_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movement aliases are publicly readable"
  ON movement_aliases FOR SELECT USING (true);

-- ============================================
-- 4. EQUIPMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '--',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment is publicly readable"
  ON equipment FOR SELECT USING (true);

-- ============================================
-- 5. MOVEMENT_EQUIPMENT TABLE (join table)
-- ============================================
CREATE TABLE IF NOT EXISTS movement_equipment (
  movement_name TEXT NOT NULL,
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  PRIMARY KEY (movement_name, equipment_id)
);

ALTER TABLE movement_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movement equipment is publicly readable"
  ON movement_equipment FOR SELECT USING (true);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER movements_updated_at
  BEFORE UPDATE ON movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

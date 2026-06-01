-- PRForgd Database Schema
-- Run this in SQL Editor on the new Supabase project (Step 2.3)

-- 1. Workout Results
CREATE TABLE IF NOT EXISTS workout_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wod_id TEXT,
  wod_name TEXT,
  wod_description TEXT,
  date TEXT NOT NULL,
  time_seconds INTEGER,
  rounds INTEGER,
  reps INTEGER,
  round_times JSONB,
  notes TEXT DEFAULT '',
  completed BOOLEAN DEFAULT TRUE,
  rx BOOLEAN DEFAULT FALSE,
  is_pr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results"
  ON workout_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON workout_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
  ON workout_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON workout_results FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wod_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, wod_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 3. User Equipment
CREATE TABLE IF NOT EXISTS user_equipment (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own equipment"
  ON user_equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own equipment"
  ON user_equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment"
  ON user_equipment FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════
-- JEEVAMITHRAN — SUPABASE SCHEMA
-- Commercial Tamil Family Meal Planner
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. PROFILES
--    Extends Supabase auth.users with app data
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  date_of_birth DATE,
  flat          TEXT,
  street        TEXT,
  area          TEXT,
  city          TEXT,
  state         TEXT,
  pin_code      TEXT,
  map_link      TEXT,
  photo_url     TEXT,
  photo_x       INTEGER DEFAULT 50,
  photo_y       INTEGER DEFAULT 50,
  role          TEXT DEFAULT 'user',   -- 'user' | 'admin'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. FAMILY MEMBERS
--    Each user's family members
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  relation      TEXT,
  age           INTEGER,
  gender        TEXT,
  menu_type     TEXT DEFAULT 'family',  -- 'family' | 'diet' | 'dolu'
  whatsapp      TEXT,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. PREFERENCES
--    Diet mode, spice level, household count
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preferences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  diet_mode     TEXT DEFAULT 'mixed',   -- 'veg' | 'nonveg' | 'diet' | 'mixed'
  spice_level   INTEGER DEFAULT 3,      -- 0–4
  selected_state TEXT DEFAULT 'TN',
  household_men       INTEGER DEFAULT 1,
  household_women     INTEGER DEFAULT 1,
  household_aged      INTEGER DEFAULT 0,
  household_children  INTEGER DEFAULT 0,
  price_mode    TEXT DEFAULT 'auto',    -- 'auto' | 'manual'
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. MEAL PLANS
--    Monthly meal plan (30-day schedule)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month         INTEGER NOT NULL,       -- 0–11
  year          INTEGER NOT NULL,
  plan_data     JSONB NOT NULL,         -- array of {day, breakfast, lunch, dinner}
  seed          INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- ─────────────────────────────────────────────
-- 5. FAVOURITES
--    User's favourite meal IDs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_id       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meal_id)
);

-- ─────────────────────────────────────────────
-- 6. DIET MEMBERS
--    Family members on personalised diet plans
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  age           INTEGER,
  gender        TEXT,
  height_cm     DECIMAL,
  weight_kg     DECIMAL,
  bmi           DECIMAL,
  bmi_category  TEXT,
  calorie_goal  INTEGER,
  plan_category TEXT,
  goal          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. FOLLOWED DOLU PLANS
--    Signature Dolu Buddy plans the user follows
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followed_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id       TEXT NOT NULL,          -- e.g. 'dolu1', 'dolu2'
  variant       INTEGER DEFAULT 0,      -- shuffle seed variant
  added_on      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. GROCERY DATA
--    Custom prices, remarks, checked items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_data (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  custom_prices JSONB DEFAULT '{}',     -- {item: price}
  remarks       JSONB DEFAULT '{}',     -- {item: remark}
  checked_items JSONB DEFAULT '{}',     -- {item: true/false}
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. QUOTATIONS
--    Grocery quotation requests to admin/shop
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month         INTEGER NOT NULL,
  year          INTEGER NOT NULL,
  items         JSONB NOT NULL,         -- grocery items list
  total_amount  DECIMAL,
  status        TEXT DEFAULT 'pending_admin',
  -- 'pending_admin' | 'admin_approved' | 'sent_to_shop'
  -- 'quotation_received' | 'user_approved' | 'completed' | 'rejected'
  shop_quote    DECIMAL,
  admin_notes   TEXT,
  shop_notes    TEXT,
  delivery_date DATE,
  delivery_time TEXT,
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 10. FEEDBACK
--     User feedback & suggestions to admin
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category      TEXT,
  rating        INTEGER,
  message       TEXT NOT NULL,
  status        TEXT DEFAULT 'new',     -- 'new' | 'read' | 'replied'
  admin_reply   TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. WEIGHT LOG
--     Daily weight tracking for diet members
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  diet_member_id UUID REFERENCES diet_members(id) ON DELETE CASCADE,
  weight_kg     DECIMAL NOT NULL,
  logged_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Each user sees only their own data
-- ═══════════════════════════════════════════════════════

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE followed_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log      ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this script is safely re-runnable
DROP POLICY IF EXISTS "Users can manage their own profile"   ON profiles;
DROP POLICY IF EXISTS "Users manage their family members"    ON family_members;
DROP POLICY IF EXISTS "Users manage their preferences"       ON preferences;
DROP POLICY IF EXISTS "Users manage their meal plans"        ON meal_plans;
DROP POLICY IF EXISTS "Users manage their favourites"        ON favourites;
DROP POLICY IF EXISTS "Users manage their diet members"      ON diet_members;
DROP POLICY IF EXISTS "Users manage their followed plans"    ON followed_plans;
DROP POLICY IF EXISTS "Users manage their grocery data"      ON grocery_data;
DROP POLICY IF EXISTS "Users manage their quotations"        ON quotations;
DROP POLICY IF EXISTS "Users submit feedback"                ON feedback;
DROP POLICY IF EXISTS "Users manage their weight log"        ON weight_log;

-- Profiles: own row only
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- Family members
CREATE POLICY "Users manage their family members"
  ON family_members FOR ALL USING (auth.uid() = user_id);

-- Preferences
CREATE POLICY "Users manage their preferences"
  ON preferences FOR ALL USING (auth.uid() = user_id);

-- Meal plans
CREATE POLICY "Users manage their meal plans"
  ON meal_plans FOR ALL USING (auth.uid() = user_id);

-- Favourites
CREATE POLICY "Users manage their favourites"
  ON favourites FOR ALL USING (auth.uid() = user_id);

-- Diet members
CREATE POLICY "Users manage their diet members"
  ON diet_members FOR ALL USING (auth.uid() = user_id);

-- Followed plans
CREATE POLICY "Users manage their followed plans"
  ON followed_plans FOR ALL USING (auth.uid() = user_id);

-- Grocery data
CREATE POLICY "Users manage their grocery data"
  ON grocery_data FOR ALL USING (auth.uid() = user_id);

-- Quotations: user sees own, admin sees all
CREATE POLICY "Users manage their quotations"
  ON quotations FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Feedback: user submits own, admin reads all
CREATE POLICY "Users submit feedback"
  ON feedback FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Weight log
CREATE POLICY "Users manage their weight log"
  ON weight_log FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- TRIGGER: auto-create profile on user signup
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO preferences (user_id)
  VALUES (NEW.id);

  INSERT INTO grocery_data (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

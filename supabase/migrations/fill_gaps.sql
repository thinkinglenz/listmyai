-- ─────────────────────────────────────────────────────────────────────────────
-- ListmyAI — Gap-fill migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Missing columns on ai_tools
ALTER TABLE ai_tools
  ADD COLUMN IF NOT EXISTS affiliate_url        text,
  ADD COLUMN IF NOT EXISTS listing_tier         text    DEFAULT 'free',      -- 'free' | 'featured' | 'sponsored'
  ADD COLUMN IF NOT EXISTS paddle_transaction_id text,
  ADD COLUMN IF NOT EXISTS featured_slot        integer,                     -- 1-10 for homepage carousel
  ADD COLUMN IF NOT EXISTS contact_email        text,
  ADD COLUMN IF NOT EXISTS claimed              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_id             uuid    REFERENCES auth.users(id);

-- 2. quiz_results — stores /api/find outputs for analytics
CREATE TABLE IF NOT EXISTS quiz_results (
  id              bigserial PRIMARY KEY,
  answers         jsonb     NOT NULL,
  recommendations jsonb     NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- Allow anonymous inserts (quiz is public, no auth required)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quiz_results_insert_anon"
  ON quiz_results FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "quiz_results_select_service"
  ON quiz_results FOR SELECT TO service_role USING (true);

-- 3. sponsor_slots — homepage / category banner placements
CREATE TABLE IF NOT EXISTS sponsor_slots (
  id           bigserial PRIMARY KEY,
  slot_key     text UNIQUE NOT NULL,               -- e.g. 'homepage_top', 'category_chatbot'
  tool_id      bigint REFERENCES ai_tools(id) ON DELETE SET NULL,
  title        text,
  description  text,
  image_url    text,
  cta_text     text,
  cta_url      text,
  active       boolean DEFAULT true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE sponsor_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "sponsor_slots_select_all"
  ON sponsor_slots FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "sponsor_slots_manage_service"
  ON sponsor_slots FOR ALL TO service_role USING (true);

-- 4. seo_articles — blog / programmatic SEO pages
CREATE TABLE IF NOT EXISTS seo_articles (
  id            bigserial PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  title         text        NOT NULL,
  excerpt       text,
  content       text,                              -- HTML body
  cover_image   text,
  author        text        DEFAULT 'ListmyAI Team',
  category      text,                              -- e.g. 'Guides', 'Comparisons', 'News'
  tags          text[]      DEFAULT '{}',
  status        text        DEFAULT 'draft',       -- 'draft' | 'published'
  reading_time  integer,                           -- minutes
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_articles_updated_at ON seo_articles;
CREATE TRIGGER seo_articles_updated_at
  BEFORE UPDATE ON seo_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Public can read published articles
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "seo_articles_select_published"
  ON seo_articles FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS "seo_articles_manage_service"
  ON seo_articles FOR ALL TO service_role USING (true);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS seo_articles_slug_idx ON seo_articles (slug);
CREATE INDEX IF NOT EXISTS seo_articles_status_published_at_idx ON seo_articles (status, published_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! You can verify with:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_tools' ORDER BY column_name;
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- ─────────────────────────────────────────────────────────────────────────────

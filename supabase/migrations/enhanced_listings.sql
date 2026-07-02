-- ─────────────────────────────────────────────────────────────────────────────
-- ListmyAI — Enhanced Listing Fields Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE ai_tools
  ADD COLUMN IF NOT EXISTS contact_name            text,
  ADD COLUMN IF NOT EXISTS company_description     text,
  ADD COLUMN IF NOT EXISTS video_url               text,
  ADD COLUMN IF NOT EXISTS demo_url                text,
  ADD COLUMN IF NOT EXISTS target_audience          text,
  ADD COLUMN IF NOT EXISTS team_size               text,
  ADD COLUMN IF NOT EXISTS integrations            text,
  ADD COLUMN IF NOT EXISTS contact_phone           text,
  ADD COLUMN IF NOT EXISTS facebook_url            text,
  ADD COLUMN IF NOT EXISTS instagram_url           text,
  ADD COLUMN IF NOT EXISTS tiktok_url              text,
  ADD COLUMN IF NOT EXISTS product_hunt_url        text,
  ADD COLUMN IF NOT EXISTS social_promotion_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS creatives               text[],
  ADD COLUMN IF NOT EXISTS brand_guidelines_url    text;

-- Update FTS index to include new searchable fields
DROP INDEX IF EXISTS ai_tools_fts;
CREATE INDEX ai_tools_fts ON public.ai_tools
  USING gin(to_tsvector('english',
    coalesce(name,'') || ' ' ||
    coalesce(tagline,'') || ' ' ||
    coalesce(description,'') || ' ' ||
    coalesce(company_name,'') || ' ' ||
    coalesce(target_audience,'') || ' ' ||
    coalesce(integrations,'')
  ));

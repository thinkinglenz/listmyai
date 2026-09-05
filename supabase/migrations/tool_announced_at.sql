-- ═══════════════════════════════════════════════════════════
--  Track which tools have already been announced on social
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Set when a tool is successfully posted to Facebook/Instagram. Without it,
-- deactivating and re-approving a listing would post it to followers again.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS announced_at timestamptz;

CREATE INDEX IF NOT EXISTS ai_tools_announced_at
  ON public.ai_tools(announced_at)
  WHERE announced_at IS NULL;

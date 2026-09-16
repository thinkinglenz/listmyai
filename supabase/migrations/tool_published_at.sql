-- ═══════════════════════════════════════════════════════════
--  Record when a listing actually went live
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- "Recently Added" sorted by created_at, which is when the listing was
-- submitted. A tool that waited three weeks in the pending queue therefore
-- appeared three weeks down the list the moment it was approved, and the
-- admin saw an approval that seemingly did nothing.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Existing live listings keep their current order.
UPDATE public.ai_tools
   SET published_at = created_at
 WHERE status = 'active' AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS ai_tools_published_at
  ON public.ai_tools(published_at DESC)
  WHERE status = 'active';

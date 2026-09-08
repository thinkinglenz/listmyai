-- ═══════════════════════════════════════════════════════════
--  Record every social post made about a listing
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Owners consent to promotion and then have no way of knowing whether anything
-- was posted. The announce path already receives a post id back from each
-- network and was discarding it.
CREATE TABLE IF NOT EXISTS public.tool_social_posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  network    text NOT NULL,                    -- facebook | instagram | twitter
  post_id    text,                             -- the network's own identifier
  post_url   text,                             -- permalink, where one is obtainable
  source     text NOT NULL DEFAULT 'approval', -- approval | spotlight | manual
  posted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_social_posts_tool
  ON public.tool_social_posts (tool_id, posted_at DESC);

ALTER TABLE public.tool_social_posts ENABLE ROW LEVEL SECURITY;

-- An owner may see the posts made about their own listing, and nobody else's.
DROP POLICY IF EXISTS "Owners read their tool posts" ON public.tool_social_posts;
CREATE POLICY "Owners read their tool posts" ON public.tool_social_posts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_tools t
    WHERE t.id = tool_id
      AND (t.claimed_by = auth.uid() OR t.submitted_by = auth.uid())
  ));

-- Writes come from the service role only.

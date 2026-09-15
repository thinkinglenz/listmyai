-- ═══════════════════════════════════════════════════════════
--  Instagram comment → DM automation log
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- One row per person per post. It stops a second comment from the same
-- person sending a second DM, and records what happened for the admin.
CREATE TABLE IF NOT EXISTS public.instagram_comment_dms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id   text NOT NULL UNIQUE,
  media_id     text NOT NULL,
  ig_user_id   text NOT NULL,          -- Instagram-scoped id of the commenter
  username     text,
  comment_text text,
  tool_id      uuid REFERENCES public.ai_tools(id) ON DELETE SET NULL,
  -- invited        : DM with the "Send me the link" button went out
  -- link_sent      : they follow us and got the link
  -- asked_to_follow: they tapped the button but do not follow yet
  -- no_tool        : could not tell which tool the post is about
  -- failed         : Instagram rejected the message (see error)
  status       text NOT NULL DEFAULT 'invited',
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, ig_user_id)
);

CREATE INDEX IF NOT EXISTS instagram_comment_dms_user
  ON public.instagram_comment_dms (ig_user_id, created_at DESC);

-- Written and read by the service role only.
ALTER TABLE public.instagram_comment_dms ENABLE ROW LEVEL SECURITY;

-- When a newly approved listing started its free turn in the homepage
-- spotlight. NULL = still waiting in the queue.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS spotlight_turn_at timestamptz;

CREATE INDEX IF NOT EXISTS ai_tools_spotlight_queue
  ON public.ai_tools(published_at)
  WHERE spotlight_turn_at IS NULL AND status = 'active';

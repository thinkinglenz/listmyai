-- Headline for a tool's Instagram creative, written once by the model.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS social_hook text;

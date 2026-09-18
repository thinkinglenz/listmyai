-- Anonymous interaction counts, e.g. how often visitors switch theme.
CREATE TABLE IF NOT EXISTS public.site_events (
  id         bigserial PRIMARY KEY,
  event      text NOT NULL,
  value      text,
  path       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_events_event_time ON public.site_events (event, created_at DESC);
-- Written and read by the service role only.
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

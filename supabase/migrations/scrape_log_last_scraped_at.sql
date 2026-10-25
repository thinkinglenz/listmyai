-- The daily scrape has been failing since it was written.
--
-- /api/cron/scrape selects and updates scrape_log.last_scraped_at, which was
-- never added to the table. Postgres answers "column does not exist", the
-- route returns 500 before scraping anything, and the job dies at 03:00 every
-- day — visible in the logs as 42703 errors timestamped 03:00:32.
--
-- The column is added rather than the code renamed to the existing
-- `scraped_at`, because the two mean different things: `scraped_at` defaults
-- to now() when the row is queued, so reusing it would make every newly added
-- source invisible to the queue for seven days. Nullable with no default, so
-- an unscraped source is NULL and gets picked up on the next run.

alter table public.scrape_log
  add column if not exists last_scraped_at timestamptz;

-- Backs the queue query: pending sources never scraped, or scraped over a
-- week ago.
create index if not exists scrape_log_queue_idx
  on public.scrape_log (status, last_scraped_at);

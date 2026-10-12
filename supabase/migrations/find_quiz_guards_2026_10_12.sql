-- ═══════════════════════════════════════════════════════════
--  Rate limit + cache for the /api/find quiz — 2026-10-12
--  Run in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════
--
-- /api/find is the only public endpoint that spends money: one Claude call
-- per request, with listings in the prompt. It shipped with no auth, no rate
-- limit and no cache, so anyone could loop it until the prepaid balance was
-- gone and every cron sharing that key stopped working.
--
-- Both guards hang off quiz_results, which the route already wrote to:
--   answers_hash  identical quizzes are served from cache and cost nothing
--   ip_hash       a hash, never an IP — this is abuse control, not analytics

alter table public.quiz_results
  add column if not exists answers_hash text,
  add column if not exists ip_hash      text,
  add column if not exists created_at   timestamptz not null default now();

create index if not exists quiz_results_answers_hash_idx
  on public.quiz_results (answers_hash, created_at desc);

create index if not exists quiz_results_ip_hash_idx
  on public.quiz_results (ip_hash, created_at desc);

select count(*) as rows, count(answers_hash) as hashed from public.quiz_results;

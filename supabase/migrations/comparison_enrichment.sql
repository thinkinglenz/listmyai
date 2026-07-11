-- Stores AI-generated enrichment for comparison pages (verdict, pros/cons, FAQs)
-- Generated on-demand, cached forever. Keyed by the comparison slug (e.g. "chatgpt-vs-claude").
create table if not exists public.comparison_enrichment (
  id              uuid primary key default gen_random_uuid(),
  comparison_slug text unique not null,  -- e.g., "chatgpt-vs-claude"
  tool_a_id       uuid not null references public.ai_tools(id) on delete cascade,
  tool_b_id       uuid not null references public.ai_tools(id) on delete cascade,

  -- AI-generated content
  verdict         text,                  -- 2-3 sentence recommendation
  verdict_html    text,                  -- formatted for display

  -- Pros and cons
  tool_a_pros     text[],                -- array of 3-4 strings
  tool_a_cons     text[],
  tool_b_pros     text[],
  tool_b_cons     text[],

  -- FAQs (array of {q, a} objects)
  faqs            jsonb,                 -- [{q: string, a: string}, ...]

  -- Metadata
  generated_at    timestamptz default now(),
  model_used      text default 'claude-haiku-4-5',  -- track which model generated this

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index comparison_enrichment_slug on public.comparison_enrichment(comparison_slug);
create index comparison_enrichment_tools on public.comparison_enrichment(tool_a_id, tool_b_id);

alter table public.comparison_enrichment enable row level security;

-- Anyone can read enrichment (it's public content)
drop policy if exists "public read" on public.comparison_enrichment;
create policy "public read"
  on public.comparison_enrichment for select
  using (true);

-- Only service role can write (auto-generated)
drop policy if exists "service role write" on public.comparison_enrichment;
create policy "service role write"
  on public.comparison_enrichment for insert
  using (true);

drop policy if exists "service role update" on public.comparison_enrichment;
create policy "service role update"
  on public.comparison_enrichment for update
  using (true);

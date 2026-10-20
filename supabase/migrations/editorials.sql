-- Editorials: schema + the first piece (NameStation).
--
-- Kept as a file because the first time round this existed only in a chat
-- message, and only half of it got run: the table was created and the article
-- never inserted, which is why /editorial sat empty.
--
-- Safe to re-run. The insert is ON CONFLICT DO NOTHING and binds tool_id by
-- slug rather than a literal uuid.

-- ═══════════════════════════════════════════════════════════
--  Editorials — 2026-10-20
--  Run in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.editorials (
  id            uuid primary key default gen_random_uuid(),
  tool_id       uuid references public.ai_tools(id) on delete cascade,
  slug          text unique not null,
  title         text not null,
  standfirst    text,
  body_md       text not null,
  sources       jsonb not null default '[]'::jsonb,
  coverage_note text,
  status        text not null default 'draft',   -- draft | published
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists editorials_published_idx
  on public.editorials (status, published_at desc);

alter table public.editorials enable row level security;

-- Readers see published pieces only. Writes are service-role, which bypasses
-- RLS: no policy for INSERT or UPDATE on purpose, so nothing client-side can
-- create or alter an editorial.
drop policy if exists "Public read published editorials" on public.editorials;
create policy "Public read published editorials"
  on public.editorials for select to anon, authenticated
  using (status = 'published');

-- ── The first editorial ──────────────────────────────────────

insert into public.editorials
  (tool_id, slug, title, standfirst, body_md, sources, coverage_note, status, published_at)
select
  t.id,
  'namestation',
  'NameStation: the domain-name generator that has outlived most of its competitors',
  'NameStation has been generating available domain names since 2012. What it does, how the name-contest model works, and what users have said about it over fourteen years.',
  $md$### Fourteen years is an unusual lifespan for a naming tool

Domain-name generators appear and vanish constantly. NameStation's own footer reads *"Since 2012 · 4.4M+ names created yearly"*, and that date is independently corroborated: the earliest third-party discussion of it on Hacker News dates to October 2011, followed by [New domain search techniques at NameStation](https://news.ycombinator.com/item?id=4638128) in October 2012.

That matters more than it sounds. A naming tool's value is partly its index of what is already taken, and that only accumulates with time.

### What it actually does

The product is a set of generators rather than a single search box. Alongside the general name generator it runs separate tools for compound words, made-up names, portmanteaus, keyword-led and one-word domains, plus a translator that works across languages, a bulk availability checker, and an all-TLD extension checker. Results are checked against live registry availability rather than returned as suggestions you then have to look up yourself.

There is also a Chrome extension, and three stated audiences: founders and startups, agencies and teams, and domain investors. That third one is unusual, and it tells you the tool is built for people running many searches rather than one.

### The contest model is the part people actually talk about

The feature that draws unprompted mentions is not the generator. It is **name contests** — you post a brief, and human contributors submit name ideas along with their available domains.

In a November 2012 thread, a commenter told someone stuck on naming: *"[You might also try running a contest at NameStation. They're cheap and you'll get hundreds of name ideas and their respective available domains](https://news.ycombinator.com/item?id=4781305)"*. Two years later, in a thread listing naming tools, another simply said *"[came here to recommend this site](https://news.ycombinator.com/item?id=7712338)"*.

Neither was the company posting. That is the distinction worth drawing: a tool recommended by third parties, in threads about something else, has crossed a line most never do.

### The criticism, which is also on the record

The record is not uniformly positive. In October 2012 a commenter argued the pricing did not hold up: *"[Your price point is far too high for the service it performs (and the competing tools)](https://news.ycombinator.com/item?id=4598306)"*. That was fourteen years ago and pricing has certainly changed since, but it is the only sustained criticism in the public record, and it concerns cost rather than whether the tool works.

### Who it suits

Someone naming one company once will get value from the free generators and may never need an account. The paid tiers are built for repetition — agencies naming client products, investors screening availability in bulk. If you are running a single search, the depth here is more than you need.$md$,
  $json$[
    {"label":"New domain search techniques at NameStation — Hacker News","url":"https://news.ycombinator.com/item?id=4638128","kind":"hacker-news","published":"2012-10-10"},
    {"label":"\"Came here to recommend this site\" — Hacker News","url":"https://news.ycombinator.com/item?id=7712338","kind":"hacker-news","published":"2014-05-07"},
    {"label":"On running a name contest — Hacker News","url":"https://news.ycombinator.com/item?id=4781305","kind":"hacker-news","published":"2012-11-13"},
    {"label":"Criticism of pricing — Hacker News","url":"https://news.ycombinator.com/item?id=4598306","kind":"hacker-news","published":"2012-10-01"}
  ]$json$::jsonb,
  'NameStation''s pricing page renders its tiers in the browser, so we could not capture specific figures; the listing records it as freemium. Most independent discussion dates from 2011–2015, describing the product''s early years rather than its current state. We found no independent coverage from the last five years.',
  'published',
  now()
from public.ai_tools t
where t.slug = 'namestation'
on conflict (slug) do nothing;

select slug, status, jsonb_array_length(sources) as sources, published_at
from public.editorials;

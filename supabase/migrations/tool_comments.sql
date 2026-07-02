-- Tool comments — public comments on tool pages, moderated before display.
-- Run this in the Supabase SQL editor.

create table if not exists public.tool_comments (
  id              uuid primary key default gen_random_uuid(),
  tool_id         uuid not null references public.ai_tools(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  author_name     text not null,
  author_email    text,
  body            text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderator_note  text,
  moderated_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists tool_comments_tool_status_idx on public.tool_comments (tool_id, status, created_at desc);
create index if not exists tool_comments_status_idx on public.tool_comments (status, created_at desc);

alter table public.tool_comments enable row level security;

-- Public can read approved comments only; writes go through the API (service role).
drop policy if exists "approved tool comments are publicly readable" on public.tool_comments;
create policy "approved tool comments are publicly readable"
  on public.tool_comments for select
  using (status = 'approved');

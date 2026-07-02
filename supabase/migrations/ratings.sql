-- Ratings table — one rating per user per tool.
-- Run this in the Supabase SQL editor.

create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  tool_id    uuid not null references public.ai_tools(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tool_id)
);

create index if not exists ratings_tool_id_idx on public.ratings (tool_id);

-- Writes go through the API with the service role key (bypasses RLS).
-- Public may read ratings.
alter table public.ratings enable row level security;

drop policy if exists "ratings are publicly readable" on public.ratings;
create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

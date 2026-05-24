-- ─────────────────────────────────────────────────────────────────────────────
-- Blog system: posts, comments, plus indexes & RLS.
-- Run this once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── blog_posts ─────────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  title             text not null,
  excerpt           text,
  body_md           text not null,        -- markdown source
  hero_image_url    text,
  hero_image_alt    text,
  video_url         text,                 -- optional embed (e.g. YouTube)
  faqs              jsonb default '[]'::jsonb,    -- [{q,a}]
  tags              text[] default '{}',
  related_tool_ids  uuid[] default '{}',
  external_refs     jsonb default '[]'::jsonb,    -- [{label,url}]
  sponsorship       jsonb,                -- {name, logo_url, cta_url, blurb, image_url, video_url}
  meta_title        text,
  meta_description  text,
  status            text not null default 'published' check (status in ('draft','published','archived')),
  is_auto_generated boolean not null default false,
  source_topic      text,
  view_count        integer not null default 0,
  published_at      timestamptz default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on blog_posts (status, published_at desc);
create index if not exists blog_posts_slug_idx on blog_posts (slug);
create index if not exists blog_posts_tags_gin on blog_posts using gin (tags);

-- ── blog_comments ──────────────────────────────────────────────────────────
create table if not exists blog_comments (
  id              uuid primary key default uuid_generate_v4(),
  post_id         uuid not null references blog_posts(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  author_name     text not null,
  author_email    text,
  body            text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderator_note  text,
  moderated_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists blog_comments_post_status_idx on blog_comments (post_id, status, created_at desc);
create index if not exists blog_comments_status_idx on blog_comments (status, created_at desc);

-- ── Row-level security ─────────────────────────────────────────────────────
alter table blog_posts enable row level security;
alter table blog_comments enable row level security;

-- Public can read published posts only.
drop policy if exists blog_posts_public_read on blog_posts;
create policy blog_posts_public_read on blog_posts
  for select using (status = 'published');

-- Public can read approved comments only.
drop policy if exists blog_comments_public_read on blog_comments;
create policy blog_comments_public_read on blog_comments
  for select using (status = 'approved');

-- Authenticated users can insert their own pending comments.
drop policy if exists blog_comments_authed_insert on blog_comments;
create policy blog_comments_authed_insert on blog_comments
  for insert with check (auth.uid() = user_id and status = 'pending');

-- Service role bypasses RLS automatically; admin moderation uses service role.

-- ── Helper: increment view count atomically ────────────────────────────────
create or replace function increment_blog_view(p_slug text) returns void as $$
  update blog_posts set view_count = view_count + 1 where slug = p_slug;
$$ language sql security definer;

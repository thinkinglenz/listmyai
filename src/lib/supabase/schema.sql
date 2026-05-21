-- ═══════════════════════════════════════════════════════════
--  ListmyAI — Supabase Database Schema
--  Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search

-- ─── Categories ──────────────────────────────────────────────────────────────
create table public.categories (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,          -- lucide icon name
  color       text,          -- hex color for category chip
  count       int default 0  -- denormalised count, updated by trigger
);

insert into public.categories (slug, name, icon, color) values
  ('chatbot',        'Chatbot / Assistant',     'MessageSquare', '#6366f1'),
  ('image-gen',      'Image Generation',        'Image',         '#ec4899'),
  ('video-gen',      'Video Generation',        'Video',         '#f97316'),
  ('audio-gen',      'Audio & Music',           'Music',         '#8b5cf6'),
  ('code',           'Code Assistant',          'Code2',         '#06b6d4'),
  ('writing',        'Writing & Copy',          'PenLine',       '#10b981'),
  ('seo',            'SEO & Marketing',         'TrendingUp',    '#f59e0b'),
  ('data',           'Data & Analytics',        'BarChart3',     '#3b82f6'),
  ('voice',          'Voice & Speech',          'Mic',           '#14b8a6'),
  ('search',         'AI Search',               'Search',        '#84cc16'),
  ('automation',     'Automation',              'Zap',           '#a855f7'),
  ('design',         'Design & Creative',       'Palette',       '#f43f5e'),
  ('research',       'Research',                'BookOpen',      '#64748b'),
  ('education',      'Education',               'GraduationCap', '#0ea5e9'),
  ('healthcare',     'Healthcare',              'Heart',         '#ef4444'),
  ('finance',        'Finance & Legal',         'Scale',         '#78716c'),
  ('other',          'Other',                   'Sparkles',      '#94a3b8');

-- ─── AI Tools (main listings table) ─────────────────────────────────────────
create table public.ai_tools (
  id               uuid primary key default uuid_generate_v4(),
  slug             text unique not null,
  name             text not null,
  tagline          text,
  description      text,
  website          text unique not null,
  logo_url         text,
  cover_url        text,
  screenshots      text[],              -- array of image URLs

  -- Classification
  category_id      int references public.categories(id),
  tags             text[],

  -- Pricing
  pricing_model    text check (pricing_model in ('free','freemium','free_trial','subscription','pay_per_use','one_time','enterprise')),
  starting_price   text,
  pricing_url      text,
  has_free_trial   boolean default false,
  trial_duration   text,

  -- Active promo (denormalised for fast display)
  promo_code       text,
  promo_desc       text,

  -- Technical
  has_api          boolean default false,
  api_docs_url     text,
  no_code          boolean default false,
  platforms        text[],              -- web, ios, android, mac, windows, linux, api, chrome, vscode
  gdpr_compliant   boolean default false,

  -- Company
  company_name     text,
  founded_year     text,
  hq_location      text,
  use_cases        text,
  alternatives     text[],

  -- Contact / social
  contact_email    text,
  support_url      text,
  twitter_url      text,
  linkedin_url     text,
  github_url       text,
  discord_url      text,
  youtube_url      text,

  -- Listing metadata
  status           text default 'auto' check (status in ('auto','claimed','verified','pending','rejected')),
  is_featured      boolean default false,
  is_sponsored     boolean default false,
  owner_id         uuid references auth.users(id),
  claimed          boolean default false,
  claimed_by       uuid references auth.users(id),
  submitted_by     uuid references auth.users(id),

  -- Free trial period (the listing's own free listing period, not the AI tool's trial)
  listing_free_until  date,
  listing_plan        text default 'free_6mo',

  -- Stats
  view_count       int default 0,
  click_count      int default 0,
  upvotes          int default 0,
  rating_avg       numeric(3,2) default 0,
  rating_count     int default 0,

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Full-text search index
create index ai_tools_fts on public.ai_tools
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(description,'')));

create index ai_tools_category on public.ai_tools(category_id);
create index ai_tools_status on public.ai_tools(status);
create index ai_tools_featured on public.ai_tools(is_featured);

-- ─── Promotions ──────────────────────────────────────────────────────────────
create table public.promotions (
  id           uuid primary key default uuid_generate_v4(),
  tool_id      uuid references public.ai_tools(id) on delete cascade,
  promo_type   text check (promo_type in ('trial','coupon','discount','free_tier')),
  title        text not null,
  description  text,
  promo_code   text,
  discount_pct smallint default 0,
  trial_days   smallint default 0,
  valid_from   date,
  valid_until  date,
  external_url text,
  is_verified  boolean default false,
  created_at   timestamptz default now()
);

create index promotions_tool on public.promotions(tool_id);
create index promotions_verified on public.promotions(is_verified);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
create table public.reviews (
  id        uuid primary key default uuid_generate_v4(),
  tool_id   uuid references public.ai_tools(id) on delete cascade,
  user_id   uuid references auth.users(id),
  rating    smallint check (rating between 1 and 5),
  body      text,
  approved  boolean default false,
  created_at timestamptz default now()
);

-- ─── Upvotes ─────────────────────────────────────────────────────────────────
create table public.upvotes (
  user_id  uuid references auth.users(id),
  tool_id  uuid references public.ai_tools(id) on delete cascade,
  primary key (user_id, tool_id)
);

-- ─── Scrape log ──────────────────────────────────────────────────────────────
create table public.scrape_log (
  id         bigserial primary key,
  source_url text not null,
  ai_name    text,
  status     text default 'pending' check (status in ('pending','imported','skipped','failed')),
  error_msg  text,
  scraped_at timestamptz default now()
);

-- ─── Listing free trials ──────────────────────────────────────────────────────
create table public.listing_trials (
  id         bigserial primary key,
  tool_id    uuid references public.ai_tools(id) on delete cascade,
  owner_id   uuid references auth.users(id),
  start_date date not null,
  end_date   date not null,
  status     text default 'active' check (status in ('active','expired','converted')),
  created_at timestamptz default now()
);

-- ─── DMCA requests ───────────────────────────────────────────────────────────
create table public.dmca_requests (
  id          bigserial primary key,
  requester   text not null,
  email       text not null,
  company     text,
  listing_url text not null,
  req_type    text,
  description text,
  status      text default 'pending' check (status in ('pending','resolved','rejected')),
  created_at  timestamptz default now()
);

-- ─── Claim Requests ─────────────────────────────────────────────────────────
create table public.claim_requests (
  id               uuid primary key default uuid_generate_v4(),
  tool_id          uuid references public.ai_tools(id) on delete cascade,
  claimant_email   text not null,
  claimant_name    text not null,
  claimant_user_id uuid references auth.users(id),
  claim_type       text default 'manual' check (claim_type in ('domain-match', 'manual')),
  status           text default 'pending' check (status in ('pending', 'pending_verification', 'approved', 'rejected', 'expired')),
  verification_token text,
  token_expires_at   timestamptz,
  note             text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index claim_requests_tool on public.claim_requests(tool_id);
create index claim_requests_status on public.claim_requests(status);

-- ─── Comparison Logs ────────────────────────────────────────────────────────
create table public.comparison_logs (
  id             bigserial primary key,
  tool_a_slug    text not null,
  tool_b_slug    text not null,
  tool_a_name    text,
  tool_b_name    text,
  ip_hash        text,
  use_case       text,
  cache_hit      boolean default false,
  tokens_input   int default 0,
  tokens_output  int default 0,
  rate_limited   boolean default false,
  model          text default 'data-driven',
  created_at     timestamptz default now()
);

-- ─── Profiles (extends auth.users) ──────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  company      text,
  website      text,
  bio          text,
  created_at   timestamptz default now()
);

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Auto-update updated_at on ai_tools
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger ai_tools_updated_at before update on public.ai_tools
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update category count on tool insert/delete
create or replace function public.update_category_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.categories set count = count + 1 where id = new.category_id;
  elsif TG_OP = 'DELETE' then
    update public.categories set count = count - 1 where id = old.category_id;
  end if;
  return null;
end;
$$;
create trigger tool_category_count after insert or delete on public.ai_tools
  for each row execute procedure public.update_category_count();

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.ai_tools enable row level security;
alter table public.promotions enable row level security;
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;

-- Public can read published tools
create policy "Public read tools" on public.ai_tools
  for select using (status != 'rejected');

-- Owner can update their tool
create policy "Owner update tool" on public.ai_tools
  for update using (auth.uid() = owner_id);

-- Anyone can read verified promotions
create policy "Public read promos" on public.promotions
  for select using (is_verified = true);

-- Authenticated users can insert promos
create policy "Auth insert promo" on public.promotions
  for insert with check (auth.uid() is not null);

-- Public can read approved reviews
create policy "Public read reviews" on public.reviews
  for select using (approved = true);

-- Auth users can insert reviews
create policy "Auth insert review" on public.reviews
  for insert with check (auth.uid() is not null);

-- Profiles readable by all
create policy "Public read profiles" on public.profiles
  for select using (true);

-- Users update own profile
create policy "Own profile update" on public.profiles
  for update using (auth.uid() = id);

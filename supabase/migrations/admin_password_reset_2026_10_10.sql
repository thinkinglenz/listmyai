-- ═══════════════════════════════════════════════════════════
--  Admin password moves into the database — 2026-10-10
--  Run in the Supabase SQL editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════
--
-- The admin password lived only in the ADMIN_PASSWORD environment variable,
-- so the application could not change it and a "forgot password" link was
-- impossible to build. Losing the value locked the owner out until someone
-- edited Vercel by hand, which is exactly what happened.
--
-- ADMIN_PASSWORD still works while password_hash is null, so deploying the
-- code alongside this changes nothing until a password is actually set.

create table if not exists public.admin_auth (
  -- A boolean primary key defaulting to true, with a check that it IS true,
  -- allows exactly one row: there can never be two admin passwords.
  id            boolean primary key default true check (id),
  password_hash text,          -- scrypt:<salt>:<hex>, never the password
  reset_hash    text,          -- sha256 of the emailed token, never the token
  reset_expires timestamptz,
  updated_at    timestamptz not null default now()
);

insert into public.admin_auth (id) values (true) on conflict (id) do nothing;

-- RLS on with no policies: anon and authenticated can neither read nor write.
-- Only the service role, which bypasses RLS, touches this table.
alter table public.admin_auth enable row level security;

select id, password_hash is not null as has_password from public.admin_auth;

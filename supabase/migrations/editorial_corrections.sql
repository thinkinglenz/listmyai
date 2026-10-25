-- Corrections sent in against a published editorial.
--
-- The editorial pages state that the companies covered cannot edit them but
-- that corrections are welcome. This table is what makes that true: the form
-- files a message, a human reads it in /admin/editorials, and the page is
-- changed or not. Nothing here edits an editorial.

create table if not exists public.editorial_corrections (
  id            uuid primary key default gen_random_uuid(),
  editorial_id  uuid references public.editorials(id) on delete cascade,
  editorial_slug text not null,
  email         text not null,
  message       text not null,
  status        text not null default 'open',   -- open | resolved
  created_at    timestamptz not null default now()
);

create index if not exists editorial_corrections_open_idx
  on public.editorial_corrections (status, created_at desc);

-- Backs the "same sender, same piece, last 10 minutes" check in the API.
create index if not exists editorial_corrections_dedupe_idx
  on public.editorial_corrections (editorial_slug, email, created_at desc);

alter table public.editorial_corrections enable row level security;

-- No policies, deliberately: only the service role reaches this table. Rows
-- hold an email address and somebody's complaint about a third party, so
-- nothing holding the public key should be able to read them, and nothing
-- client-side should be able to write them either.

-- Editorials: search keywords and a hero image per piece.
-- Safe to re-run. Until this is run, new drafts are still saved, just
-- without keywords or an image.
alter table public.editorials add column if not exists keywords text[] not null default '{}';
alter table public.editorials add column if not exists hero_image text;

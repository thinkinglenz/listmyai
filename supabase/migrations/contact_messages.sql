-- Contact messages table for storing inquiries from /contact form
create table if not exists public.contact_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  sender_email    text not null,
  sender_name     text not null,
  package_type    text,
  message         text not null,
  status          text default 'new' check (status in ('new', 'read', 'replied')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists contact_messages_user_id_idx on public.contact_messages(user_id);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;

-- Public can only read their own messages
drop policy if exists "users can read own contact messages" on public.contact_messages;
create policy "users can read own contact messages"
  on public.contact_messages for select
  using (user_id = auth.uid());

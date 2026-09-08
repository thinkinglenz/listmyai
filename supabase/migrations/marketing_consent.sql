-- ═══════════════════════════════════════════════════════════
--  Marketing contacts, consent records, suppression, notifications
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Marketing contacts ──────────────────────────────────────
-- GDPR Art.7(1) requires being able to DEMONSTRATE consent, so the exact
-- wording shown, the moment, the source and the IP are all stored — not just
-- a boolean.
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL,
  name               text,
  phone              text,                    -- optional by design
  consent_marketing  boolean NOT NULL DEFAULT false,
  consent_text       text,                    -- verbatim wording at opt-in
  consent_at         timestamptz,
  consent_ip         text,
  consent_source     text,                    -- 'newsletter' | 'signup' | 'admin'
  unsubscribe_token  text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  unsubscribed_at    timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- One row per address; re-subscribing updates the existing record.
CREATE UNIQUE INDEX IF NOT EXISTS marketing_contacts_email
  ON public.marketing_contacts (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS marketing_contacts_token
  ON public.marketing_contacts (unsubscribe_token);

-- ── Suppression list ────────────────────────────────────────
-- Deliberately separate from contacts: if a contact row is deleted under a
-- right-to-erasure request, the suppression must survive, or the same address
-- could be re-added and emailed again.
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email       text PRIMARY KEY,
  reason      text NOT NULL DEFAULT 'unsubscribed',  -- unsubscribed|bounced|complaint|manual
  created_at  timestamptz DEFAULT now()
);

-- ── In-app notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON public.notifications (user_id, created_at DESC);

-- ── Row level security ──────────────────────────────────────
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- No policies for contacts or suppressions: the service role bypasses RLS, and
-- with RLS on and no policy, the public anon key can read neither. An email
-- list is exactly the sort of table that must never be publicly readable.

-- A signed-in user may read and dismiss their own notifications.
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

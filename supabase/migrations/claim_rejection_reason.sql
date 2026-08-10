-- ═══════════════════════════════════════════════════════════
--  Claim rejections: store why, and let the claimant see it
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Reason shown to the claimant on their dashboard and sent in the email.
ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- The original policy was:
--   CREATE POLICY "Service role full access claims" FOR ALL USING (true)
-- A policy with no role restriction applies to every role, so `anon` could
-- read every row — exposing all claimant names and email addresses to anyone
-- holding the public key. Replace it with explicit ones.
DROP POLICY IF EXISTS "Service role full access claims" ON public.claim_requests;

-- The service role bypasses RLS entirely, so admin routes keep working and
-- need no policy of their own.

-- A signed-in claimant may read their own requests (and nobody else's), which
-- is what the dashboard needs to show a rejection and its reason.
DROP POLICY IF EXISTS "Claimants read own requests" ON public.claim_requests;
CREATE POLICY "Claimants read own requests" ON public.claim_requests
  FOR SELECT
  TO authenticated
  USING (
    claimant_user_id = auth.uid()
    OR claimant_email = (auth.jwt() ->> 'email')
  );

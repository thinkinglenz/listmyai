-- ═══════════════════════════════════════════════════════════
--  Security hardening — 2026-09-22
--  Run in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════
--
-- Background: a policy with no `TO <role>` clause applies to EVERY role,
-- including `anon` (anyone holding the public key in the site's JS). Several
-- policies were *named* "service role" but not restricted to it. The service
-- role bypasses RLS entirely, so it never needs a policy of its own.

-- 1. Tool owners could update ANY column of their own ai_tools row straight
--    through the Supabase API — including is_featured, is_sponsored,
--    is_verified, listing_plan and status, i.e. give themselves paid
--    placement for free. Every legitimate owner edit already goes through
--    /api/tools/update (server-side, field allow-list), and no browser code
--    writes ai_tools directly, so the policy can simply go.
DROP POLICY IF EXISTS "Owner update tool" ON public.ai_tools;

-- 2. comparison_logs: "Service role full access" was open to anon for
--    read, insert, update and delete. Only server routes (service role) use it.
DROP POLICY IF EXISTS "Service role full access comparison_logs" ON public.comparison_logs;

-- ─── Verify ────────────────────────────────────────────────
-- Expect: no row for ai_tools with cmd UPDATE/ALL, and no row at all for
-- comparison_logs. Any policy listed with roles = {public} and cmd <> SELECT
-- deserves a second look.
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename IN ('ai_tools', 'comparison_logs') OR (roles = '{public}' AND cmd <> 'SELECT'))
ORDER BY tablename, policyname;

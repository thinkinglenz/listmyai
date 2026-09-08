-- ═══════════════════════════════════════════════════════════
--  Homepage spotlight: 24-hour slot, outbiddable
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.spotlight_bids (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       uuid NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Cents, never floats. Money in floating point eventually produces a bid of
  -- 1.0000000000000002 dollars.
  amount_cents  integer NOT NULL CHECK (amount_cents >= 100),

  starts_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  outbid_at     timestamptz,              -- set when a higher bid takes the slot

  impressions   integer NOT NULL DEFAULT 0,
  clicks        integer NOT NULL DEFAULT 0,

  -- No gateway yet. Recorded explicitly so a real payment can never be
  -- confused with a mocked one once Stripe is wired in.
  is_mock_payment boolean NOT NULL DEFAULT true,
  payment_ref   text,

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spotlight_bids_active
  ON public.spotlight_bids (expires_at DESC)
  WHERE outbid_at IS NULL;

CREATE INDEX IF NOT EXISTS spotlight_bids_user ON public.spotlight_bids (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS spotlight_bids_tool ON public.spotlight_bids (tool_id, created_at DESC);

-- At most one live holder at any moment.
--
-- This cannot be a partial unique index, because the condition depends on
-- now() and Postgres requires index predicates to be IMMUTABLE. Instead the
-- whole read-validate-insert runs inside one function under an advisory lock,
-- so two bids arriving at the same instant are serialised and only one wins.
CREATE OR REPLACE FUNCTION public.place_spotlight_bid(
  p_tool_id      uuid,
  p_user_id      uuid,
  p_amount_cents integer,
  p_payment_ref  text
)
RETURNS public.spotlight_bids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current public.spotlight_bids;
  v_new     public.spotlight_bids;
BEGIN
  -- Serialises every bid for the whole auction; released at transaction end.
  PERFORM pg_advisory_xact_lock(hashtext('listmyai_spotlight'));

  SELECT * INTO v_current
  FROM public.spotlight_bids
  WHERE outbid_at IS NULL AND expires_at > now()
  ORDER BY amount_cents DESC, created_at DESC
  LIMIT 1;

  -- Flat price, so there is no outbidding: whoever claims a free slot holds it
  -- for the full 24 hours and the next person waits.
  IF FOUND THEN
    RAISE EXCEPTION 'SLOT_HELD:%', to_char(v_current.expires_at, 'YYYY-MM-DD"T"HH24:MI:SSOF');
  END IF;

  INSERT INTO public.spotlight_bids (tool_id, user_id, amount_cents, expires_at, payment_ref)
  VALUES (p_tool_id, p_user_id, p_amount_cents, now() + interval '24 hours', p_payment_ref)
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$;

ALTER TABLE public.spotlight_bids ENABLE ROW LEVEL SECURITY;

-- Anyone may see who currently holds the slot; that is public on the homepage.
DROP POLICY IF EXISTS "Anyone reads spotlight bids" ON public.spotlight_bids;
CREATE POLICY "Anyone reads spotlight bids" ON public.spotlight_bids
  FOR SELECT USING (true);

-- Writes go through the service role only, so a bid cannot be forged from the
-- browser with the public key.

-- Atomic counter bump. A read-modify-write from the app would lose increments
-- whenever two visitors land at the same moment.
CREATE OR REPLACE FUNCTION public.increment_spotlight_metric(
  p_bid_id uuid,
  p_column text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Guarded rather than interpolated: p_column reaches SQL, so only these two
  -- names are ever allowed through.
  IF p_column = 'impressions' THEN
    UPDATE public.spotlight_bids SET impressions = impressions + 1 WHERE id = p_bid_id;
  ELSIF p_column = 'clicks' THEN
    UPDATE public.spotlight_bids SET clicks = clicks + 1 WHERE id = p_bid_id;
  END IF;
END;
$$;

-- ── Flat-price update ───────────────────────────────────────────────────────
-- Re-run this block on an existing database to switch from outbidding to a
-- fixed price. Safe to run more than once.
CREATE OR REPLACE FUNCTION public.place_spotlight_bid(
  p_tool_id      uuid,
  p_user_id      uuid,
  p_amount_cents integer,
  p_payment_ref  text
)
RETURNS public.spotlight_bids
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current public.spotlight_bids;
  v_new     public.spotlight_bids;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('listmyai_spotlight'));

  SELECT * INTO v_current
  FROM public.spotlight_bids
  WHERE outbid_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'SLOT_HELD:%', to_char(v_current.expires_at, 'YYYY-MM-DD"T"HH24:MI:SSOF');
  END IF;

  INSERT INTO public.spotlight_bids (tool_id, user_id, amount_cents, expires_at, payment_ref)
  VALUES (p_tool_id, p_user_id, p_amount_cents, now() + interval '24 hours', p_payment_ref)
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$;

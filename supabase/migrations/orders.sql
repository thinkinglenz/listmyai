-- ═══════════════════════════════════════════════════════════
--  Paid launch packages
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       uuid REFERENCES public.ai_tools(id) ON DELETE SET NULL,
  user_id       uuid,
  email         text,
  package       text NOT NULL,
  amount_cents  integer NOT NULL,
  currency      text NOT NULL DEFAULT 'USD',
  provider      text NOT NULL DEFAULT 'lemonsqueezy',
  -- The provider's own order id. Unique, so a webhook Meta or Lemon Squeezy
  -- retries cannot deliver or charge the same purchase twice.
  provider_ref  text NOT NULL,
  status        text NOT NULL DEFAULT 'paid',   -- paid | delivered | failed | refunded
  delivered_at  timestamptz,
  delivery_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

CREATE INDEX IF NOT EXISTS orders_tool ON public.orders (tool_id, created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- An owner may see their own orders; everything else is service-role only.
DROP POLICY IF EXISTS "Owners read their orders" ON public.orders;
CREATE POLICY "Owners read their orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- How long a listing keeps its Featured badge. NULL = not featured.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS ai_tools_featured_until
  ON public.ai_tools (featured_until DESC)
  WHERE featured_until IS NOT NULL;

-- Written work a purchase owes the buyer: an article, or a hands-on review.
-- Queued rather than auto-published; a sponsored review needs a human to use
-- the tool first, and every piece is labelled as sponsored when it goes live.
CREATE TABLE IF NOT EXISTS public.content_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  kind       text NOT NULL,                  -- article | review
  status     text NOT NULL DEFAULT 'pending', -- pending | writing | published
  blog_slug  text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_requests_status ON public.content_requests (status, created_at);
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;

-- How long a promo code stays on the Deals page.
ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS deal_featured_until timestamptz;

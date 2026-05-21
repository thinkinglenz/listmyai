-- ═══════════════════════════════════════════════════════════
--  Migration: Add claim_requests, comparison_logs tables
--  and claimed/claimed_by columns on ai_tools
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Add missing columns to ai_tools (safe: IF NOT EXISTS via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'claimed') THEN
    ALTER TABLE public.ai_tools ADD COLUMN claimed boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'claimed_by') THEN
    ALTER TABLE public.ai_tools ADD COLUMN claimed_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'submitted_by') THEN
    ALTER TABLE public.ai_tools ADD COLUMN submitted_by uuid REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'is_verified') THEN
    ALTER TABLE public.ai_tools ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
  -- Contact / social columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'contact_email') THEN
    ALTER TABLE public.ai_tools ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'support_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN support_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'twitter_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN twitter_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'linkedin_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN linkedin_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'github_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN github_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'discord_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN discord_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tools' AND column_name = 'youtube_url') THEN
    ALTER TABLE public.ai_tools ADD COLUMN youtube_url text;
  END IF;
END $$;

-- Claim Requests table
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id          uuid REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  claimant_email   text NOT NULL,
  claimant_name    text NOT NULL,
  claimant_user_id uuid REFERENCES auth.users(id),
  claim_type       text DEFAULT 'manual' CHECK (claim_type IN ('domain-match', 'manual')),
  status           text DEFAULT 'pending' CHECK (status IN ('pending', 'pending_verification', 'approved', 'rejected', 'expired')),
  verification_token text,
  token_expires_at   timestamptz,
  note             text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS claim_requests_tool ON public.claim_requests(tool_id);
CREATE INDEX IF NOT EXISTS claim_requests_status ON public.claim_requests(status);

-- RLS for claim_requests
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access claims" ON public.claim_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Comparison Logs table
CREATE TABLE IF NOT EXISTS public.comparison_logs (
  id             bigserial PRIMARY KEY,
  tool_a_slug    text NOT NULL,
  tool_b_slug    text NOT NULL,
  tool_a_name    text,
  tool_b_name    text,
  ip_hash        text,
  use_case       text,
  cache_hit      boolean DEFAULT false,
  tokens_input   int DEFAULT 0,
  tokens_output  int DEFAULT 0,
  rate_limited   boolean DEFAULT false,
  model          text DEFAULT 'data-driven',
  created_at     timestamptz DEFAULT now()
);

-- RLS for comparison_logs
ALTER TABLE public.comparison_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access comparison_logs" ON public.comparison_logs
  FOR ALL USING (true) WITH CHECK (true);

// Counts one impression for the live spotlight bid.
//
// Called from the browser rather than incremented during render, because the
// homepage is cached — a server-side counter would record cache builds, not
// people. Counted once per browser session so a refresh does not inflate it.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOTS = /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headless/i

export async function POST(req: NextRequest) {
  if (BOTS.test(req.headers.get('user-agent') ?? '')) {
    return NextResponse.json({ ok: true, counted: false })
  }

  const { bidId, kind } = await req.json().catch(() => ({}))
  if (!bidId) return NextResponse.json({ ok: true, counted: false })

  const column = kind === 'click' ? 'clicks' : 'impressions'
  const { error } = await supabase.rpc('increment_spotlight_metric', {
    p_bid_id: bidId,
    p_column: column,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, counted: true })
}

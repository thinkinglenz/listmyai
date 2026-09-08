// Per-claim and per-bidder breakdown of the spotlight.
//
// The summary answers "how much activity"; this answers "who, how often, and
// did it work" — which is what decides whether the placement is worth selling.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const { data, error } = await supabase
    .from('spotlight_bids')
    .select('id, user_id, amount_cents, impressions, clicks, starts_at, expires_at, outbid_at, ai_tools(name, slug)')
    .order('starts_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ claims: [], bidders: [], unavailable: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  // Emails come from auth, one lookup per distinct bidder rather than per row.
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))
  const emails = new Map<string, string>()
  await Promise.all(userIds.map(async id => {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(id)
      if (u?.user?.email) emails.set(id, u.user.email)
    } catch { /* a deleted account simply has no email to show */ }
  }))

  const now = Date.now()
  const claims = rows.map(r => {
    const tool = Array.isArray(r.ai_tools) ? r.ai_tools[0] : r.ai_tools
    return {
      id: r.id,
      toolName: tool?.name ?? 'Unknown',
      toolSlug: tool?.slug ?? '',
      email: r.user_id ? emails.get(r.user_id) ?? null : null,
      amountCents: r.amount_cents,
      impressions: r.impressions,
      clicks: r.clicks,
      startsAt: r.starts_at,
      status: r.outbid_at ? 'taken over'
        : new Date(r.expires_at).getTime() > now ? 'live' : 'finished',
    }
  })

  // Per-bidder rollup: how many times each has taken the spot, and how it did.
  const byBidder = new Map<string, { email: string; claims: number; impressions: number; clicks: number; cents: number }>()
  for (const c of claims) {
    const key = c.email ?? 'unknown'
    const prev = byBidder.get(key) ?? { email: key, claims: 0, impressions: 0, clicks: 0, cents: 0 }
    byBidder.set(key, {
      email: key,
      claims: prev.claims + 1,
      impressions: prev.impressions + c.impressions,
      clicks: prev.clicks + c.clicks,
      cents: prev.cents + c.amountCents,
    })
  }

  return NextResponse.json({
    claims,
    bidders: Array.from(byBidder.values()).sort((a, b) => b.claims - a.claims),
  })
}

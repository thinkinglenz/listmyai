// Per-claim and per-bidder breakdown of the spotlight.
//
// The summary answers "how much activity"; this answers "who, how often, and
// did it work" — which is what decides whether the placement is worth selling.
//
// Paged at the query, not in the browser. The page used to pull 200 joined
// rows and then run one auth.admin.getUserById call PER DISTINCT BIDDER to
// turn user ids into emails. That lookup is a separate network round trip
// each, so the page got slower in proportion to how well the product was
// selling — the worst possible direction. Now only the rows actually on
// screen are fetched, and only the ids visible on screen are resolved.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { pageSpec, pageSlice } from '@/lib/paginate'

export const dynamic = 'force-dynamic'

// The rollup has to read every bid to be a true total, so it is bounded.
// Beyond this the "who has taken the spot" figures would silently become a
// partial sum, which is worse than refusing to grow.
const ROLLUP_CEILING = 5_000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Rollup { userId: string | null; claims: number; impressions: number; clicks: number; cents: number }

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const q = req.nextUrl.searchParams
  const perPageParam = q.get('perPage')

  // ── The rollup: every bid, but only the four columns it needs and no join.
  const { data: lean, error: leanErr } = await supabase
    .from('spotlight_bids')
    .select('user_id, amount_cents, impressions, clicks')
    .limit(ROLLUP_CEILING)

  if (leanErr) return NextResponse.json({ claims: [], bidders: [], unavailable: true })

  const byUser = new Map<string, Rollup>()
  for (const r of (lean ?? []) as { user_id: string | null; amount_cents: number; impressions: number; clicks: number }[]) {
    const key = r.user_id ?? 'unknown'
    const prev = byUser.get(key) ?? { userId: r.user_id, claims: 0, impressions: 0, clicks: 0, cents: 0 }
    byUser.set(key, {
      userId: r.user_id,
      claims: prev.claims + 1,
      impressions: prev.impressions + (r.impressions ?? 0),
      clicks: prev.clicks + (r.clicks ?? 0),
      cents: prev.cents + (r.amount_cents ?? 0),
    })
  }

  const allBidders = Array.from(byUser.values()).sort((a, b) => b.claims - a.claims)
  const biddersSpec = pageSpec(q.get('biddersPage'), perPageParam, allBidders.length)
  const biddersPageRows = pageSlice(allBidders, biddersSpec)

  // ── The placements table: only the requested page, counted exactly so the
  // UI can say how many pages there are rather than guessing.
  const claimsCount = await supabase
    .from('spotlight_bids')
    .select('id', { count: 'exact', head: true })
  const total = claimsCount.count ?? null

  const claimsSpec = pageSpec(q.get('claimsPage'), perPageParam, total)
  const { data, error } = await supabase
    .from('spotlight_bids')
    .select('id, user_id, amount_cents, impressions, clicks, starts_at, expires_at, outbid_at, ai_tools(name, slug)')
    .order('starts_at', { ascending: false })
    .range(claimsSpec.from, claimsSpec.to)

  if (error) return NextResponse.json({ claims: [], bidders: [], unavailable: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  // ── Emails: only the ids on screen, across both tables. This is the N+1
  // that used to scale with the whole customer list.
  const needed = new Set<string>()
  for (const r of rows) if (r.user_id) needed.add(r.user_id)
  for (const b of biddersPageRows) if (b.userId) needed.add(b.userId)

  const emails = new Map<string, string>()
  await Promise.all(Array.from(needed).map(async id => {
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

  return NextResponse.json({
    claims,
    claimsPage: { page: claimsSpec.page, perPage: claimsSpec.perPage, totalPages: claimsSpec.totalPages, total: total ?? claims.length },
    bidders: biddersPageRows.map(b => ({
      email: b.userId ? emails.get(b.userId) ?? 'unknown' : 'unknown',
      claims: b.claims,
      impressions: b.impressions,
      clicks: b.clicks,
      cents: b.cents,
    })),
    biddersPage: { page: biddersSpec.page, perPage: biddersSpec.perPage, totalPages: biddersSpec.totalPages, total: allBidders.length },
    // Says so plainly rather than quietly reporting a partial sum.
    rollupTruncated: (lean?.length ?? 0) >= ROLLUP_CEILING,
  })
}

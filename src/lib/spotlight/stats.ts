// Spotlight analytics, for the owner dashboard and the admin overview.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BidRow {
  id: string
  toolName: string
  toolSlug: string
  amountCents: number
  impressions: number
  clicks: number
  startsAt: string
  expiresAt: string
  outbidAt: string | null
  status: 'live' | 'outbid' | 'finished'
}

function statusOf(b: { expires_at: string; outbid_at: string | null }): BidRow['status'] {
  if (b.outbid_at) return 'outbid'
  return new Date(b.expires_at) > new Date() ? 'live' : 'finished'
}

export interface OwnerStats {
  bids: BidRow[]
  totalSpendCents: number
  totalImpressions: number
  totalClicks: number
  /** This user's share of all spotlight impressions ever served, as a percent. */
  shareOfVoice: number
  spendByDay: { date: string; cents: number; impressions: number }[]
}

export async function getOwnerSpotlightStats(userId: string): Promise<OwnerStats> {
  const { data } = await supabase
    .from('spotlight_bids')
    .select('id, amount_cents, impressions, clicks, starts_at, expires_at, outbid_at, ai_tools(name, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  const bids: BidRow[] = rows.map(b => {
    const t = Array.isArray(b.ai_tools) ? b.ai_tools[0] : b.ai_tools
    return {
      id: b.id,
      toolName: t?.name ?? 'Unknown',
      toolSlug: t?.slug ?? '',
      amountCents: b.amount_cents,
      impressions: b.impressions,
      clicks: b.clicks,
      startsAt: b.starts_at,
      expiresAt: b.expires_at,
      outbidAt: b.outbid_at,
      status: statusOf(b),
    }
  })

  const totalImpressions = bids.reduce((n, b) => n + b.impressions, 0)

  // Share of voice needs the whole auction's impressions, not just this user's.
  const { data: allRows } = await supabase.from('spotlight_bids').select('impressions')
  const globalImpressions = (allRows ?? []).reduce((n, r) => n + (r.impressions ?? 0), 0)

  const byDay = new Map<string, { cents: number; impressions: number }>()
  for (const b of bids) {
    const day = b.startsAt.slice(0, 10)
    const prev = byDay.get(day) ?? { cents: 0, impressions: 0 }
    byDay.set(day, { cents: prev.cents + b.amountCents, impressions: prev.impressions + b.impressions })
  }

  return {
    bids,
    totalSpendCents: bids.reduce((n, b) => n + b.amountCents, 0),
    totalImpressions,
    totalClicks: bids.reduce((n, b) => n + b.clicks, 0),
    shareOfVoice: globalImpressions > 0 ? (totalImpressions / globalImpressions) * 100 : 0,
    spendByDay: Array.from(byDay.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30),
  }
}

export interface AdminStats {
  listings: { total: number; active: number; pending: number; claimed: number }
  spotlight: {
    totalBids: number
    uniqueBidders: number
    mockRevenueCents: number
    totalImpressions: number
    totalClicks: number
    highestBidCents: number
    currentHolder: { name: string; amountCents: number; expiresAt: string } | null
  }
  audience: { users: number; marketingConsented: number; unsubscribed: number }
}

export async function getAdminStats(): Promise<AdminStats> {
  const countOf = async (table: string, apply?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (apply) q = apply(q)
    const { count } = await q
    return count ?? 0
  }

  const [total, active, pending, claimed] = await Promise.all([
    countOf('ai_tools'),
    countOf('ai_tools', q => q.eq('status', 'active')),
    countOf('ai_tools', q => q.eq('status', 'pending')),
    countOf('ai_tools', q => q.eq('claimed', true)),
  ])

  // Bid totals are summed in the app because the row count is small; if this
  // ever grows past a few thousand it should become a database aggregate.
  const { data: bids } = await supabase
    .from('spotlight_bids')
    .select('user_id, amount_cents, impressions, clicks, expires_at, outbid_at, ai_tools(name)')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (bids ?? []) as any[]
  const live = rows.find(b => !b.outbid_at && new Date(b.expires_at) > new Date())
  const liveTool = live ? (Array.isArray(live.ai_tools) ? live.ai_tools[0] : live.ai_tools) : null

  const [users, consented, unsubscribed] = await Promise.all([
    countOf('marketing_contacts').catch(() => 0),
    countOf('marketing_contacts', q => q.eq('consent_marketing', true)).catch(() => 0),
    countOf('email_suppressions').catch(() => 0),
  ])

  return {
    listings: { total, active, pending, claimed },
    spotlight: {
      totalBids: rows.length,
      uniqueBidders: new Set(rows.map(b => b.user_id).filter(Boolean)).size,
      mockRevenueCents: rows.reduce((n, b) => n + (b.amount_cents ?? 0), 0),
      totalImpressions: rows.reduce((n, b) => n + (b.impressions ?? 0), 0),
      totalClicks: rows.reduce((n, b) => n + (b.clicks ?? 0), 0),
      highestBidCents: rows.reduce((n, b) => Math.max(n, b.amount_cents ?? 0), 0),
      currentHolder: live && liveTool
        ? { name: liveTool.name, amountCents: live.amount_cents, expiresAt: live.expires_at }
        : null,
    },
    audience: { users, marketingConsented: consented, unsubscribed },
  }
}

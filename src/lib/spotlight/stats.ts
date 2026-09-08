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

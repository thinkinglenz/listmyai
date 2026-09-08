// Spotlight auction totals. Small table, so the rows are summed directly.

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
    .select('user_id, amount_cents, impressions, clicks, expires_at, outbid_at, ai_tools(name)')
    .order('created_at', { ascending: false })
    .limit(1000)

  // The table may not exist yet if the migration has not been run; report zeros
  // rather than failing the whole overview.
  if (error) {
    return NextResponse.json({
      totalBids: 0, uniqueBidders: 0, mockRevenueCents: 0,
      totalImpressions: 0, totalClicks: 0, highestBidCents: 0,
      currentHolder: null, unavailable: true,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  const live = rows.find(b => !b.outbid_at && new Date(b.expires_at) > new Date())
  const liveTool = live ? (Array.isArray(live.ai_tools) ? live.ai_tools[0] : live.ai_tools) : null

  return NextResponse.json({
    totalBids: rows.length,
    uniqueBidders: new Set(rows.map(b => b.user_id).filter(Boolean)).size,
    mockRevenueCents: rows.reduce((n, b) => n + (b.amount_cents ?? 0), 0),
    totalImpressions: rows.reduce((n, b) => n + (b.impressions ?? 0), 0),
    totalClicks: rows.reduce((n, b) => n + (b.clicks ?? 0), 0),
    highestBidCents: rows.reduce((n, b) => Math.max(n, b.amount_cents ?? 0), 0),
    currentHolder: live && liveTool
      ? { name: liveTool.name, amountCents: live.amount_cents, expiresAt: live.expires_at }
      : null,
  })
}

// Spotlight: read the current holder, or place a bid.
//
// Payment is mocked. No gateway is connected, no card details are collected,
// and nothing is charged — a bid records intent and takes the slot. Every row
// is flagged is_mock_payment so real payments stay distinguishable once a
// gateway is added.

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { getCurrentSpotlight, getMinimumNextBid, MIN_BID_CENTS } from '@/lib/spotlight'
import { announceToolToSocial } from '@/lib/social/post'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const [current, minNext] = await Promise.all([getCurrentSpotlight(), getMinimumNextBid()])
  return NextResponse.json({ current, minimumNextBidCents: minNext })
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const sbUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
          c.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )

  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to bid' }, { status: 401 })

  const { toolId, amountCents } = await req.json()
  if (!toolId) return NextResponse.json({ error: 'toolId is required' }, { status: 400 })

  // Flat price. The client does not get to name a figure, so a crafted request
  // cannot claim the slot for a different amount than everyone else pays.
  const amount = MIN_BID_CENTS
  void amountCents

  // Only a live listing may take the slot.
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('id, name, slug, tagline, status, categories(name)')
    .eq('id', toolId)
    .maybeSingle()

  if (!tool || tool.status !== 'active') {
    return NextResponse.json({ error: 'That listing is not live' }, { status: 400 })
  }

  // Who held the slot before this bid, so they can be told they lost it.
  const previous = await getCurrentSpotlight()

  const { data: bid, error } = await supabase.rpc('place_spotlight_bid', {
    p_tool_id: toolId,
    p_user_id: user.id,
    p_amount_cents: amount,
    p_payment_ref: `mock_${randomUUID()}`,
  })

  if (error) {
    // The function raises this when the bid does not beat the live one.
    const already = error.message.match(/ALREADY_HELD:(\S+)/)
    if (already) {
      return NextResponse.json(
        { error: 'This listing already holds the spotlight', heldUntil: already[1] },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Tell the previous holder, and announce the takeover. Both are best-effort:
  // the bid has already been recorded and must not be undone by a failed post.
  if (previous?.isPaid && previous.toolId !== toolId) {
    const { data: outbidRow } = await supabase
      .from('spotlight_bids')
      .select('user_id')
      .eq('id', previous.bidId!)
      .maybeSingle()

    if (outbidRow?.user_id) {
      await supabase.from('notifications').insert({
        user_id: outbidRow.user_id,
        type: 'spotlight_outbid',
        title: `${tool.name} outbid you for the homepage spotlight`,
        body: `Your bid of $${(previous.amountCents / 100).toFixed(2)} was beaten by $${(amount / 100).toFixed(2)}. Bid again to take the spot back.`,
        link: '/dashboard#spotlight',
      }).then(() => {}, () => {})
    }
  }

  // The homepage is cached for five minutes. Somebody who has just paid for
  // the slot should not wait for that to lapse before appearing on it.
  revalidatePath('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cat = (tool as any).categories
  announceToolToSocial({
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline || '',
    category: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? undefined,
  }).catch(() => {})

  return NextResponse.json({ ok: true, bid, mockPayment: true })
}

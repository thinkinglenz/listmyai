// Lemon Squeezy tells us a package was paid for. The signature is checked
// first: this endpoint grants paid placement, so an unsigned request must
// never reach the delivery step.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { PACKAGES, type PackageId } from '@/lib/billing/packages'
import { deliverOrder } from '@/lib/billing/deliver'

// Delivery posts to five networks and renders two cards.
export const maxDuration = 120

function signatureValid(raw: string, header: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !header) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'))
  const given = Buffer.from(header.trim())
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!signatureValid(raw, req.headers.get('x-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }

  const event = body?.meta?.event_name
  if (event !== 'order_created' && event !== 'subscription_payment_success') {
    return NextResponse.json({ ok: true, ignored: event })
  }

  const custom = body?.meta?.custom_data ?? {}
  const pkg = PACKAGES[custom.package as PackageId]
  const attrs = body?.data?.attributes ?? {}
  if (!pkg || !custom.tool_id) return NextResponse.json({ ok: true, ignored: 'no package or listing' })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Unique on (provider, provider_ref), so a retried webhook cannot deliver
  // the same purchase twice.
  const { data: order, error } = await supabase.from('orders').insert({
    tool_id: custom.tool_id,
    user_id: custom.user_id ?? null,
    email: attrs.user_email ?? null,
    package: pkg.id,
    amount_cents: attrs.total ?? pkg.priceCents,
    currency: attrs.currency ?? 'USD',
    provider: 'lemonsqueezy',
    provider_ref: String(body?.data?.id ?? attrs.identifier ?? ''),
  }).select('id').maybeSingle()

  if (error) {
    const duplicate = error.code === '23505'
    return NextResponse.json({ ok: true, duplicate, error: duplicate ? undefined : error.message })
  }
  if (!order) return NextResponse.json({ ok: true })

  const result = await deliverOrder(order.id).catch(e => ({ ok: false, note: String(e) }))
  return NextResponse.json({ ok: true, delivered: result.ok, note: result.note })
}

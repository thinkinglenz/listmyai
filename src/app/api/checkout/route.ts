// Starts a purchase. Lemon Squeezy is the merchant of record, so it collects
// the money, handles VAT and owns the card data — nothing sensitive reaches us.
//
// The listing and package travel in `custom` data, which comes back on the
// webhook. Prices come from our catalogue, never the browser.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { PACKAGES, variantEnvFor, type PackageId } from '@/lib/billing/packages'

export async function POST(req: NextRequest) {
  const { toolId, packageId } = await req.json().catch(() => ({}))
  const pkg = PACKAGES[packageId as PackageId]
  if (!pkg) return NextResponse.json({ error: 'Unknown package' }, { status: 400 })

  const cookieStore = await cookies()
  const sbUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
          c.forEach(({ name, value, options }) => { try { cookieStore.set(name, value, options) } catch {} })
        },
      },
    }
  )
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

  // Only the owner of a listing may buy promotion for it.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: tool } = await admin
    .from('ai_tools').select('id, name, slug, claimed_by, submitted_by').eq('id', toolId).maybeSingle()
  if (!tool) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (tool.claimed_by !== user.id && tool.submitted_by !== user.id) {
    return NextResponse.json({ error: 'You can only promote a listing you own' }, { status: 403 })
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env[variantEnvFor(pkg)]
  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json({ error: 'Payments are not configured yet' }, { status: 503 })
  }

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: { tool_id: tool.id, package: pkg.id, user_id: user.id },
            },
            // The store holds one generic one-time product and one generic
            // monthly product; the buyer sees this package's real name and price.
            custom_price: pkg.priceCents,
            product_options: {
              name: `${pkg.name} — ${tool.name}`,
              description: pkg.summary,
              redirect_url: `https://listmyai.com/dashboard?purchased=${pkg.id}`,
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json().catch(() => ({}))
    const url = data?.data?.attributes?.url
    if (!res.ok || !url) {
      console.warn('[checkout] Lemon Squeezy rejected the request:', JSON.stringify(data).slice(0, 300))
      return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
    }
    return NextResponse.json({ url })
  } catch (e) {
    console.warn('[checkout] failed', e)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}

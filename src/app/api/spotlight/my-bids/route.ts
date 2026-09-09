// A bidder's own spotlight numbers. Scoped to the signed-in user, so one
// bidder can never read another's spend or performance.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOwnerSpotlightStats } from '@/lib/spotlight/stats'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const cookieStore = await cookies()
  const sb = createServerClient(
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

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Whether to show the opt-in alongside the claim, or leave it out because
  // they have already said yes.
  let marketingConsent = false
  if (user.email) {
    const { data } = await admin
      .from('marketing_contacts')
      .select('consent_marketing, unsubscribed_at')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
    marketingConsent = Boolean(data?.consent_marketing && !data.unsubscribed_at)
  }

  const stats = await getOwnerSpotlightStats(user.id)
  return NextResponse.json({ ...stats, marketingConsent })
}

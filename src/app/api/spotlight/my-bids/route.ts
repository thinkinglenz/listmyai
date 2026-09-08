// A bidder's own spotlight numbers. Scoped to the signed-in user, so one
// bidder can never read another's spend or performance.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOwnerSpotlightStats } from '@/lib/spotlight/stats'

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

  return NextResponse.json(await getOwnerSpotlightStats(user.id))
}

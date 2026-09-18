// Counts of anonymous site events for the admin overview.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const count = async (value: string, since?: string) => {
    let q = supabase.from('site_events').select('id', { count: 'exact', head: true })
      .eq('event', 'theme_toggle').eq('value', value)
    if (since) q = q.gte('created_at', since)
    const { count: n } = await q
    return n ?? 0
  }
  const [light, dark, light7, dark7] = await Promise.all([
    count('light'), count('dark'), count('light', weekAgo), count('dark', weekAgo),
  ])
  return NextResponse.json({ themeToggle: { light, dark, total: light + dark, light7, dark7, total7: light7 + dark7 } })
}

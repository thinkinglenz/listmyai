// Listing counts only.
//
// Split from the other stats so one slow query cannot take the overview down
// with it. An exact count over 20,000+ rows means a full scan in Postgres, so
// the total is estimated from the planner; the filtered counts stay exact
// because they are small.

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

  const [total, pending, claimed] = await Promise.all([
    supabase.from('ai_tools').select('*', { count: 'estimated', head: true }),
    supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('claimed', true),
  ])

  return NextResponse.json({
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    claimed: claimed.count ?? 0,
  })
}

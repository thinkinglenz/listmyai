// Every agent enquiry, finished or abandoned.
//
// The abandoned ones are the point. A completed enquiry already reaches the
// inbox; what could never be seen before is the visitor who answered two
// questions and left, which is the difference between "no traffic" and "the
// form is asking the wrong things".

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { pageSpec } from '@/lib/paginate'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const q = req.nextUrl.searchParams
  const status = q.get('status') // 'complete' | 'open' | null for all

  let countQuery = supabase.from('agent_enquiries').select('id', { count: 'exact', head: true })
  if (status === 'complete' || status === 'open') countQuery = countQuery.eq('status', status)
  const { count, error: countErr } = await countQuery

  // The table may not exist yet if the migration has not been run. Say so
  // plainly rather than rendering an empty list that looks like "no leads".
  if (countErr) {
    return NextResponse.json({
      enquiries: [], unavailable: true,
      hint: 'The agent_enquiries table is not there yet — run the migration.',
    })
  }

  const spec = pageSpec(q.get('page'), q.get('perPage'), count ?? null)

  let rowsQuery = supabase
    .from('agent_enquiries')
    .select('id, conversation_id, agent_slug, status, turns, summary, contact_name, contact_email, page_path, delivered, delivery_error, transcript, created_at, updated_at')
    .order('created_at', { ascending: false })
    .range(spec.from, spec.to)
  if (status === 'complete' || status === 'open') rowsQuery = rowsQuery.eq('status', status)

  const { data, error } = await rowsQuery
  if (error) return NextResponse.json({ enquiries: [], unavailable: true, hint: error.message })

  // Rollup across everything, not just this page: three completed out of
  // forty started is the headline, and a per-page figure would hide it.
  const totals = await supabase.from('agent_enquiries').select('status, delivered')
  const all = totals.data ?? []
  const completed = all.filter(r => r.status === 'complete').length

  return NextResponse.json({
    enquiries: data ?? [],
    page: { page: spec.page, perPage: spec.perPage, totalPages: spec.totalPages, total: count ?? 0 },
    stats: {
      total: all.length,
      completed,
      abandoned: all.length - completed,
      undelivered: all.filter(r => r.status === 'complete' && !r.delivered).length,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Count query (same filters, no pagination)
  let countQuery = supabase
    .from('ai_tools')
    .select('*', { count: 'exact', head: true })
  if (status && status !== 'all') countQuery = countQuery.eq('status', status)
  if (search) countQuery = countQuery.ilike('name', `%${search}%`)
  const { count: totalCount } = await countQuery

  // Data query with pagination
  let query = supabase
    .from('ai_tools')
    .select('id, name, slug, website, status, claimed, upvotes, rating_avg, rating_count, created_at, category_id, categories(name)')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    tools: data ?? [],
    page,
    pageSize: PAGE_SIZE,
    total: totalCount ?? 0,
    totalPages: Math.ceil((totalCount ?? 0) / PAGE_SIZE),
  })
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  const { error } = await supabase
    .from('ai_tools')
    .update({ status })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.from('ai_tools').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

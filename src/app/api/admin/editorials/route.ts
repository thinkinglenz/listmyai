// The editorial review queue.
//
// Publishing lives here and nowhere else. The generator writes drafts, this
// route is the only thing that can set status to 'published', and it is behind
// requireAdmin — so an editorial reaches the public only because a person
// read it and said so.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { notifyOwnerOfEditorial } from '@/lib/editorial/notify'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  const { data, error } = await sb
    .from('editorials')
    .select('id, tool_id, slug, title, standfirst, body_md, sources, coverage_note, status, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Corrections sent in by owners, newest first, so they sit beside the piece
  // they are about.
  const { data: corrections } = await sb
    .from('editorial_corrections')
    .select('id, editorial_slug, email, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ editorials: data ?? [], corrections: corrections ?? [] })
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req)
  if (denied) return denied

  const body = await req.json().catch(() => ({})) as {
    id?: string
    action?: 'publish' | 'unpublish' | 'delete' | 'save' | 'resolve-correction'
    title?: string
    standfirst?: string
    body_md?: string
    coverage_note?: string | null
  }
  const { id, action } = body
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  if (action === 'resolve-correction') {
    const { error } = await sb.from('editorial_corrections').update({ status: 'resolved' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const { error } = await sb.from('editorials').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'save') {
    const patch: Record<string, unknown> = {}
    if (typeof body.title === 'string') patch.title = body.title
    if (typeof body.standfirst === 'string') patch.standfirst = body.standfirst
    if (typeof body.body_md === 'string') patch.body_md = body.body_md
    if (body.coverage_note !== undefined) patch.coverage_note = body.coverage_note
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
    const { error } = await sb.from('editorials').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'unpublish') {
    const { error } = await sb.from('editorials')
      .update({ status: 'draft', published_at: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // publish
  const { data: row, error: readErr } = await sb
    .from('editorials').select('tool_id, slug, title, status').eq('id', id).maybeSingle()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'No such editorial' }, { status: 404 })

  const { error } = await sb.from('editorials')
    .update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The owner is told only on the transition into published, and only once:
  // re-publishing something already public would otherwise mail them again.
  let notified: Awaited<ReturnType<typeof notifyOwnerOfEditorial>> = { ok: false, skipped: 'Already published' }
  if (row.status !== 'published') {
    try {
      notified = await notifyOwnerOfEditorial(row.tool_id, row.slug, row.title)
    } catch (e) {
      // A failed email must not leave the piece unpublished — it is already live.
      notified = { ok: false, skipped: e instanceof Error ? e.message : 'Notification failed' }
    }
  }

  return NextResponse.json({ ok: true, notified })
}

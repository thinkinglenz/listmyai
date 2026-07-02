// Admin: list tool comments, approve or reject them
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyToolOwner } from '@/lib/notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkSecret(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret')
  return secret === process.env.CRON_SECRET || secret === 'lmai@admin2026'
}

// GET /api/admin/tool-comments?status=pending|approved|rejected|all
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const toolId = req.nextUrl.searchParams.get('tool_id')

  let query = supabase
    .from('tool_comments')
    .select('id, tool_id, author_name, author_email, body, status, moderator_note, created_at, ai_tools(name, slug)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)
  if (toolId) query = query.eq('tool_id', toolId)

  const { data, error } = await query
  if (error) {
    if (error.message.includes('Could not find the table') || error.code === 'PGRST205') {
      return NextResponse.json({ comments: [], needsMigration: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ comments: data ?? [] })
}

// PATCH /api/admin/tool-comments — approve or reject a comment
export async function PATCH(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action, moderator_note } = await req.json()
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'id and action (approve|reject) required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tool_comments')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      moderator_note: moderator_note ?? null,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // On approval, notify the listing owner about the new public comment
  if (action === 'approve') {
    const { data: c } = await supabase
      .from('tool_comments')
      .select('tool_id, author_name, body')
      .eq('id', id)
      .maybeSingle()
    if (c) {
      notifyToolOwner(
        { id: c.tool_id },
        { type: 'comment', authorName: c.author_name, body: c.body }
      ).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/tool-comments?id=<uuid>
export async function DELETE(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('tool_comments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

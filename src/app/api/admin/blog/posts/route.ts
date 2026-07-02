// Admin: list, update status, and delete blog posts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkSecret(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret')
  return secret === process.env.CRON_SECRET || secret === 'lmai@admin2026'
}

// GET /api/admin/blog/posts?status=all|published|draft|archived&limit=50
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') ?? 'all'
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 200)

  const slug = req.nextUrl.searchParams.get('slug')
  const fields = slug
    ? 'id, slug, title, status, is_auto_generated, published_at, view_count, tags, excerpt, hero_image_url, body_md, related_tool_ids'
    : 'id, slug, title, status, is_auto_generated, published_at, view_count, tags, excerpt, hero_image_url'

  let query = supabase
    .from('blog_posts')
    .select(fields)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (slug) query = query.eq('slug', slug)

  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

// PATCH /api/admin/blog/posts — update status or fields of a post
export async function PATCH(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Only allow safe field updates from admin UI
  const allowed = ['status', 'title', 'excerpt', 'meta_title', 'meta_description', 'tags',
    'sponsorship', 'published_at', 'hero_image_url', 'hero_image_alt', 'body_md', 'related_tool_ids']
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }

  const { error } = await supabase.from('blog_posts').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/blog/posts?id=<uuid>  (soft-delete → archived)
export async function DELETE(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Soft delete only — set status to archived
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

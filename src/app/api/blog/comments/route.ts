import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

// Public anon client for reading approved comments
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service role for inserting (bypasses RLS so we can control status field)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/blog/comments?post_id=<uuid> — returns approved comments
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { data, error } = await anonClient
    .from('blog_comments')
    .select('id, author_name, body, created_at')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

// POST /api/blog/comments — submit a comment (must be signed in)
export async function POST(req: NextRequest) {
  // Build SSR client to read session from cookies
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // read-only in route handler
        },
      },
    }
  )

  const { data: { session } } = await ssrClient.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in to comment.' }, { status: 401 })
  }

  const body = await req.json()
  const { post_id, body: commentBody } = body

  if (!post_id || typeof post_id !== 'string') {
    return NextResponse.json({ error: 'post_id required' }, { status: 400 })
  }
  if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length < 3) {
    return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 })
  }
  if (commentBody.length > 2000) {
    return NextResponse.json({ error: 'Comment is too long (max 2000 chars).' }, { status: 400 })
  }

  // Verify post exists and is published
  const { data: post } = await anonClient
    .from('blog_posts')
    .select('id')
    .eq('id', post_id)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

  const userName = session.user.user_metadata?.full_name
    ?? session.user.email?.split('@')[0]
    ?? 'Anonymous'

  const { error } = await adminClient.from('blog_comments').insert({
    post_id,
    user_id: session.user.id,
    author_name: userName,
    author_email: session.user.email,
    body: commentBody.trim(),
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}

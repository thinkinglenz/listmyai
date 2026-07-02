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

// GET /api/tools/comments?tool_id=<uuid> — returns approved comments
export async function GET(req: NextRequest) {
  const toolId = req.nextUrl.searchParams.get('tool_id')
  if (!toolId) return NextResponse.json({ error: 'tool_id required' }, { status: 400 })

  const { data, error } = await anonClient
    .from('tool_comments')
    .select('id, author_name, body, created_at')
    .eq('tool_id', toolId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) {
    // Table not created yet — show empty rather than erroring
    if (error.message.includes('Could not find the table') || error.code === 'PGRST205') {
      return NextResponse.json({ comments: [] })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ comments: data ?? [] })
}

// POST /api/tools/comments — submit a comment (must be signed in)
export async function POST(req: NextRequest) {
  const ssrClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll() { /* read-only in route handler */ },
      },
    }
  )

  const { data: { user } } = await ssrClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to comment.' }, { status: 401 })
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Please verify your email address before posting a comment.' },
      { status: 403 }
    )
  }

  const { tool_id, body: commentBody } = await req.json()

  if (!tool_id || typeof tool_id !== 'string') {
    return NextResponse.json({ error: 'tool_id required' }, { status: 400 })
  }
  if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length < 3) {
    return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 })
  }
  if (commentBody.length > 2000) {
    return NextResponse.json({ error: 'Comment is too long (max 2000 chars).' }, { status: 400 })
  }

  // Verify tool exists and is active
  const { data: tool } = await anonClient
    .from('ai_tools')
    .select('id')
    .eq('id', tool_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!tool) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 })

  const userName = user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'Anonymous'

  const { error } = await adminClient.from('tool_comments').insert({
    tool_id,
    user_id: user.id,
    author_name: userName,
    author_email: user.email,
    body: commentBody.trim(),
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}

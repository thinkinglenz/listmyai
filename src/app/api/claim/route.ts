import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/claim  — authenticated user claims ownership of an auto-enrolled listing.
// Body: { tool_id: string }
// Auth: Supabase JWT in Authorization header.

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

function supabaseForUser(jwt: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '').trim()
  if (!jwt) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Verify token and get user
  const userClient = supabaseForUser(jwt)
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let body: { tool_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tool_id } = body
  if (!tool_id) {
    return NextResponse.json({ error: 'tool_id is required' }, { status: 422 })
  }

  const admin = supabaseAdmin()

  // Check tool exists and is unclaimed
  const { data: tool, error: fetchError } = await admin
    .from('ai_tools')
    .select('id, name, claimed_by, status')
    .eq('id', tool_id)
    .single()

  if (fetchError || !tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  }

  if (tool.claimed_by) {
    return NextResponse.json({ error: 'This listing is already claimed' }, { status: 409 })
  }

  // Assign ownership
  const { error: updateError } = await admin
    .from('ai_tools')
    .update({ claimed_by: user.id, claimed: true, updated_at: new Date().toISOString() })
    .eq('id', tool_id)

  if (updateError) {
    console.error('[claim] update error', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send welcome email via /api/email (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    fetch(`${appUrl}/api/email/claim-welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.IMPORT_SECRET}` },
      body: JSON.stringify({ email: user.email, tool_name: tool.name }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, tool_id, claimed_by: user.id })
}
